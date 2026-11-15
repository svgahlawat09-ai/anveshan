import os, json, re, time, asyncio
from urllib.parse import urlparse
import httpx, trafilatura
from rapidfuzz import fuzz
from google import genai
from tavily import TavilyClient
from dotenv import load_dotenv
from prompts import (
    DECOMPOSE_PROMPT,
    EXTRACT_PROMPT,
    JUDGE_PROMPT,
    PDF_EXTRACT_CLAIMS_PROMPT,
    URL_EXTRACT_CLAIMS_PROMPT,
)

load_dotenv(override=True)

def get_genai_client():
    api_key = os.environ.get("GEMINI_API_KEY", "")
    return genai.Client(api_key=api_key)

def get_tavily_client():
    api_key = os.environ.get("TAVILY_API_KEY", "")
    return TavilyClient(api_key=api_key)

raw_models = [
    os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
    os.getenv("GEMINI_FALLBACK_MODEL", "gemini-1.5-flash"),
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-flash-lite",
]
MODELS = []
for m in raw_models:
    if m and m not in MODELS:
        MODELS.append(m)

ALLOWED = {"supported", "partially_supported", "contradicted", "not_established", "insufficient_evidence"}


def fill(template, **kw):
    for k, v in kw.items():
        template = template.replace(f"<<{k}>>", str(v))
    return template


def ask_json(prompt):
    llm = get_genai_client()
    last = None
    for model in MODELS:
        for attempt in range(2):
            try:
                r = llm.models.generate_content(
                    model=model, contents=prompt,
                    config={"response_mime_type": "application/json", "temperature": 0.1})
                txt = (r.text or "").strip()
                txt = re.sub(r"^```(?:json)?|```$", "", txt).strip()
                data = json.loads(txt)
                return data
            except Exception as e:
                last = e
                err_str = str(e).lower()
                print(f"[Gemini] Error with model '{model}' (attempt {attempt + 1}): {e}")
                if "429" in err_str or "quota" in err_str or "not found" in err_str or "404" in err_str:
                    break
                time.sleep(1)
    raise RuntimeError(f"Gemini failed across models: {last}")


def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", "", (s or "").lower())).strip()


def quote_exists(quote, page_text):
    q, p = norm(quote), norm(page_text)
    if len(q) < 15:
        return False
    return q in p or fuzz.partial_ratio(q, p) >= 85


def mark_dependent(evidence):
    for i, a in enumerate(evidence):
        for b in evidence[:i]:
            if a.get("domain") != b.get("domain") and fuzz.ratio(norm(a.get("quote", "")), norm(b.get("quote", ""))) > 80:
                a["dependent_on"] = b.get("domain")
                break


def dedupe_by_url(hits):
    seen, out = set(), []
    for h in hits:
        if h.get("url") and h["url"] not in seen:
            seen.add(h["url"])
            out.append(h)
    return out


async def fetch_text(url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        }
        async with httpx.AsyncClient(timeout=8, follow_redirects=True, headers=headers) as c:
            r = await c.get(url)
        return trafilatura.extract(r.text) or ""
    except Exception as e:
        print(f"[Fetch] Could not extract text from {url}: {e}")
        return ""


def simple_report(label, summary, missing=None, stats=None, language="English", guidance=None):
    rep = {
        "overall": {
            "label": label,
            "summary": summary,
            "coverage": "low",
            "source_quality": "low",
        },
        "subclaims": [],
        "missing": missing or [],
        "stats": stats or {"sources_read": 0, "quotes_proposed": 0, "quotes_verified": 0},
        "limitations": "Based on sources found at the time of checking. Anveshan shows what evidence exists; it is not a final authority.",
        "original_language": language,
    }
    if guidance:
        rep["guidance"] = guidance
    return rep


async def extract_claims_from_pdf_text(text: str) -> dict:
    prompt = fill(PDF_EXTRACT_CLAIMS_PROMPT, TEXT=text[:6000])
    res = await asyncio.to_thread(ask_json, prompt)
    if isinstance(res, list):
        res = res[0] if res and isinstance(res[0], dict) else {}
    return res if isinstance(res, dict) else {"primary_claim": text[:300], "additional_claims": []}


async def extract_claims_from_url_text(url: str, text: str) -> dict:
    prompt = fill(URL_EXTRACT_CLAIMS_PROMPT, URL=url, TEXT=text[:6000])
    res = await asyncio.to_thread(ask_json, prompt)
    if isinstance(res, list):
        res = res[0] if res and isinstance(res[0], dict) else {}
    return res if isinstance(res, dict) else {"primary_claim": text[:300], "additional_claims": []}


async def run_pipeline(text, progress):
    text = text.strip()[:2000]

    progress("Detecting language and breaking claim into checkable parts…")
    plan = await asyncio.to_thread(ask_json, fill(DECOMPOSE_PROMPT, TEXT=text))
    if isinstance(plan, list):
        plan = plan[0] if plan and isinstance(plan[0], dict) else {}
    if not isinstance(plan, dict):
        plan = {}

    user_language = plan.get("language", "English")

    # Step 9: Handle advice / non-factual statements gracefully
    if not plan.get("is_checkable", True):
        guidance = plan.get("guidance", "This statement appears to be advice or an opinion rather than an independently verifiable factual claim.")
        summary = guidance
        return simple_report(
            "not_established",
            summary,
            missing=["A specific, testable factual proposition"],
            language=user_language,
            guidance=guidance,
        )

    if not plan.get("subclaims"):
        return simple_report(
            "insufficient_evidence",
            "No independently verifiable factual assertions could be isolated from this input.",
            language=user_language,
        )

    progress("Searching supporting, challenging and official sources…")
    queries = plan.get("queries", [])[:6]
    search_client = get_tavily_client()

    async def do_search(q_item):
        query_text = q_item.get("q", "")
        if not query_text:
            return {"results": []}
        try:
            return await asyncio.to_thread(search_client.search, query_text, max_results=3)
        except Exception as e:
            print(f"[Tavily] Search failed for '{query_text}': {e}")
            return {"results": []}

    search_results = await asyncio.gather(*[do_search(q) for q in queries])
    hits = []
    for res in search_results:
        for r in res.get("results", []):
            hits.append({"url": r.get("url", ""), "snippet": r.get("content", "")})

    hits = dedupe_by_url(hits)[:8]
    if not hits:
        return simple_report(
            "insufficient_evidence",
            "No relevant sources were found across search indexes for this claim.",
            ["Official government announcement or independent empirical report"],
            language=user_language,
        )

    progress("Reading the actual pages…")
    pages = await asyncio.gather(*[fetch_text(h["url"]) for h in hits])
    docs = []
    for h, t in zip(hits, pages):
        body = t or h["snippet"]
        if body:
            docs.append({"url": h["url"], "text": body})

    progress("Extracting exact passages and verifying quotes…")
    docs_blob = "\n\n".join(f"[DOC {i}] {d['url']}\n{d['text'][:3500]}" for i, d in enumerate(docs))
    out = await asyncio.to_thread(ask_json, fill(
        EXTRACT_PROMPT, SUBCLAIMS=json.dumps(plan["subclaims"]), DOCS=docs_blob))

    if isinstance(out, list):
        proposed = out
    elif isinstance(out, dict):
        proposed = out.get("evidence", [])
    else:
        proposed = []

    evidence = []
    for ev in proposed:
        if not isinstance(ev, dict):
            continue
        try:
            doc_idx = int(ev.get("doc_id", -1))
            d = docs[doc_idx]
        except Exception:
            continue
        if not quote_exists(ev.get("quote", ""), d["text"]):
            continue  # Drop quotes not literally verified on the page
        ev["verified"] = True
        ev["url"] = d["url"]
        ev["domain"] = urlparse(d["url"]).netloc.removeprefix("www.")
        evidence.append(ev)

    stats = {
        "sources_read": len(docs),
        "quotes_proposed": len(proposed),
        "quotes_verified": len(evidence),
    }

    if not evidence:
        return simple_report(
            "insufficient_evidence",
            "Sources were retrieved, but none contained a verifiable verbatim passage directly addressing this claim.",
            ["An official publication or primary document that directly assesses this proposition"],
            stats=stats,
            language=user_language,
        )

    progress("Checking whether sources are independent…")
    mark_dependent(evidence)

    progress("Weighing the evidence and assessing claims…")
    slim = [
        {
            "index": i,
            **{
                k: e.get(k)
                for k in (
                    "subclaim_id",
                    "quote",
                    "relation",
                    "source_type",
                    "published",
                    "domain",
                    "dependent_on",
                )
            },
        }
        for i, e in enumerate(evidence)
    ]

    report = await asyncio.to_thread(
        ask_json,
        fill(
            JUDGE_PROMPT,
            TEXT=text,
            LANGUAGE=user_language,
            SUBCLAIMS=json.dumps(plan["subclaims"]),
            EVIDENCE=json.dumps(slim),
        ),
    )

    if isinstance(report, list):
        report = report[0] if report and isinstance(report[0], dict) else {}
    if not isinstance(report, dict):
        report = {}

    overall = report.setdefault("overall", {})
    if not isinstance(overall, dict):
        overall = {"label": "insufficient_evidence", "summary": str(overall)}
        report["overall"] = overall

    if overall.get("label") not in ALLOWED:
        overall["label"] = "insufficient_evidence"

    raw_subclaims = report.get("subclaims", [])
    if isinstance(raw_subclaims, list):
        for sc in raw_subclaims:
            if not isinstance(sc, dict):
                continue
            if sc.get("status") not in ALLOWED:
                sc["status"] = "insufficient_evidence"
            idxs = [
                i
                for i in sc.pop("evidence_indexes", [])
                if isinstance(i, int) and 0 <= i < len(evidence)
            ]
            sc["evidence"] = [evidence[i] for i in idxs]
    else:
        report["subclaims"] = []

    # Fallback subclaims if omitted
    if not report.get("subclaims") and plan.get("subclaims"):
        report["subclaims"] = [
            {
                "id": sc.get("id", f"S{i+1}"),
                "text": sc.get("text", ""),
                "status": overall.get("label", "insufficient_evidence"),
                "explanation": overall.get("summary", ""),
                "evidence": evidence[:2],
            }
            for i, sc in enumerate(plan.get("subclaims", []))
        ]

    report.setdefault("missing", [])
    report["stats"] = stats
    report["limitations"] = (
        "Based on sources found at the time of checking. "
        "Anveshan shows what evidence exists; it is not a final authority."
    )
    report["original_language"] = user_language
    return report
