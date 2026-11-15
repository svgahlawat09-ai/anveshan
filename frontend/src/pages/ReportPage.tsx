import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Bookmark, Copy, Download, Check } from "lucide-react";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { STANCE_META, StanceBadge, formatDate } from "@/components/stance";
import {
  demoInvestigation,
  type EvidenceItem,
} from "@/data/demoInvestigation";
import { getSavedReports, saveReport } from "@/lib/storage";

function buildReportMarkdown(dateStr: string): string {
  const d = demoInvestigation;
  const L: string[] = [];
  L.push(`# ${d.title}`);
  L.push(`_Anveshan — Evidence Investigation Lab · ${dateStr} · DEMONSTRATION DATA_`);
  L.push("");
  L.push(`**Original claim:** "${d.claim}"`);
  L.push(`**Overall assessment:** ${d.overallAssessment.toUpperCase()} — ${d.overallNote}`);
  L.push("");
  L.push("## Executive summary");
  d.executiveSummary.forEach((p) => L.push(p));
  L.push("");
  L.push("## Subclaim breakdown");
  d.subclaims.forEach((s) => {
    L.push(`### ${s.index}. ${s.text}`);
    L.push(`Assessment: ${s.assessment}`);
    L.push(s.verdict);
    L.push("");
  });
  L.push("## Supporting evidence");
  d.evidence
    .filter((e) => e.stance === "supports" || e.stance === "partial")
    .forEach((e) => L.push(`- [${STANCE_META[e.stance].label}] ${e.sourceTitle} — ${e.publisher} (${formatDate(e.publishedAt)}): "${e.excerpt}" ${e.url}`));
  L.push("");
  L.push("## Contradicting evidence");
  d.evidence
    .filter((e) => e.stance === "contradicts")
    .forEach((e) => L.push(`- ${e.sourceTitle} — ${e.publisher} (${formatDate(e.publishedAt)}): "${e.excerpt}" ${e.url}`));
  L.push("");
  L.push("## Missing context");
  d.missingContext.forEach((m) => L.push(`- ${m}`));
  L.push("");
  L.push("## Source limitations");
  d.sourceLimitations.forEach((m) => L.push(`- ${m}`));
  L.push("");
  L.push("## Final conclusion");
  L.push(d.conclusion);
  L.push("");
  L.push("### What the evidence establishes");
  d.established.forEach((m) => L.push(`- ${m}`));
  L.push("");
  L.push("### What remains uncertain");
  d.uncertain.forEach((m) => L.push(`- ${m}`));
  L.push("");
  L.push("## Source bibliography (demonstration citations)");
  d.evidence.forEach((e, i) => {
    L.push(`${i + 1}. ${e.publisher} — ${e.sourceTitle} (${formatDate(e.publishedAt)}). ${e.url || "No traceable URL."}`);
  });
  L.push("");
  L.push("_All sources and excerpts are illustrative demonstration content for this frontend prototype._");
  return L.join("\n");
}

function ReportEvidenceList({
  items,
  tone,
}: {
  items: EvidenceItem[];
  tone: "support" | "contradict";
}) {
  return (
    <ul className="mt-4 space-y-4" role="list">
      {items.map((e) => (
        <li
          key={e.id}
          className={`rounded-sm border p-4 ${
            tone === "support"
              ? "border-[#A3D9B5] bg-[#F7FCF9]"
              : "border-[#F5B4AC] bg-[#FEF7F6]"
          }`}
          data-testid={`report-evidence-${e.id}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StanceBadge stance={e.stance} size="xs" />
            <span className="font-mono text-[10px] tracking-[0.06em] text-[#5C544E]">
              {e.publisher} · {formatDate(e.publishedAt)}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-[#292522]">{e.sourceTitle}</p>
          <p className="mt-1.5 border-l-2 border-[#8D2939] pl-3 font-heading text-sm italic leading-relaxed text-[#3D3834]">
            "{e.excerpt}"
          </p>
          {e.url && (
            <a
              href={e.url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-block break-all text-xs text-[#8D2939] underline decoration-[#F39291] underline-offset-2"
            >
              {e.url}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function ReportPage() {
  const d = demoInvestigation;
  const [saved, setSaved] = useState(false);
  const dateStr = formatDate(new Date().toISOString());

  useEffect(() => {
    setSaved(getSavedReports().some((r) => r.id === d.id));
  }, [d.id]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildReportMarkdown(dateStr));
      toast.success("Report copied to clipboard as markdown");
    } catch {
      toast.error("Clipboard unavailable in this browser context");
    }
  };

  const onSave = () => {
    const { alreadySaved } = saveReport({
      id: d.id,
      title: d.title,
      claim: d.claim,
      assessment: d.overallAssessment,
      savedAt: new Date().toISOString(),
    });
    setSaved(true);
    toast.success(
      alreadySaved ? "Already in your saved reports" : "Report saved to your library",
    );
  };

  const supporting = d.evidence.filter(
    (e) => e.stance === "supports" || e.stance === "partial",
  );
  const contradicting = d.evidence.filter((e) => e.stance === "contradicts");

  return (
    <WorkspaceLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* action bar */}
        <div className="flex flex-wrap items-center gap-3 print:hidden" data-testid="report-action-bar">
          <Link
            to="/investigate"
            data-testid="back-to-investigation-button"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#5C544E] transition-colors hover:text-[#8D2939]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Investigation
          </Link>
          <div className="ml-auto flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onCopy}
              data-testid="copy-report-button"
              className="inline-flex items-center gap-2 rounded-sm border border-[#D8CDB0] bg-white px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#292522] transition-colors hover:border-[#8D2939] hover:text-[#8D2939]"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Report
            </button>
            <button
              type="button"
              onClick={onSave}
              data-testid="save-report-button"
              className="inline-flex items-center gap-2 rounded-sm border border-[#D8CDB0] bg-white px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#292522] transition-colors hover:border-[#8D2939] hover:text-[#8D2939]"
            >
              {saved ? <Check className="h-3.5 w-3.5 text-[#2D6A4F]" /> : <Bookmark className="h-3.5 w-3.5" />}
              {saved ? "Saved" : "Save Report"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              data-testid="export-pdf-button"
              className="inline-flex items-center gap-2 rounded-sm bg-[#8D2939] px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#741F2D]"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </div>

        {/* dossier sheet */}
        <article
          className="report-sheet mt-7 rounded-sm border border-[#D8CDB0] bg-white px-6 py-10 shadow-sm sm:px-12"
          data-testid="report-dossier"
        >
          <header className="border-b-2 border-[#292522] pb-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8D2939]">
                Anveshan Investigation Report
              </p>
              <span className="rounded-sm border border-[#F2D48A] bg-[#FEF3D6] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B4800]">
                Demonstration data
              </span>
            </div>
            <h1 className="mt-4 font-heading text-3xl font-semibold leading-tight tracking-tight text-[#292522] sm:text-4xl">
              {d.title}
            </h1>
            <p className="mt-4 font-heading text-lg italic leading-relaxed text-[#3D3834]">
              "{d.claim}"
            </p>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5C544E]">
                  Investigation date
                </p>
                <p className="mt-1 font-medium text-[#292522]">{dateStr}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5C544E]">
                  Scope
                </p>
                <p className="mt-1 font-medium text-[#292522]">
                  {d.subclaims.length} subclaims · {d.sourcesExamined} sources examined
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5C544E]">
                  Overall assessment
                </p>
                <p className="mt-1.5">
                  <StanceBadge stance="contradicts" testid="report-overall-assessment" />
                </p>
              </div>
            </div>
          </header>

          {/* executive summary */}
          <section className="mt-9" data-testid="report-executive-summary">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8D2939]">
              01 · Executive summary
            </p>
            <div className="mt-3 space-y-3.5 leading-relaxed text-[#3D3834]">
              {d.executiveSummary.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {/* subclaim breakdown */}
          <section className="mt-9" data-testid="report-subclaim-breakdown">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8D2939]">
              02 · Subclaim breakdown
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#D8CDB0] text-left">
                    <th className="py-2 pr-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#5C544E]">#</th>
                    <th className="py-2 pr-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#5C544E]">Subclaim</th>
                    <th className="py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#5C544E]">Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  {d.subclaims.map((s) => (
                    <tr key={s.id} className="border-b border-[#EFE8CC] align-top">
                      <td className="py-3 pr-3 font-mono text-xs text-[#D8CDB0]">{s.index}</td>
                      <td className="py-3 pr-3">
                        <p className="font-medium text-[#292522]">{s.text}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[#5C544E]">{s.verdict}</p>
                      </td>
                      <td className="py-3">
                        <StanceBadge stance={s.assessmentStance} size="xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* evidence */}
          <section className="mt-9" data-testid="report-supporting-evidence">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#2D6A4F]">
              03 · Supporting evidence
            </p>
            <ReportEvidenceList items={supporting} tone="support" />
          </section>

          <section className="mt-9" data-testid="report-contradicting-evidence">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8B302B]">
              04 · Contradicting evidence
            </p>
            <ReportEvidenceList items={contradicting} tone="contradict" />
          </section>

          {/* missing context & limitations */}
          <div className="mt-9 grid gap-9 md:grid-cols-2">
            <section data-testid="report-missing-context">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#A26E00]">
                05 · Missing context
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed text-[#3D3834]">
                {d.missingContext.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </section>
            <section data-testid="report-source-limitations">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#6A625A]">
                06 · Source limitations
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed text-[#3D3834]">
                {d.sourceLimitations.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </section>
          </div>

          {/* conclusion */}
          <section className="mt-9 border-t-2 border-[#292522] pt-7" data-testid="report-conclusion">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8D2939]">
              07 · Final conclusion
            </p>
            <p className="mt-3 font-heading text-lg leading-relaxed text-[#292522]">
              {d.conclusion}
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="rounded-sm border border-[#A3D9B5] bg-[#F7FCF9] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1B4D3E]">
                  What the evidence establishes
                </p>
                <ul className="mt-2.5 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-[#3D3834]">
                  {d.established.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-sm border border-[#C7BFA8] bg-[#F8F5EC] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#3D3834]">
                  What remains uncertain
                </p>
                <ul className="mt-2.5 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-[#3D3834]">
                  {d.uncertain.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* bibliography */}
          <section className="mt-9" data-testid="report-bibliography">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8D2939]">
              08 · Source bibliography
            </p>
            <ol className="mt-3 space-y-2.5">
              {d.evidence.map((e, i) => (
                <li key={e.id} className="flex gap-3 text-sm leading-relaxed">
                  <span className="font-mono text-xs text-[#D8CDB0]">
                    [{String(i + 1).padStart(2, "0")}]
                  </span>
                  <span className="text-[#3D3834]">
                    <span className="font-medium text-[#292522]">{e.publisher}</span>{" "}
                    — {e.sourceTitle} ({formatDate(e.publishedAt)}).{" "}
                    {e.url ? (
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="break-all text-[#8D2939] underline decoration-[#F39291] underline-offset-2"
                      >
                        {e.url}
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-[#6A625A]">
                        No traceable URL.
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6 rounded-sm border border-[#F2D48A] bg-[#FEF3D6] px-4 py-3 font-mono text-[10px] leading-relaxed tracking-[0.06em] text-[#6B4800]">
              DEMONSTRATION DATA — every source, excerpt, date and URL in this dossier
              is illustrative content for a frontend prototype. No live investigation
              has been performed and no real source is quoted.
            </p>
          </section>
        </article>
      </div>
    </WorkspaceLayout>
  );
}
