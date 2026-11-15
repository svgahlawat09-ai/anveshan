DECOMPOSE_PROMPT = """You are a senior multilingual claim analyst.
The user text may be in English, Hindi (Devanagari), Hinglish (Hindi written in Roman alphabet), or a mix of languages.

User input text:
\"\"\"<<TEXT>>\"\"\"

Analyze the text and return ONLY JSON with this exact schema:
{
  "language": "English | Hindi | Hinglish | Other",
  "is_checkable": true,
  "claim_type": "scientific_health | economic | political | event | policy | advice_opinion | other",
  "guidance": "Optional guidance if the input is not directly checkable (e.g., if advice or opinion, what factual assertion could be tested?)",
  "interpreted_claim": "The core factual proposition translated into clear English, preserving original nuance and context",
  "subclaims": [
    {
      "id": "S1",
      "text": "Atomic verifiable factual statement in English",
      "type": "statistic | event | policy | scientific | attribution | other"
    }
  ],
  "queries": [
    {
      "subclaim_id": "S1",
      "direction": "support | challenge | official",
      "q": "search query in English"
    }
  ]
}

Strict Rules:
1. Multilingual Understanding:
   - Accurately recognize Roman Hindi (e.g., "Maggi khane se cancer hota hai" -> Scientific health claim about Maggi and cancer).
   - Accurately recognize Hindi (e.g., "भारत में बेरोजगारी बढ़ रही है" -> Economic claim about India's unemployment trends).
   - Accurately recognize English (e.g., "5G causes cancer" -> Scientific claim about 5G radiation health risks).
2. Advice vs Factual Claims:
   - Pure advice, imperatives, or personal opinions (e.g., "Don't eat Maggi", "Drink warm water every morning") are NOT directly factual claims.
   - For advice or opinion, set "is_checkable": false, and in "guidance" ask what specific factual assertion the user wants checked (e.g., "This is advice. Did you want to verify whether Maggi contains harmful lead, MSG, or carcinogenic substances?").
3. Subclaims:
   - Provide up to 3 atomic subclaims.
   - Subclaims must be objective assertions that can be independently verified with evidence.
4. Search Queries:
   - Provide 3 to 6 neutral search queries total in English.
   - Cover three key directions:
     1) Supporting evidence
     2) Challenging / debunking evidence
     3) Official government, scientific registry, or primary statistical sources.
   - Keep queries strictly neutral. Never search biased phrases like "proof that X is true".
"""

EXTRACT_PROMPT = """Subclaims being investigated:
<<SUBCLAIMS>>

Below are retrieved source documents. Find exact verbatim passages relevant to the subclaims.
<<DOCS>>

Return ONLY JSON:
{
  "evidence": [
    {
      "subclaim_id": "S1",
      "doc_id": 0,
      "quote": "EXACT text copied character-for-character from that document (1-3 sentences)",
      "relation": "supports | contradicts | partially_supports | context | does_not_establish",
      "source_type": "government | primary_report | news | fact_check | blog | social | other",
      "published": "date if stated in the text, else null"
    }
  ]
}

CRITICAL:
- Copy quotes verbatim from the document text. Never paraphrase, never summarize, never invent quotes.
- Maximum 8 evidence items. If no passage addresses the claim, return {"evidence": []}.
"""

JUDGE_PROMPT = """Original user text: \"\"\"<<TEXT>>\"\"\"
Language of user input: <<LANGUAGE>>
Subclaims: <<SUBCLAIMS>>
Verified evidence (with document index and metadata): <<EVIDENCE>>

For each subclaim, assign a transparent assessment label using ONLY the verified evidence:
supported | partially_supported | contradicted | not_established | insufficient_evidence

Rules:
1. Syndicated Sources: Evidence with dependent_on set counts as ONE single source with the one it copied, not two independent confirmations.
2. Lack of Evidence: If no primary, official, or independent source addresses a subclaim, assign "insufficient_evidence".
3. Mismatches: Check population, geography, definitions, and time period of any statistics. Flag mismatches in the explanation.
4. Nuance: Do not force every assertion into a binary TRUE/FALSE. Use "partially_supported" or "contradicted" when appropriate.
5. User Language:
   - Generate "overall.summary" and "subclaims[].explanation" in the language matching the user's original input (<<LANGUAGE>>).
   - If the input was in Hindi, write the explanation and summary in natural, grammatically correct Hindi.
   - If the input was in Hinglish, write in natural, user-friendly Hinglish or Hindi.
   - If the input was in English, write in clear English.

Return ONLY JSON:
{
  "overall": {
    "label": "supported | partially_supported | contradicted | not_established | insufficient_evidence",
    "summary": "2-3 plain sentences summarizing the findings in the user's language",
    "coverage": "low | medium | high",
    "source_quality": "low | medium | high"
  },
  "subclaims": [
    {
      "id": "S1",
      "text": "...",
      "status": "supported | partially_supported | contradicted | not_established | insufficient_evidence",
      "explanation": "1-2 sentences explaining how evidence weighs on this subclaim in the user's language",
      "evidence_indexes": [0, 2]
    }
  ],
  "missing": ["Specific missing primary evidence or context needed to settle this claim definitively"]
}
"""

PDF_EXTRACT_CLAIMS_PROMPT = """You are analyzing an uploaded document.
Document Text:
\"\"\"<<TEXT>>\"\"\"

Extract the core factual assertions made in this document.
Return ONLY JSON:
{
  "title": "Short title describing document or topic",
  "primary_claim": "The single most significant, verifiable factual claim asserted in the document",
  "additional_claims": ["Secondary factual claim 1", "Secondary factual claim 2"]
}
If the document does not make verifiable factual claims, provide a concise summary of the document in primary_claim.
"""

URL_EXTRACT_CLAIMS_PROMPT = """You are analyzing a webpage article.
Article URL: <<URL>>
Article Text:
\"\"\"<<TEXT>>\"\"\"

Identify the primary factual assertion or news claim made by this article.
Return ONLY JSON:
{
  "title": "Article headline or topic",
  "primary_claim": "The central verifiable factual claim asserted by the article",
  "additional_claims": ["Secondary claim 1"]
}
"""
