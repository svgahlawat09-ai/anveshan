DECOMPOSE_PROMPT = """You are a claim analyst. The text may be in Hindi, English or Hinglish.
Text: \"\"\"<<TEXT>>\"\"\"

Return ONLY JSON:
{
 "language": "...",
 "is_checkable": true,
 "subclaims": [{"id":"S1","text":"atomic verifiable statement, in English","type":"statistic|event|policy|scientific|attribution|other"}],
 "queries": [{"subclaim_id":"S1","direction":"support|challenge|official","q":"search query"}]
}
Rules:
- is_checkable is false for pure opinion, greetings or jokes.
- Max 3 subclaims.
- Write at most 6 queries in total. Across the subclaims, cover three directions: confirmation, contradiction/debunking, and official/primary source.
- Queries must be neutral. Never write 'proof that X is true'. Keep dates and names from the text."""

EXTRACT_PROMPT = """Subclaims being investigated: <<SUBCLAIMS>>

Below are documents. Find passages relevant to the subclaims.
<<DOCS>>

Return ONLY JSON:
{"evidence":[{
  "subclaim_id":"S1",
  "doc_id": 0,
  "quote":"EXACT text copied character-for-character from that document (1-3 sentences)",
  "relation":"supports|contradicts|partially_supports|context|does_not_establish",
  "source_type":"government|primary_report|news|fact_check|blog|social|other",
  "published":"date if stated in the text, else null"
}]}
CRITICAL: copy quotes verbatim, never paraphrase, never invent. Max 8 evidence items. If nothing is relevant return {"evidence":[]}."""

JUDGE_PROMPT = """Original text: \"\"\"<<TEXT>>\"\"\"
Subclaims: <<SUBCLAIMS>>
Verified evidence (each has an index): <<EVIDENCE>>

For each subclaim pick a status using ONLY this evidence:
supported | partially_supported | contradicted | not_established | insufficient_evidence
Rules:
- Evidence with dependent_on set counts as ONE source with the one it copies, not two.
- If no official, primary or independent source addresses a subclaim, use insufficient_evidence.
- Check population, geography and time period of every statistic and flag mismatches.
- Use NO outside knowledge. No evidence, no conclusion.
Return ONLY JSON:
{"overall":{"label":"<status>","summary":"2 plain sentences","coverage":"low|medium|high","source_quality":"low|medium|high"},
 "subclaims":[{"id":"S1","text":"...","status":"<status>","explanation":"1-2 sentences","evidence_indexes":[0,2]}],
 "missing":["what evidence would settle this"]}"""
