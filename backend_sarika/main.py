import os, uuid, hashlib, socket, ipaddress, io
from urllib.parse import urlsplit
from fastapi import FastAPI, BackgroundTasks, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import pypdf
from pipeline import (
    run_pipeline,
    fetch_text,
    extract_claims_from_pdf_text,
    extract_claims_from_url_text,
)

app = FastAPI(title="Anveshan API", version="2.0.0")

# Step 8: Configure CORS for Vercel production, preview deployments, and local dev
frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
allowed_origins = [
    "https://anveshan.vercel.app",
    "https://your-anveshan.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

JOBS = {}    # job_id -> status & report
CACHE = {}   # claim hash -> finished report (makes repeat demos instant and free)


class Req(BaseModel):
    text: str
    page_url: str | None = None


class UrlReq(BaseModel):
    url: str


def validate_safe_url(url: str) -> str:
    """Validate URL scheme and block requests to private/internal addresses (SSRF prevention)."""
    parsed = urlsplit(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=400,
            detail="Only HTTP and HTTPS URLs are supported."
        )
    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(status_code=400, detail="Invalid URL format.")

    try:
        addr_info = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise HTTPException(status_code=400, detail="Could not resolve hostname.")

    for entry in addr_info:
        ip_str = entry[4][0]
        try:
            ip = ipaddress.ip_address(ip_str)
            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_multicast
                or ip.is_reserved
                or ip.is_unspecified
            ):
                raise HTTPException(
                    status_code=400,
                    detail="Access to private or internal network addresses is blocked (SSRF protection).",
                )
        except ValueError:
            continue
    return url


@app.get("/")
def root():
    return {
        "message": "Anveshan API is active and ready",
        "health": "/health",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"ok": True}


# ---------------------------------------------------------------------------
# Text Investigation
# ---------------------------------------------------------------------------
@app.post("/investigate")
async def investigate(req: Req, bg: BackgroundTasks):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Claim text cannot be empty.")

    key = hashlib.sha256(text.lower().encode()).hexdigest()
    job_id = uuid.uuid4().hex

    if key in CACHE:
        JOBS[job_id] = {"status": "done", "step": "Cached", "report": CACHE[key]}
    else:
        JOBS[job_id] = {"status": "running", "step": "Starting…", "report": None}
        bg.add_task(_run_text, job_id, text, key)

    return {"job_id": job_id}


async def _run_text(job_id, text, key):
    def progress(step):
        print(f"[{job_id[:8]}] Step: {step}")
        if job_id in JOBS:
            JOBS[job_id]["step"] = step

    try:
        print(f"[{job_id[:8]}] Starting text investigation for: {text[:80]}...")
        report = await run_pipeline(text, progress)
        CACHE[key] = report
        JOBS[job_id].update(status="done", step="Complete", report=report)
        print(f"[{job_id[:8]}] Completed successfully.")
    except Exception as e:
        import traceback
        print(f"[{job_id[:8]}] Pipeline failed: {e}")
        traceback.print_exc()
        if job_id in JOBS:
            JOBS[job_id].update(status="failed", step=str(e)[:300])


# ---------------------------------------------------------------------------
# URL Investigation (with safe SSRF validation)
# ---------------------------------------------------------------------------
@app.post("/investigate/url")
async def investigate_url(req: UrlReq, bg: BackgroundTasks):
    safe_url = validate_safe_url(req.url.strip())
    key = hashlib.sha256(f"url:{safe_url}".encode()).hexdigest()
    job_id = uuid.uuid4().hex

    if key in CACHE:
        JOBS[job_id] = {"status": "done", "step": "Cached", "report": CACHE[key]}
    else:
        JOBS[job_id] = {"status": "running", "step": "Connecting to webpage…", "report": None}
        bg.add_task(_run_url, job_id, safe_url, key)

    return {"job_id": job_id}


async def _run_url(job_id, url, key):
    def progress(step):
        print(f"[{job_id[:8]}] Step: {step}")
        if job_id in JOBS:
            JOBS[job_id]["step"] = step

    try:
        progress("Safely fetching article content…")
        page_text = await fetch_text(url)
        if not page_text or len(page_text.strip()) < 50:
            raise RuntimeError("Could not extract readable article text from the URL.")

        progress("Extracting primary claim from article…")
        claims_data = await extract_claims_from_url_text(url, page_text)
        primary_claim = claims_data.get("primary_claim", "").strip() or page_text[:200]

        progress(f"Investigating extracted claim: '{primary_claim[:60]}…'")
        report = await run_pipeline(primary_claim, progress)
        report["page_url"] = url
        report["extracted_claims"] = [primary_claim] + claims_data.get("additional_claims", [])

        CACHE[key] = report
        JOBS[job_id].update(status="done", step="Complete", report=report)
        print(f"[{job_id[:8]}] Completed URL investigation successfully.")
    except Exception as e:
        import traceback
        print(f"[{job_id[:8]}] URL Pipeline failed: {e}")
        traceback.print_exc()
        if job_id in JOBS:
            JOBS[job_id].update(status="failed", step=str(e)[:300])


# ---------------------------------------------------------------------------
# PDF Investigation (multipart/form-data upload with 10 MB limit & pypdf)
# ---------------------------------------------------------------------------
@app.post("/investigate/pdf")
async def investigate_pdf(bg: BackgroundTasks, file: UploadFile = File(...)):
    filename = file.filename or "uploaded.pdf"
    if not filename.lower().endswith(".pdf") and file.content_type not in (
        "application/pdf",
        "application/x-pdf",
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a PDF document.",
        )

    # 10 MB upload limit
    max_bytes = 10 * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds 10 MB limit (received {len(contents) / (1024*1024):.1f} MB).",
        )

    # Validate and extract PDF text using pypdf
    try:
        reader = pypdf.PdfReader(io.BytesIO(contents))
        if len(reader.pages) == 0:
            raise HTTPException(status_code=400, detail="The PDF contains no pages.")
        text_parts = []
        for page in reader.pages:
            pt = page.extract_text()
            if pt:
                text_parts.append(pt)
        full_text = "\n".join(text_parts).strip()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Malformed or encrypted PDF document: {str(e)[:120]}",
        )

    if len(full_text) < 20:
        raise HTTPException(
            status_code=400,
            detail="The uploaded PDF contains no extractable text. Please ensure it is not a scanned image without OCR.",
        )

    key = hashlib.sha256(f"pdf:{hashlib.sha256(contents).hexdigest()}".encode()).hexdigest()
    job_id = uuid.uuid4().hex

    if key in CACHE:
        JOBS[job_id] = {"status": "done", "step": "Cached", "report": CACHE[key]}
    else:
        JOBS[job_id] = {"status": "running", "step": "Processing PDF text…", "report": None}
        bg.add_task(_run_pdf, job_id, full_text, key, filename)

    return {"job_id": job_id, "filename": filename, "extracted_chars": len(full_text)}


async def _run_pdf(job_id, pdf_text, key, filename):
    def progress(step):
        print(f"[{job_id[:8]}] Step: {step}")
        if job_id in JOBS:
            JOBS[job_id]["step"] = step

    try:
        progress("Extracting core assertions from PDF…")
        claims_data = await extract_claims_from_pdf_text(pdf_text)
        primary_claim = claims_data.get("primary_claim", "").strip() or pdf_text[:200]

        progress(f"Investigating document claim: '{primary_claim[:60]}…'")
        report = await run_pipeline(primary_claim, progress)
        report["document_filename"] = filename
        report["extracted_claims"] = [primary_claim] + claims_data.get("additional_claims", [])

        CACHE[key] = report
        JOBS[job_id].update(status="done", step="Complete", report=report)
        print(f"[{job_id[:8]}] Completed PDF investigation successfully.")
    except Exception as e:
        import traceback
        print(f"[{job_id[:8]}] PDF Pipeline failed: {e}")
        traceback.print_exc()
        if job_id in JOBS:
            JOBS[job_id].update(status="failed", step=str(e)[:300])


# ---------------------------------------------------------------------------
# Result polling
# ---------------------------------------------------------------------------
@app.get("/result/{job_id}")
def result(job_id: str):
    return JOBS.get(
        job_id,
        {"status": "failed", "step": "Unknown job (did the server restart?)"},
    )
