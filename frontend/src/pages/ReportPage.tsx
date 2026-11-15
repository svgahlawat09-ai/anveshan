import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bookmark,
  Copy,
  Download,
  Check,
  FileQuestion,
  ExternalLink,
} from "lucide-react";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { STANCE_META, StanceBadge, formatDate } from "@/components/stance";
import type { Stance, Assessment } from "@/data/demoInvestigation";
import { getSavedReports, saveReport } from "@/lib/storage";
import type { InvestigationResult, EvidenceSource } from "@/services/api";
import {
  mapBackendStatusToAssessment,
  mapBackendStatusToStance,
} from "./ResultsPage";

interface StoredInvestigation {
  id: string;
  claim: string;
  mode?: string;
  report: InvestigationResult;
  date: string;
}

interface FlattenedEvidence extends EvidenceSource {
  id: string;
  subclaimId: string;
  subclaimText: string;
  stance: Stance;
}

function buildReportMarkdown(
  investigation: StoredInvestigation,
  report: InvestigationResult,
  dateStr: string
): string {
  const L: string[] = [];
  L.push(`# Anveshan Investigation Dossier`);
  L.push(`_Evidence Investigation Lab · ${dateStr} · ID: ${investigation.id}_`);
  L.push("");
  L.push(`**Original Claim:** "${investigation.claim}"`);
  L.push(
    `**Overall Verdict:** ${report.overall.label.toUpperCase()} — ${report.overall.summary}`
  );
  L.push("");
  L.push("## 01 · Executive Summary");
  L.push(report.overall.summary);
  L.push("");

  L.push("## 02 · Subclaim Breakdown");
  report.subclaims.forEach((s, i) => {
    L.push(`### ${i + 1}. ${s.text}`);
    L.push(`**Status:** ${s.status.toUpperCase()}`);
    L.push(`**Explanation:** ${s.explanation}`);
    L.push("");
  });

  const allEvidence: FlattenedEvidence[] = report.subclaims.flatMap((sc, scIdx) =>
    (sc.evidence || []).map((ev, evIdx) => ({
      ...ev,
      id: `${sc.id || scIdx}-ev-${evIdx}`,
      subclaimId: sc.id || String(scIdx + 1),
      subclaimText: sc.text,
      stance: mapBackendStatusToStance(ev.relation),
    }))
  );

  const supporting = allEvidence.filter(
    (e) => e.stance === "supports" || e.stance === "partial"
  );
  const contradicting = allEvidence.filter((e) => e.stance === "contradicts");

  L.push("## 03 · Supporting Evidence");
  if (supporting.length === 0) {
    L.push("- No direct supporting evidence found.");
  } else {
    supporting.forEach((e) => {
      L.push(
        `- [${STANCE_META[e.stance].label}] ${e.domain || "Source"} (${e.published || "Undated"}): "${e.quote}" ${e.url ? `<${e.url}>` : ""}`
      );
    });
  }
  L.push("");

  L.push("## 04 · Contradicting Evidence");
  if (contradicting.length === 0) {
    L.push("- No direct contradicting evidence found.");
  } else {
    contradicting.forEach((e) => {
      L.push(
        `- [CONTRADICTS] ${e.domain || "Source"} (${e.published || "Undated"}): "${e.quote}" ${e.url ? `<${e.url}>` : ""}`
      );
    });
  }
  L.push("");

  if (report.missing && report.missing.length > 0) {
    L.push("## 05 · Missing Context & Evidence");
    report.missing.forEach((m) => L.push(`- ${m}`));
    L.push("");
  }

  if (report.limitations) {
    L.push("## 06 · Investigation Limitations");
    L.push(report.limitations);
    L.push("");
  }

  if (report.stats) {
    L.push("## 07 · Source Statistics");
    L.push(`- Sources read: ${report.stats.sources_read}`);
    L.push(`- Candidate quotes extracted: ${report.stats.quotes_proposed}`);
    L.push(`- Verbatim passages verified: ${report.stats.quotes_verified}`);
    L.push("");
  }

  L.push("## 08 · Bibliography");
  allEvidence.forEach((e, i) => {
    L.push(
      `${i + 1}. ${e.domain || "Online publication"} — "${e.quote.slice(0, 100)}..." (${e.published || "Recent"}). ${e.url || "No traceable URL."}`
    );
  });
  L.push("");
  L.push(
    "_Report generated transparently by Anveshan Evidence Engine._"
  );
  return L.join("\n");
}

export default function ReportPage() {
  const saved = typeof window !== "undefined"
    ? sessionStorage.getItem("anveshan_current_investigation")
    : null;

  const investigation: StoredInvestigation | null = saved
    ? JSON.parse(saved)
    : null;
  const report = investigation?.report;

  const [savedLocally, setSavedLocally] = useState(false);
  const dateStr = formatDate(investigation?.date || new Date().toISOString());

  useEffect(() => {
    if (investigation?.id) {
      setSavedLocally(getSavedReports().some((r) => r.id === investigation.id));
    }
  }, [investigation?.id]);

  if (!investigation || !report) {
    return (
      <WorkspaceLayout>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EFE8CC]">
            <FileQuestion className="h-7 w-7 text-[#8D2939]" />
          </div>
          <h1
            className="mt-5 font-heading text-3xl font-semibold text-[#292522]"
            data-testid="no-report-title"
          >
            No Report Available
          </h1>
          <p className="mt-2.5 text-base text-[#5C544E]">
            There is no active investigation report in this session. Start an investigation to generate a verifiable dossier.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/investigate"
              data-testid="start-investigation-cta"
              className="inline-flex items-center gap-2 rounded-sm bg-[#8D2939] px-6 py-3 font-mono text-xs uppercase tracking-[0.16em] text-white hover:bg-[#741F2D]"
            >
              Start Investigation
            </Link>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  const allEvidence: FlattenedEvidence[] = report.subclaims.flatMap((sc, scIdx) =>
    (sc.evidence || []).map((ev, evIdx) => ({
      ...ev,
      id: `${sc.id || scIdx}-ev-${evIdx}`,
      subclaimId: sc.id || String(scIdx + 1),
      subclaimText: sc.text,
      stance: mapBackendStatusToStance(ev.relation),
    }))
  );

  const supporting = allEvidence.filter(
    (e) => e.stance === "supports" || e.stance === "partial"
  );
  const contradicting = allEvidence.filter((e) => e.stance === "contradicts");

  const overallStance = mapBackendStatusToStance(report.overall.label);
  const overallAssessment = mapBackendStatusToAssessment(report.overall.label);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        buildReportMarkdown(investigation, report, dateStr)
      );
      toast.success("Full investigation dossier copied as Markdown");
    } catch {
      toast.error("Clipboard copy unavailable");
    }
  };

  const onSave = () => {
    const { alreadySaved } = saveReport({
      id: investigation.id,
      title: investigation.claim.length > 50
        ? `${investigation.claim.slice(0, 50)}…`
        : investigation.claim,
      claim: investigation.claim,
      assessment: overallAssessment,
      savedAt: new Date().toISOString(),
    });
    setSavedLocally(true);
    toast.success(
      alreadySaved
        ? "Report already saved in your library"
        : "Report saved to your library"
    );
  };

  return (
    <WorkspaceLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Action bar */}
        <div
          className="flex flex-wrap items-center gap-3 print:hidden"
          data-testid="report-action-bar"
        >
          <Link
            to="/results"
            data-testid="back-to-results-button"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#5C544E] transition-colors hover:text-[#8D2939]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Results
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
              {savedLocally ? (
                <Check className="h-3.5 w-3.5 text-[#2D6A4F]" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" />
              )}
              {savedLocally ? "Saved" : "Save Report"}
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

        {/* Dossier sheet */}
        <article
          className="report-sheet mt-7 rounded-sm border border-[#D8CDB0] bg-white px-6 py-10 shadow-sm sm:px-12"
          data-testid="report-dossier"
        >
          <header className="border-b-2 border-[#292522] pb-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8D2939]">
                Anveshan Investigation Dossier
              </p>
              <span className="rounded-sm border border-[#A3D9B5] bg-[#F7FCF9] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#1B4D3E]">
                Official Report
              </span>
            </div>

            <h1 className="mt-4 font-heading text-3xl font-semibold leading-tight tracking-tight text-[#292522] sm:text-4xl">
              Investigation Report
            </h1>

            <p
              className="mt-4 font-heading text-lg italic leading-relaxed text-[#3D3834]"
              data-testid="report-claim"
            >
              "{investigation.claim}"
            </p>

            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5C544E]">
                  Investigation Date
                </p>
                <p className="mt-1 font-medium text-[#292522]">{dateStr}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5C544E]">
                  Scope & Sources
                </p>
                <p className="mt-1 font-medium text-[#292522]">
                  {report.subclaims.length} subclaims · {report.stats?.sources_read ?? allEvidence.length} sources examined
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5C544E]">
                  Overall Verdict
                </p>
                <p className="mt-1.5" data-testid="report-overall-verdict">
                  <StanceBadge stance={overallStance} testid="report-overall-assessment" />
                </p>
              </div>
            </div>
          </header>

          {/* 01 · Executive summary */}
          <section className="mt-9" data-testid="report-executive-summary">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8D2939]">
              01 · Executive Summary
            </p>
            <div className="mt-3 leading-relaxed text-[#3D3834]">
              <p className="text-base font-normal leading-relaxed">{report.overall.summary}</p>
            </div>
          </section>

          {/* 02 · Subclaim breakdown */}
          <section className="mt-9" data-testid="report-subclaim-breakdown">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8D2939]">
              02 · Subclaim Breakdown
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#D8CDB0] text-left">
                    <th className="py-2 pr-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#5C544E]">
                      #
                    </th>
                    <th className="py-2 pr-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#5C544E]">
                      Subclaim
                    </th>
                    <th className="py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#5C544E]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.subclaims.map((s, idx) => (
                    <tr
                      key={s.id || idx}
                      className="border-b border-[#EFE8CC] align-top"
                    >
                      <td className="py-3 pr-3 font-mono text-xs text-[#D8CDB0]">
                        {String(idx + 1).padStart(2, "0")}
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-medium text-[#292522]">{s.text}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[#5C544E]">
                          {s.explanation}
                        </p>
                      </td>
                      <td className="py-3">
                        <StanceBadge
                          stance={mapBackendStatusToStance(s.status)}
                          size="xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 03 · Supporting evidence */}
          <section className="mt-9" data-testid="report-supporting-evidence">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#2D6A4F]">
              03 · Supporting Evidence ({supporting.length})
            </p>
            {supporting.length === 0 ? (
              <p className="mt-3 font-mono text-xs text-[#5C544E]">
                No direct supporting evidence was identified in examined sources.
              </p>
            ) : (
              <ul className="mt-4 space-y-4" role="list">
                {supporting.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-sm border border-[#A3D9B5] bg-[#F7FCF9] p-4"
                    data-testid={`report-evidence-${e.id}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StanceBadge stance={e.stance} size="xs" />
                      <span className="font-mono text-[10px] tracking-[0.06em] text-[#5C544E]">
                        {e.domain || e.source_type} · {e.published || "Verified source"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-mono text-[#5C544E]">
                      Subclaim: {e.subclaimText}
                    </p>
                    <p className="mt-1.5 border-l-2 border-[#2D6A4F] pl-3 font-heading text-sm italic leading-relaxed text-[#3D3834]">
                      "{e.quote}"
                    </p>
                    {e.url && (
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-2 inline-flex items-center gap-1 break-all text-xs text-[#8D2939] underline decoration-[#F39291] underline-offset-2"
                      >
                        {e.url}
                        <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 04 · Contradicting evidence */}
          <section className="mt-9" data-testid="report-contradicting-evidence">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8B302B]">
              04 · Contradicting Evidence ({contradicting.length})
            </p>
            {contradicting.length === 0 ? (
              <p className="mt-3 font-mono text-xs text-[#5C544E]">
                No direct contradicting evidence was identified in examined sources.
              </p>
            ) : (
              <ul className="mt-4 space-y-4" role="list">
                {contradicting.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-sm border border-[#F5B4AC] bg-[#FEF7F6] p-4"
                    data-testid={`report-evidence-${e.id}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StanceBadge stance={e.stance} size="xs" />
                      <span className="font-mono text-[10px] tracking-[0.06em] text-[#5C544E]">
                        {e.domain || e.source_type} · {e.published || "Verified source"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-mono text-[#5C544E]">
                      Subclaim: {e.subclaimText}
                    </p>
                    <p className="mt-1.5 border-l-2 border-[#8B302B] pl-3 font-heading text-sm italic leading-relaxed text-[#3D3834]">
                      "{e.quote}"
                    </p>
                    {e.url && (
                      <a
                        href={e.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-2 inline-flex items-center gap-1 break-all text-xs text-[#8D2939] underline decoration-[#F39291] underline-offset-2"
                      >
                        {e.url}
                        <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 05 & 06 · Missing context & Source limitations */}
          <div className="mt-9 grid gap-9 md:grid-cols-2">
            <section data-testid="report-missing-context">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#A26E00]">
                05 · Missing Evidence & Context
              </p>
              {report.missing && report.missing.length > 0 ? (
                <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed text-[#3D3834]">
                  {report.missing.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[#5C544E]">
                  No crucial missing dimensions noted during retrieval.
                </p>
              )}
            </section>

            <section data-testid="report-source-limitations">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#6A625A]">
                06 · Source Limitations
              </p>
              <div className="mt-3 text-sm leading-relaxed text-[#3D3834]">
                <p>
                  {report.limitations ||
                    "Based on public sources indexed at the time of inquiry. Anveshan presents transparent evidence records rather than absolute truth determinations."}
                </p>
                {report.overall.coverage && (
                  <p className="mt-2 font-mono text-xs text-[#5C544E]">
                    Coverage: {report.overall.coverage.toUpperCase()} · Quality: {report.overall.source_quality.toUpperCase()}
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* 07 · Source statistics */}
          {report.stats && (
            <section className="mt-9 rounded-sm border border-[#D8CDB0] bg-[#FDFBF3] p-5" data-testid="report-stats">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8D2939]">
                07 · Source Statistics
              </p>
              <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                <div className="border-r border-[#D8CDB0] pr-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#5C544E]">
                    Sources Read
                  </p>
                  <p className="mt-1 font-heading text-2xl font-semibold text-[#292522]">
                    {report.stats.sources_read}
                  </p>
                </div>
                <div className="border-r border-[#D8CDB0] pr-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#5C544E]">
                    Quotes Extracted
                  </p>
                  <p className="mt-1 font-heading text-2xl font-semibold text-[#292522]">
                    {report.stats.quotes_proposed}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#5C544E]">
                    Quotes Verified
                  </p>
                  <p className="mt-1 font-heading text-2xl font-semibold text-[#292522]">
                    {report.stats.quotes_verified}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* 08 · Bibliography */}
          <section className="mt-9" data-testid="report-bibliography">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8D2939]">
              08 · Source Bibliography
            </p>
            {allEvidence.length === 0 ? (
              <p className="mt-3 font-mono text-xs text-[#5C544E]">
                No external URLs were cited in this investigation.
              </p>
            ) : (
              <ol className="mt-3 space-y-2.5">
                {allEvidence.map((e, i) => (
                  <li key={e.id} className="flex gap-3 text-sm leading-relaxed">
                    <span className="font-mono text-xs text-[#D8CDB0]">
                      [{String(i + 1).padStart(2, "0")}]
                    </span>
                    <span className="text-[#3D3834]">
                      <span className="font-medium text-[#292522]">
                        {e.domain || "Web Source"}
                      </span>{" "}
                      — {e.source_type} ({e.published || "Verified"}).{" "}
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
            )}
          </section>
        </article>
      </div>
    </WorkspaceLayout>
  );
}
