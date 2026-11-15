import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  ChevronDown,
  Compass,
  FileSearch,
  GitBranch,
  Puzzle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroAnimation from "@/components/HeroAnimation";
import { StanceBadge } from "@/components/stance";
import {
  FAQ_ITEMS,
  FRAMEWORK,
  HOW_IT_WORKS,
  demoInvestigation,
} from "@/data/demoInvestigation";

const FEATURES = [
  {
    icon: Puzzle,
    title: "Claim Decomposition",
    body: "Break complex statements into independently verifiable subclaims, each judged on its own evidence.",
  },
  {
    icon: FileSearch,
    title: "Evidence Discovery",
    body: "Discover original sources — official statistics, research papers and primary publications — not just commentary about them.",
  },
  {
    icon: GitBranch,
    title: "Contradiction Detection",
    body: "Find conflicting information, isolate disagreements between sources, and show exactly where they diverge.",
  },
  {
    icon: Compass,
    title: "Contextual Investigation",
    body: "Understand limitations, missing information and the context that determines how a claim should be read.",
  },
];

function SectionHeading({
  overline,
  title,
  lede,
  testid,
}: {
  overline: string;
  title: string;
  lede?: string;
  testid?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8D2939]">
        {overline}
      </p>
      <h2
        data-testid={testid}
        className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#292522] sm:text-4xl"
      >
        {title}
      </h2>
      {lede && <p className="mt-4 leading-relaxed text-[#5C544E]">{lede}</p>}
    </div>
  );
}

function FaqRow({
  item,
  open,
  onToggle,
  index,
}: {
  item: { q: string; a: string };
  open: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <div className="border-b border-[#D8CDB0]" data-testid={`faq-item-${index}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        data-testid={`faq-toggle-${index}`}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="font-heading text-lg font-medium text-[#292522]">
          {item.q}
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-[#8D2939] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="pb-5 pr-8 text-sm leading-relaxed text-[#5C544E]">
          {item.a}
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  const [frameworkIdx, setFrameworkIdx] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const active = FRAMEWORK[frameworkIdx];
  const supporting = demoInvestigation.evidence.find((e) => e.id === "ev-09");
  const contradicting = demoInvestigation.evidence.find((e) => e.id === "ev-01");

  return (
    <div className="min-h-screen bg-[#F5EFD5]">
      <Navbar />

      {/* ---------------- HERO ---------------- */}
      <section
        className="relative overflow-hidden bg-[#221E1C]"
        data-testid="hero-section"
      >
        <div className="absolute inset-0 opacity-70">
          <HeroAnimation />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pt-32 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#F39291]">
              Anveshan — Evidence Investigation Lab
            </p>
            <h1 className="mt-5 font-heading text-5xl font-semibold leading-[1.05] tracking-tight text-[#F5EFD5] sm:text-6xl lg:text-7xl">
              QUESTION EVERYTHING.
              <br />
              <span className="italic text-[#F39291]">FOLLOW THE EVIDENCE.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#D8CDB0]">
              Don't just believe what you see. Investigate what supports it.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/investigate"
                data-testid="hero-cta-investigation"
                className="inline-flex items-center gap-2 rounded-sm bg-[#8D2939] px-6 py-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#741F2D]"
              >
                Start Investigation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                data-testid="hero-cta-explore"
                className="inline-flex items-center gap-2 rounded-sm border border-[#D8CDB0] px-6 py-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-[#F5EFD5] transition-colors hover:border-[#F39291] hover:text-[#F39291]"
              >
                Explore the System
              </a>
            </div>
          </motion.div>
        </div>
        <div className="relative border-t border-[#4A423C] bg-[#221E1C]/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-4 sm:px-6 lg:px-8">
            {["Subclaim decomposition", "Source traceability", "Conflict transparency", "Explicit uncertainty"].map(
              (t) => (
                <span
                  key={t}
                  className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#D8CDB0]"
                >
                  {t}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ---------------- ABOUT ---------------- */}
      <section id="about" className="scroll-mt-20" data-testid="about-section">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:px-8">
          <SectionHeading
            overline="About Anveshan"
            title="Truth deserves more than a quick search."
            testid="about-heading"
          />
          <div className="space-y-5 leading-relaxed text-[#3D3834] lg:pt-12">
            <p>
              Information is everywhere. Verifiable evidence is much harder to find.
              Every day, claims about economies, health, technology and politics
              circulate faster than anyone can check them — and most checks stop at
              the first plausible search result.
            </p>
            <p>
              Anveshan helps users examine claims instead of absorbing them. It
              decomposes a statement into independently verifiable subclaims, traces
              each one to original sources — official reports, research papers,
              primary publications — and lays out what supports the claim, what
              contradicts it, and what the available evidence simply cannot settle.
            </p>
            <p className="border-l-2 border-[#F39291] pl-4 font-heading text-lg italic text-[#292522]">
              The result is not a verdict handed down, but an investigation you can
              read, question and retrace.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="border-y border-[#D8CDB0] bg-[#EFE8CC]" data-testid="features-section">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            overline="Capabilities"
            title="An investigation engine, not a chatbot."
            lede="Four capabilities work together to turn an assertion into a structured, source-backed investigation."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" }}
                className="hover-lift flex flex-col border border-[#D8CDB0] bg-white p-6"
                data-testid={`feature-block-${i}`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#FCE8E6] text-[#8D2939]">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-[#D8CDB0]">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-heading text-xl font-semibold text-[#292522]">
                  {f.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#5C544E]">
                  {f.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- EVIDENCE FRAMEWORK ---------------- */}
      <section id="framework" className="scroll-mt-20" data-testid="framework-section">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            overline="Evidence Framework"
            title="Every source is classified, never blurred."
            lede="Anveshan sorts evidence into five explicit categories. Select a category to see what it means and how it appears in a report."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-[380px_1fr]">
            <div className="flex flex-col gap-2" role="list" data-testid="framework-category-list">
              {FRAMEWORK.map((c, i) => (
                <button
                  key={c.stance}
                  type="button"
                  role="listitem"
                  onClick={() => setFrameworkIdx(i)}
                  data-testid={`framework-category-${c.stance}`}
                  aria-pressed={frameworkIdx === i}
                  className={`flex items-center justify-between rounded-sm border px-4 py-3.5 text-left transition-colors ${STANCE_CLASS(i, frameworkIdx)}`}
                >
                  <span className="font-mono text-xs font-medium tracking-[0.18em]">
                    {c.label}
                  </span>
                  <ArrowRight
                    className={`h-4 w-4 transition-opacity ${frameworkIdx === i ? "opacity-100" : "opacity-0"}`}
                  />
                </button>
              ))}
            </div>
            <div
              className="rounded-sm border border-[#D8CDB0] bg-white p-7"
              data-testid="framework-detail"
            >
              <StanceBadge stance={active.stance} />
              <h3 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-[#292522]">
                {active.headline}
              </h3>
              <p className="mt-3 leading-relaxed text-[#5C544E]">{active.description}</p>
              <div className="mt-6 border-t border-[#EFE8CC] pt-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8D2939]">
                  From the demonstration investigation
                </p>
                <p className="mt-2 border-l-2 border-[#8D2939] pl-4 font-heading text-[15px] italic leading-relaxed text-[#3D3834]">
                  "{active.example}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-y border-[#D8CDB0] bg-[#EFE8CC]"
        data-testid="how-it-works-section"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            overline="How It Works"
            title="Five stages from assertion to report."
          />
          <div className="relative mt-14">
            <div
              aria-hidden
              className="absolute left-0 right-0 top-5 hidden border-t border-[#D8CDB0] lg:block"
            />
            <ol className="grid gap-8 lg:grid-cols-5" role="list">
              {HOW_IT_WORKS.map((s, i) => (
                <li key={s.step} className="relative" data-testid={`how-step-${s.step}`}>
                  <div className="flex items-center gap-3 lg:block">
                    <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#8D2939] bg-[#F5EFD5] font-mono text-xs font-medium text-[#8D2939]">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-semibold leading-snug text-[#292522]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#5C544E]">{s.body}</p>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <span aria-hidden className="mt-3 hidden font-mono text-[10px] text-[#D8CDB0] lg:hidden" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------------- SAMPLE INVESTIGATION ---------------- */}
      <section className="scroll-mt-20" data-testid="sample-section">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              overline="Sample Investigation"
              title="What a finished investigation looks like."
              testid="sample-heading"
            />
            <span className="rounded-sm border border-[#F2D48A] bg-[#FEF3D6] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B4800]">
              Demonstration data
            </span>
          </div>

          <div className="mt-10 border border-[#D8CDB0] bg-white" data-testid="sample-investigation-card">
            <div className="border-b border-[#EFE8CC] bg-[#221E1C] px-6 py-5 sm:px-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F39291]">
                Claim under investigation
              </p>
              <p className="mt-2 font-heading text-xl italic leading-snug text-[#F5EFD5] sm:text-2xl">
                "{demoInvestigation.claim}"
              </p>
            </div>

            <div className="grid gap-0 lg:grid-cols-2">
              <div className="border-b border-[#EFE8CC] p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8D2939]">
                  Subclaim decomposition
                </p>
                <ul className="mt-4 space-y-4" role="list">
                  {demoInvestigation.subclaims.map((s) => (
                    <li key={s.id} className="flex items-start justify-between gap-3">
                      <span className="text-sm leading-snug text-[#292522]">
                        <span className="mr-2 font-mono text-[10px] text-[#D8CDB0]">
                          {s.index}
                        </span>
                        {s.text}
                      </span>
                      <StanceBadge stance={s.assessmentStance} size="xs" />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 sm:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8D2939]">
                  Evidence highlights
                </p>
                {contradicting && (
                  <div className="mt-4 rounded-sm border border-[#F5B4AC] bg-[#FCE8E6] p-3.5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#6E1B1B]">
                      CONTRADICTS · {contradicting.publisher}
                    </p>
                    <p className="mt-1.5 font-heading text-sm italic leading-relaxed text-[#3D3834]">
                      "{contradicting.excerpt}"
                    </p>
                  </div>
                )}
                {supporting && (
                  <div className="mt-3 rounded-sm border border-[#A3D9B5] bg-[#E6F4EA] p-3.5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#1B4D3E]">
                      SUPPORTS · {supporting.publisher}
                    </p>
                    <p className="mt-1.5 font-heading text-sm italic leading-relaxed text-[#3D3834]">
                      "{supporting.excerpt}"
                    </p>
                  </div>
                )}
                <p className="mt-4 font-mono text-[10px] tracking-[0.08em] text-[#6A625A]">
                  + 7 more sources, full bibliography in the dossier
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#EFE8CC] bg-[#FDFBF3] px-6 py-5 sm:px-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5C544E]">
                  Overall assessment
                </span>
                <StanceBadge stance="contradicts" testid="sample-overall-assessment" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/results"
                  data-testid="sample-open-results"
                  className="inline-flex items-center gap-2 rounded-sm bg-[#8D2939] px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#741F2D]"
                >
                  Open results dashboard
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/report"
                  data-testid="sample-open-report"
                  className="inline-flex items-center rounded-sm border border-[#D8CDB0] px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[#292522] transition-colors hover:border-[#8D2939] hover:text-[#8D2939]"
                >
                  Read full dossier
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section
        id="faq"
        className="scroll-mt-20 border-t border-[#D8CDB0] bg-[#EFE8CC]"
        data-testid="faq-section"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16 lg:px-8">
          <SectionHeading
            overline="FAQ"
            title="Questions, answered transparently."
          />
          <div className="border-t border-[#D8CDB0] lg:pt-0">
            {FAQ_ITEMS.map((item, i) => (
              <FaqRow
                key={item.q}
                item={item}
                index={i}
                open={faqOpen === i}
                onToggle={() => setFaqOpen(faqOpen === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function STANCE_CLASS(i: number, activeIdx: number): string {
  if (i !== activeIdx) {
    return "border-[#D8CDB0] bg-white text-[#5C544E] hover:border-[#B8A87F]";
  }
  const cls = ["stance-supports", "stance-contradicts", "stance-partial", "stance-contextual", "stance-insufficient"][i];
  return `border ${cls} font-medium`;
}
