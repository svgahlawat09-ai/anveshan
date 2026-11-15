import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, Search } from "lucide-react";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import EvidenceCard from "@/components/EvidenceCard";
import SubclaimCard from "@/components/SubclaimCard";
import EvidenceGraph from "@/components/EvidenceGraph";
import { STANCE_META, StanceBadge, formatDate } from "@/components/stance";
import { Input } from "@/components/ui/input";
import { demoInvestigation, type Stance } from "@/data/demoInvestigation";

const FILTERS: { key: Stance | "all"; label: string }[] = [
  { key: "all", label: "All Evidence" },
  { key: "supports", label: "Supporting" },
  { key: "contradicts", label: "Contradicting" },
  { key: "partial", label: "Partial" },
  { key: "contextual", label: "Contextual" },
  { key: "insufficient", label: "Insufficient" },
];

export default function ResultsPage() {
  const demo = demoInvestigation;
  const [filter, setFilter] = useState<Stance | "all">("all");
  const [query, setQuery] = useState("");

  const chartData = useMemo(
    () =>
      (["supports", "contradicts", "partial", "contextual", "insufficient"] as Stance[]).map(
        (s) => ({
          name: STANCE_META[s].short,
          count: demo.evidence.filter((e) => e.stance === s).length,
          hex: STANCE_META[s].hex,
        }),
      ),
    [demo.evidence],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return demo.evidence.filter((e) => {
      if (filter !== "all" && e.stance !== filter) return false;
      if (!q) return true;
      return (
        e.sourceTitle.toLowerCase().includes(q) ||
        e.publisher.toLowerCase().includes(q) ||
        e.excerpt.toLowerCase().includes(q)
      );
    });
  }, [demo.evidence, filter, query]);

  const subclaimText = (id: string) =>
    demo.subclaims.find((s) => s.id === id)?.text ?? "";

  return (
    <WorkspaceLayout>
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* ---------- results header ---------- */}
        <header data-testid="results-header">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="rounded-sm bg-[#F39291] px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#292522]"
              data-testid="results-demo-badge"
            >
              Demo Data
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5C544E]">
              Investigation {demo.id}
            </span>
          </div>
          <h1
            className="mt-4 font-heading text-3xl font-semibold leading-tight tracking-tight text-[#292522] sm:text-4xl"
            data-testid="results-claim"
          >
            "{demo.claim}"
          </h1>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Investigation date", value: formatDate(new Date().toISOString()), testid: "results-meta-date" },
              { label: "Subclaims", value: String(demo.subclaims.length), testid: "results-meta-subclaims" },
              { label: "Sources examined", value: String(demo.sourcesExamined), testid: "results-meta-sources" },
            ].map((m) => (
              <div
                key={m.label}
                className="border border-[#D8CDB0] bg-white px-4 py-3.5"
                data-testid={m.testid}
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#5C544E]">
                  {m.label}
                </p>
                <p className="mt-1.5 font-heading text-xl font-semibold text-[#292522]">
                  {m.value}
                </p>
              </div>
            ))}
            <div
              className="border border-[#D8CDB0] bg-[#FCE8E6] px-4 py-3.5"
              data-testid="results-meta-assessment"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#6E1B1B]">
                Overall assessment
              </p>
              <p className="mt-2">
                <StanceBadge stance="contradicts" testid="results-assessment-badge" />
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-sm border border-[#D8CDB0] bg-white p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8D2939]">
                Assessment summary
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-[#3D3834]">
                {demo.overallNote}
              </p>
              <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-[0.06em] text-[#6A625A]">
                No confidence percentage is assigned. Anveshan reports transparent
                assessment labels, never invented precision.
              </p>
            </div>
            <div className="rounded-sm border border-[#D8CDB0] bg-white p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8D2939]">
                Evidence distribution
              </p>
              <div className="mt-2" data-testid="results-evidence-chart">
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={chartData} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EFE8CC" vertical={false} />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      tickLine={false}
                      axisLine={{ stroke: "#D8CDB0" }}
                      tick={{
                        fontSize: 9,
                        fill: "#5C544E",
                        fontFamily: "'JetBrains Mono Variable', monospace",
                      }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "#5C544E" }}
                    />
                    <Tooltip
                      cursor={{ fill: "#EFE8CC" }}
                      contentStyle={{
                        border: "1px solid #D8CDB0",
                        borderRadius: 4,
                        fontSize: 12,
                        background: "#FFFFFF",
                      }}
                    />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {chartData.map((d) => (
                        <Cell key={d.name} fill={d.hex} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </header>

        {/* ---------- subclaim decomposition ---------- */}
        <section data-testid="results-subclaims-section">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#292522]">
              Subclaim decomposition
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5C544E]">
              {demo.subclaims.length} independently verifiable units
            </span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {demo.subclaims.map((s, i) => (
              <SubclaimCard
                key={s.id}
                subclaim={s}
                evidence={demo.evidence.filter((e) => e.subclaimId === s.id)}
                index={i}
              />
            ))}
          </div>
        </section>

        {/* ---------- evidence explorer ---------- */}
        <section data-testid="results-evidence-section">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#292522]">
            Evidence explorer
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C544E]">
            Showing {filtered.length} of {demo.evidence.length} cited sources — a
            demonstration subset of {demo.sourcesExamined} examined. Expand any card
            for quality indicators and traceability.
          </p>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-label="Filter evidence by stance"
              data-testid="evidence-filter-group"
            >
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="radio"
                  aria-checked={filter === f.key}
                  data-testid={`evidence-filter-${f.key}`}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-sm border px-3 py-1.5 font-mono text-[11px] tracking-[0.1em] transition-colors ${
                    filter === f.key
                      ? "border-[#292522] bg-[#292522] text-[#F5EFD5]"
                      : "border-[#D8CDB0] bg-white text-[#5C544E] hover:border-[#B8A87F]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative lg:ml-auto lg:w-64">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6A625A]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sources…"
                data-testid="evidence-search-input"
                className="border-[#D8CDB0] bg-white pl-8"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {filtered.map((e, i) => (
              <EvidenceCard
                key={e.id}
                item={e}
                subclaimText={subclaimText(e.subclaimId)}
                index={i}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div
              className="mt-5 rounded-sm border border-dashed border-[#D8CDB0] bg-white px-6 py-12 text-center"
              data-testid="evidence-empty-state"
            >
              <p className="font-heading text-lg italic text-[#292522]">
                No evidence matches this filter.
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6A625A]">
                Adjust the stance filter or clear the search query
              </p>
            </div>
          )}
        </section>

        {/* ---------- relationship map ---------- */}
        <section data-testid="results-map-section">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#292522]">
              Evidence relationship map
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5C544E]">
              Claim → subclaims → sources
            </span>
          </div>
          <div className="mt-5">
            <EvidenceGraph
              claim={demo.claim}
              overallNote={demo.overallNote}
              subclaims={demo.subclaims}
              evidence={demo.evidence}
            />
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="rounded-sm bg-[#292522] px-6 py-10 sm:px-10" data-testid="results-report-cta">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F39291]">
                Step 05 — Compiled
              </p>
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-[#F5EFD5]">
                The full investigation dossier is ready.
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#D8CDB0]">
                Executive summary, subclaim matrix, missing context, source
                limitations, and a bibliography of every cited source.
              </p>
            </div>
            <Link
              to="/report"
              data-testid="view-complete-report-button"
              className="inline-flex items-center gap-2.5 rounded-sm bg-[#8D2939] px-6 py-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#F39291] hover:text-[#292522]"
            >
              View Complete Report
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </WorkspaceLayout>
  );
}
