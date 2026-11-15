import os, json, re, time, asyncio
from urllib.parse import urlparse
import httpx, trafilatura
from rapidfuzz import fuzz
from google import genai
from tavily import TavilyClient
from dotenv import load_dotenv
from prompts import DECOMPOSE_PROMPT, EXTRACT_PROMPT, JUDGE_PROMPT

load_dotenv(override=True)
llm = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
search = TavilyClient(api_key=os.environ.get("TAVILY_API_KEY", ""))

# Prefer gemini-3.5-flash-lite (fast and has full quota)
raw_models = [
    os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
    os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.1-flash-lite"),
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
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
                # If rate-limited or model not available, jump immediately to the next model
                if "429" in err_str or "quota" in err_str or "not found" in err_str or "404" in err_str:
                    break
                time.sleep(1)
    raise RuntimeError(f"Gemini failed: {last}")


def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", "", s.lower())).strip()


def quote_exists(quote, page_text):
    q, p = norm(quote), norm(page_text)
    if len(q) < 15:
        return False
    return q in p or fuzz.partial_ratio(q, p) >= 85


def mark_dependent(evidence):
    for i, a in enumerate(evidence):
        for b in evidence[:i]:
            if a["domain"] != b["domain"] and fuzz.ratio(norm(a["quote"]), norm(b["quote"])) > 80:
                a["dependent_on"] = b["domain"]
                break


def dedupe_by_url(hits):
    seen, out = set(), []
    for h in hits:
        if h["url"] not in seen:
            seen.add(h["url"])
            out.append(h)
    return out


async def fetch_text(url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        }
        async with httpx.AsyncClient(timeout=7, follow_redirects=True, headers=headers) as c:
            r = await c.get(url)
        return trafilatura.extract(r.text) or ""
    except Exception:
        return ""


def simple_report(label, summary, missing=None, stats=None):
    return {"overall": {"label": label, "summary": summary, "coverage": "low", "source_quality": "low"},
            "subclaims": [], "missing": missing or [], "stats": stats,
            "limitations": "Based on sources found at the time of checking. Anveshan shows what evidence exists; it is not a final authority."}


async def run_pipeline(text, progress):
    text = text.strip()[:1500]

    progress("Breaking the claim into checkable parts…")
    plan = await asyncio.to_thread(ask_json, fill(DECOMPOSE_PROMPT, TEXT=text))
    if isinstance(plan, list):
        plan = plan[0] if plan and isinstance(plan[0], dict) else {}
    if not isinstance(plan, dict) or not plan.get("is_checkable", True) or not plan.get("subclaims"):
        return simple_report("insufficient_evidence",
                             "This looks like an opinion or non-factual statement, so there is nothing to verify.")

    progress("Searching supporting, challenging and official sources…")
    queries = plan.get("queries", [])[:6]

    async def do_search(q_item):
        try:
            return await asyncio.to_thread(search.search, q_item["q"], max_results=3)
        except Exception as e:
            print(f"[Tavily] Search failed for '{q_item.get('q')}': {e}")
            return {"results": []}

    search_results = await asyncio.gather(*[do_search(q) for q in queries])
    hits = []
    for res in search_results:
        for r in res.get("results", []):
            hits.append({"url": r["url"], "snippet": r.get("content", "")})

    hits = dedupe_by_url(hits)[:8]
    if not hits:
        return simple_report("insufficient_evidence", "No relevant sources were found for this claim.",
                             ["Any official announcement or independent report"])

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
            d = docs[int(ev["doc_id"])]
        except Exception:
            continue
        if not quote_exists(ev.get("quote", ""), d["text"]):
            continue                      # DROP anything not literally on the page
        ev["verified"] = True
        ev["url"] = d["url"]
        ev["domain"] = urlparse(d["url"]).netloc.removeprefix("www.")
        evidence.append(ev)
    stats = {"sources_read": len(docs), "quotes_proposed": len(proposed), "quotes_verified": len(evidence)}

    if not evidence:
        return simple_report("insufficient_evidence",
                             "Sources were found, but none contained a verifiable passage about this claim.",
                             ["An official or primary source that directly addresses the claim"], stats)

    progress("Checking whether sources are independent…")
    mark_dependent(evidence)

    progress("Weighing the evidence…")
    slim = [{"index": i, **{k: e.get(k) for k in
             ("subclaim_id", "quote", "relation", "source_type", "published", "domain", "dependent_on")}}
            for i, e in enumerate(evidence)]
    report = await asyncio.to_thread(ask_json, fill(
        JUDGE_PROMPT, TEXT=text, SUBCLAIMS=json.dumps(plan["subclaims"]), EVIDENCE=json.dumps(slim)))

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
            idxs = [i for i in sc.pop("evidence_indexes", []) if isinstance(i, int) and 0 <= i < len(evidence)]
            sc["evidence"] = [evidence[i] for i in idxs]
    else:
        report["subclaims"] = []

    # Fallback subclaims if Gemini omitted them
    if not report.get("subclaims") and plan.get("subclaims"):
        report["subclaims"] = [
            {
                "id": sc.get("id", f"S{i}"),
                "text": sc.get("text", ""),
                "status": overall.get("label", "insufficient_evidence"),
                "explanation": overall.get("summary", ""),
                "evidence": evidence[:2]
            }
            for i, sc in enumerate(plan.get("subclaims", []))
        ]

    report.setdefault("missing", [])
    report["stats"] = stats
    report["limitations"] = ("Based on sources found at the time of checking. "
                             "Anveshan shows what evidence exists; it is not a final authority.")
    return report
