import uuid, hashlib
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pipeline import run_pipeline

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

JOBS = {}    # job_id -> status
CACHE = {}   # claim hash -> finished report (makes repeat demos instant and free)


class Req(BaseModel):
    text: str
    page_url: str | None = None


@app.get("/")
def root():
    return {"message": "Anveshan backend is running!", "health": "/health", "docs": "/docs"}


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/investigate")
async def investigate(req: Req, bg: BackgroundTasks):
    key = hashlib.sha256(req.text.strip().lower().encode()).hexdigest()
    job_id = uuid.uuid4().hex
    if key in CACHE:
        JOBS[job_id] = {"status": "done", "step": "Cached", "report": CACHE[key]}
    else:
        JOBS[job_id] = {"status": "running", "step": "Starting…", "report": None}
        bg.add_task(_run, job_id, req.text, key)
    return {"job_id": job_id}


async def _run(job_id, text, key):
    def progress(step):
        print(f"[{job_id[:8]}] Step: {step}")
        JOBS[job_id]["step"] = step
    try:
        print(f"[{job_id[:8]}] Starting investigation for: {text[:80]}...")
        report = await run_pipeline(text, progress)
        CACHE[key] = report
        JOBS[job_id].update(status="done", report=report)
        print(f"[{job_id[:8]}] Completed successfully.")
    except Exception as e:
        import traceback
        print(f"[{job_id[:8]}] Pipeline failed: {e}")
        traceback.print_exc()
        JOBS[job_id].update(status="failed", step=str(e)[:300])


@app.get("/result/{job_id}")
def result(job_id: str):
    return JOBS.get(job_id, {"status": "failed", "step": "Unknown job (did the server restart?)"})
