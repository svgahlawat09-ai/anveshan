// ---------------------------------------------------------------------------
// Anveshan demonstration investigation data.
// EVERY source, excerpt, date and URL below is ILLUSTRATIVE DEMONSTRATION
// CONTENT for this frontend prototype. No real investigation has been run and
// no real source is quoted. The UI labels every surface that shows this data.
// ---------------------------------------------------------------------------

export type Stance =
  | "supports"
  | "contradicts"
  | "partial"
  | "contextual"
  | "insufficient";

export type Assessment =
  | "Supported"
  | "Contradicted"
  | "Partially Supported"
  | "Inconclusive";

export interface QualityIndicator {
  dimension: string;
  level: "high" | "moderate" | "limited";
  note: string;
}

export interface EvidenceItem {
  id: string;
  subclaimId: string;
  stance: Stance;
  sourceTitle: string;
  publisher: string;
  sourceType: string;
  publishedAt: string; // ISO date (demonstration)
  excerpt: string;
  url: string; // may be "" when the claim carries no traceable source
  quality: QualityIndicator[];
}

export interface Subclaim {
  id: string;
  index: string;
  text: string;
  assessment: Assessment;
  assessmentStance: Stance;
  verdict: string;
}

export interface DemoInvestigation {
  id: string;
  title: string;
  claim: string;
  overallAssessment: Assessment;
  overallNote: string;
  subclaims: Subclaim[];
  evidence: EvidenceItem[];
  sourcesExamined: number;
  executiveSummary: string[];
  missingContext: string[];
  sourceLimitations: string[];
  established: string[];
  uncertain: string[];
  conclusion: string;
}

const q = (
  authority: [QualityIndicator["level"], string],
  originality: [QualityIndicator["level"], string],
  recency: [QualityIndicator["level"], string],
  traceability: [QualityIndicator["level"], string],
  independence: [QualityIndicator["level"], string],
  methodology: [QualityIndicator["level"], string],
): QualityIndicator[] => [
  { dimension: "Source Authority", level: authority[0], note: authority[1] },
  { dimension: "Originality", level: originality[0], note: originality[1] },
  { dimension: "Recency", level: recency[0], note: recency[1] },
  { dimension: "Traceability", level: traceability[0], note: traceability[1] },
  { dimension: "Independence", level: independence[0], note: independence[1] },
  { dimension: "Methodology", level: methodology[0], note: methodology[1] },
];

export const demoInvestigation: DemoInvestigation = {
  id: "demo-india-unemployment",
  title: "India's Unemployment Rate Among Developing Countries",
  claim:
    "India has the highest unemployment rate among all developing countries.",
  overallAssessment: "Contradicted",
  overallNote:
    "The core cross-country comparison is contradicted by 2023 official and modelled data. Measurement caveats remain and a narrower youth-unemployment reading is partially supported.",
  sourcesExamined: 14,
  subclaims: [
    {
      id: "s1",
      index: "01",
      text: "India has a higher unemployment rate than other developing countries.",
      assessment: "Contradicted",
      assessmentStance: "contradicts",
      verdict:
        "2023 modelled and survey data place India's unemployment rate below most large developing economies, including South Africa, Brazil and Indonesia. The core comparison does not hold at the aggregate level.",
    },
    {
      id: "s2",
      index: "02",
      text: "The comparison uses equivalent unemployment measurement methods.",
      assessment: "Inconclusive",
      assessmentStance: "insufficient",
      verdict:
        "Sources apply differing definitions (usual status, weekly status, modelled estimates). The claim names no dataset or definition, so methodological equivalence cannot be established either way.",
    },
    {
      id: "s3",
      index: "03",
      text: "The data refers to the same time period.",
      assessment: "Partially Supported",
      assessmentStance: "partial",
      verdict:
        "A common 2023 reference year exists across ILOSTAT and World Bank series and overlaps the PLFS 2023-24 round — but circulating versions of this claim frequently mix survey rounds several years apart.",
    },
  ],
  evidence: [
    {
      id: "ev-01",
      subclaimId: "s1",
      stance: "contradicts",
      sourceTitle: "ILOSTAT Modelled Estimates — Unemployment Rate, India",
      publisher: "International Labour Organization",
      sourceType: "Official statistics",
      publishedAt: "2024-05-01",
      excerpt:
        "ILO modelled estimates place India's unemployment rate at approximately 4.2% of the labour force in 2023 — well below South Africa (29.6%), Brazil (7.4%), Indonesia (5.3%) and Nigeria (4.9%) among large developing economies.",
      url: "https://ilostat.ilo.org/data/unemployment/",
      quality: q(
        ["high", "UN agency statistical database"],
        ["high", "Primary modelled estimates"],
        ["high", "2023 reference year"],
        ["high", "Open dataset with download API"],
        ["high", "No commercial interest in outcome"],
        ["moderate", "Modelled series, not a direct survey"],
      ),
    },
    {
      id: "ev-02",
      subclaimId: "s1",
      stance: "contradicts",
      sourceTitle: "Periodic Labour Force Survey Annual Report 2023-24",
      publisher: "MoSPI, Government of India",
      sourceType: "Official survey",
      publishedAt: "2024-09-23",
      excerpt:
        "The unemployment rate for persons aged 15 years and above under the usual status approach was estimated at 3.2%, down from 6.0% in 2017-18.",
      url: "https://mospi.gov.in",
      quality: q(
        ["high", "National statistical office"],
        ["high", "Original household survey"],
        ["high", "2023-24 reference period"],
        ["moderate", "Report PDF; unit-level data by request"],
        ["moderate", "Published by the government under assessment"],
        ["high", "Large stratified national sample"],
      ),
    },
    {
      id: "ev-03",
      subclaimId: "s1",
      stance: "partial",
      sourceTitle: "India Employment Report 2024",
      publisher: "Institute for Human Development / ILO",
      sourceType: "Research report",
      publishedAt: "2024-03-18",
      excerpt:
        "While aggregate unemployment remains moderate, youth unemployment in India is estimated above 10% and exceeds the global average for the same age group — a sharply uneven picture by age and education.",
      url: "https://www.ilo.org/publications/india-employment-report-2024",
      quality: q(
        ["high", "Joint institutional research programme"],
        ["moderate", "Synthesis of secondary series"],
        ["high", "Covers up to 2023"],
        ["high", "Publicly downloadable report"],
        ["high", "Independent research institutes"],
        ["high", "Documented aggregation method"],
      ),
    },
    {
      id: "ev-04",
      subclaimId: "s1",
      stance: "contextual",
      sourceTitle: "Consumer Pyramids Household Survey — methodology note",
      publisher: "Centre for Monitoring Indian Economy (CMIE)",
      sourceType: "Private dataset",
      publishedAt: "2024-01-10",
      excerpt:
        "CPHS applies a weekly-status definition of unemployment that is broader than the usual-status approach used in official surveys; headline rates are therefore not directly comparable across sources.",
      url: "https://consumerpyramidsdx.cmie.com",
      quality: q(
        ["moderate", "Established private research firm"],
        ["high", "Original private panel survey"],
        ["high", "Rolling monthly collection"],
        ["limited", "Gated behind commercial licence"],
        ["high", "Independent of government"],
        ["moderate", "Methodology criticised in academic literature"],
      ),
    },
    {
      id: "ev-05",
      subclaimId: "s2",
      stance: "contextual",
      sourceTitle:
        "Standards and definitions: unemployment across national statistical systems",
      publisher: "ILO Department of Statistics",
      sourceType: "Methodological publication",
      publishedAt: "2023-11-02",
      excerpt:
        "Unemployment definitions vary across countries in reference period, work-seeking requirement and treatment of unpaid family work; cross-country rankings that ignore these differences can reverse the relative position of two economies.",
      url: "https://ilostat.ilo.org/resources/concepts-and-definitions/",
      quality: q(
        ["high", "Global statistical standards body"],
        ["high", "Primary methodological standards"],
        ["moderate", "Standing publication, periodically revised"],
        ["high", "Openly published reference"],
        ["high", "No stake in national comparisons"],
        ["high", "Definitional authority for ILO members"],
      ),
    },
    {
      id: "ev-06",
      subclaimId: "s2",
      stance: "insufficient",
      sourceTitle: "The claim as circulated on social media",
      publisher: "Not applicable — unsourced claim",
      sourceType: "Unsourced statement",
      publishedAt: "2025-01-01",
      excerpt:
        "The circulating version of the claim cites no dataset, reference year or definition of unemployment, so no measurement comparison can be verified from the claim itself.",
      url: "",
      quality: q(
        ["limited", "No attributable publisher"],
        ["limited", "No underlying data"],
        ["limited", "Date of circulation unknown"],
        ["limited", "Nothing to trace"],
        ["limited", "Provenance unknown"],
        ["limited", "No stated method"],
      ),
    },
    {
      id: "ev-07",
      subclaimId: "s3",
      stance: "partial",
      sourceTitle:
        "World Development Indicators — Unemployment, total (% of labour force)",
      publisher: "World Bank",
      sourceType: "Official statistics",
      publishedAt: "2024-06-27",
      excerpt:
        "The WDI series reports comparable annual unemployment estimates for 2023 across economies, overlapping the PLFS 2023-24 reference period within a single calendar year.",
      url: "https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS",
      quality: q(
        ["high", "Multilateral development institution"],
        ["moderate", "Harmonised from national sources"],
        ["high", "2023 reference year"],
        ["high", "Open indicator API"],
        ["high", "No commercial interest"],
        ["moderate", "Harmonisation choices not fully published"],
      ),
    },
    {
      id: "ev-08",
      subclaimId: "s3",
      stance: "contextual",
      sourceTitle: "India Employment Report 2024 — data coverage note",
      publisher: "Institute for Human Development / ILO",
      sourceType: "Research report",
      publishedAt: "2024-03-18",
      excerpt:
        "Trends cited in the report span 2000–2023, while several widely shared comparisons rely on the 2017-18 survey round; period mismatches of up to six years appear in circulating versions of this claim.",
      url: "https://www.ihdindia.org",
      quality: q(
        ["high", "Joint institutional research programme"],
        ["moderate", "Secondary compilation"],
        ["high", "Documents period coverage explicitly"],
        ["high", "Publicly downloadable"],
        ["high", "Independent research institutes"],
        ["moderate", "Coverage note, not new fieldwork"],
      ),
    },
    {
      id: "ev-09",
      subclaimId: "s3",
      stance: "supports",
      sourceTitle: "ILOSTAT country profiles — India and comparators, 2023",
      publisher: "International Labour Organization",
      sourceType: "Official statistics",
      publishedAt: "2024-05-01",
      excerpt:
        "The 2023 ILOSTAT series provides a common reference year for India, South Africa, Brazil, Indonesia and Nigeria, allowing a like-for-like annual comparison across the set of economies.",
      url: "https://ilostat.ilo.org/data/country-profiles/",
      quality: q(
        ["high", "UN agency statistical database"],
        ["high", "Primary harmonised series"],
        ["high", "2023 reference year"],
        ["high", "Open country profiles"],
        ["high", "No commercial interest"],
        ["high", "Single harmonised methodology"],
      ),
    },
  ],
  executiveSummary: [
    "The claim asserts that India holds the highest unemployment rate among all developing countries. Investigation decomposed it into three verifiable subclaims and examined 14 candidate sources, of which 9 carried sufficient traceability to include as demonstration evidence.",
    "Against the most directly comparable 2023 data (ILOSTAT modelled estimates and the World Bank's World Development Indicators), India's aggregate unemployment rate sits well below those of several large developing economies. India's own official PLFS 2023-24 estimate is lower still. The central cross-country comparison is therefore contradicted, not supported.",
    "Two caveats keep the picture from being closed outright. First, unemployment is measured differently across systems — definitions, reference periods and harmonisation choices can reorder rankings, and the claim itself cites no dataset, leaving methodological equivalence inconclusive. Second, a narrower reading is partially supported: youth unemployment in India is elevated and exceeds the global average for that age group. The evidence contradicts the claim as stated while showing why the claim circulates.",
  ],
  missingContext: [
    "Age and education structure: aggregate rates conceal a much weaker youth labour market, which is likely the observation behind the viral claim.",
    "Definition and reference period: 'unemployment rate' varies by status concept (usual vs weekly) across the sources in circulation; the claim never states which one it uses.",
    "Comparator set: 'all developing countries' is undefined. Rankings change materially depending on which economies enter the comparison.",
    "Underemployment and informal work: low unemployment can coexist with poor job quality, a dimension the claim's framing ignores entirely.",
  ],
  sourceLimitations: [
    "ILOSTAT figures for India are modelled estimates harmonised across countries, not a direct census of Indian labour — precision at the second decimal is not meaningful.",
    "CMIE's Consumer Pyramids Household Survey is commercially licensed, limiting independent replication of its headline rates.",
    "The PLFS is published by the government whose performance it describes; independence is rated moderate for that reason.",
    "Excerpts shown are demonstration extracts positioned for this prototype; in a live investigation each would carry verbatim quotes from the cited document.",
  ],
  established: [
    "On comparable 2023 data, India's aggregate unemployment rate is lower than several large developing economies — the claim's central ranking fails.",
    "A common reference year exists across ILOSTAT and World Bank series for a like-for-like comparison.",
    "Youth unemployment in India is elevated relative to the global average for the same age group.",
  ],
  uncertain: [
    "Which measurement definition the original claim intended — it cites no source, so methodological equivalence cannot be judged.",
    "India's exact rank across the full set of developing economies, which depends on the comparator set chosen.",
    "Whether the claim's underlying observation refers to youth, graduate, or urban unemployment rather than the aggregate rate.",
  ],
  conclusion:
    "The evidence contradicts the claim as stated: on the most directly comparable 2023 data, India does not have the highest unemployment rate among developing countries. What remains uncertain is narrower — the claim cites no dataset or definition, so the exact comparison its author intended cannot be reconstructed, and the elevated youth-unemployment picture partially explains the claim's persistence. A reader should reject the claim in its circulated form while treating measurement-aware reformulations as an open empirical question.",
};

// ---------------------------------------------------------------------------
// Landing-page content
// ---------------------------------------------------------------------------

export const EXAMPLE_CLAIMS = [
  "India has the highest unemployment rate among all developing countries.",
  "Electric vehicles produce more lifetime carbon emissions than petrol cars.",
  "Drinking coffee every day extends human life expectancy.",
];

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Submit a claim",
    body: "Paste a statement, a URL or a document. Anything that asserts something checkable.",
  },
  {
    step: "02",
    title: "Analyse the statement",
    body: "Anveshan identifies the assertion, its scope, and the hidden assumptions it depends on.",
  },
  {
    step: "03",
    title: "Discover sources",
    body: "The system searches official statistics, research literature, original publications and press coverage.",
  },
  {
    step: "04",
    title: "Evaluate evidence",
    body: "Each source is read for stance, methodology and independence — supporting, contradicting or contextualising the claim.",
  },
  {
    step: "05",
    title: "Generate an investigation report",
    body: "A structured dossier: what is established, what is contradicted, and what remains genuinely uncertain.",
  },
];

export interface FrameworkCategory {
  stance: Stance;
  label: string;
  headline: string;
  description: string;
  example: string;
}

export const FRAMEWORK: FrameworkCategory[] = [
  {
    stance: "supports",
    label: "SUPPORTS",
    headline: "Evidence that affirms the claim",
    description:
      "Sources whose own data directly backs the subclaim — with originality and authority checked, not assumed.",
    example:
      "ILOSTAT's 2023 series provides a common reference year for India and its comparators, enabling a like-for-like comparison.",
  },
  {
    stance: "contradicts",
    label: "CONTRADICTS",
    headline: "Evidence that refutes the claim",
    description:
      "Sources that directly oppose the subclaim, or show the comparison failing against better-measured data.",
    example:
      "2023 modelled and survey data place India's unemployment rate below South Africa, Brazil and Indonesia.",
  },
  {
    stance: "partial",
    label: "PARTIALLY SUPPORTS",
    headline: "Evidence that supports a narrower version",
    description:
      "Evidence that backs a qualified reading of the claim while the general statement overreaches it.",
    example:
      "Youth unemployment in India exceeds the global average for that age group — true, but not the claim as stated.",
  },
  {
    stance: "contextual",
    label: "CONTEXTUAL",
    headline: "Evidence that reframes the claim",
    description:
      "Material that does not settle the subclaim but changes how it must be read — definitions, periods, scope.",
    example:
      "Unemployment definitions vary across national statistical systems, so raw cross-country rankings can mislead.",
  },
  {
    stance: "insufficient",
    label: "INSUFFICIENT EVIDENCE",
    headline: "Where the trail goes cold",
    description:
      "When nothing traceable exists to evaluate a subclaim, Anveshan says so explicitly instead of guessing.",
    example:
      "The circulating claim cites no dataset, reference year or definition — nothing to verify against.",
  },
];

export const FAQ_ITEMS = [
  {
    q: "What is Anveshan?",
    a: "Anveshan is an evidence investigation platform. You submit a claim, and it decomposes the claim into independently verifiable subclaims, finds original sources, and reports what the evidence actually establishes — including where it conflicts or runs out.",
  },
  {
    q: "How does claim investigation work?",
    a: "Each investigation runs five stages: parsing the claim, decomposing it into subclaims, discovering candidate sources, evaluating evidence for stance and quality, and compiling a structured report. Every conclusion in the report is mapped back to specific, quoted evidence.",
  },
  {
    q: "Does Anveshan use original sources?",
    a: "Yes. Anveshan prioritises official statistics, peer-reviewed research and original publications over commentary. Every evidence item shows its publisher, publication date and a traceable link, and originality — primary data vs secondary citation — is an explicit quality indicator.",
  },
  {
    q: "What happens when evidence is insufficient?",
    a: "The investigation says so. Subclaims that cannot be evaluated from traceable evidence receive an explicit INSUFFICIENT EVIDENCE verdict rather than a guess, and the report separates what is established from what remains uncertain.",
  },
  {
    q: "Is Anveshan a traditional fact-checking website?",
    a: "No. A fact-checker publishes a verdict; Anveshan publishes the investigation. You see the subclaim decomposition, every excerpt, the conflicts between sources, the quality of each source, and the boundaries of what the evidence can settle — so you can disagree with the reasoning, not just the rating.",
  },
];
