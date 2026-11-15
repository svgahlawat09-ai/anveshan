import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { EvidenceItem, Subclaim } from "@/data/demoInvestigation";
import { STANCE_META, StanceBadge, formatDate } from "./stance";

// Interactive SVG relationship map: Original Claim -> Subclaims -> Evidence.
// Node click selects; connected edges stay bright, the rest dim.

const VB_W = 960;
const VB_H = 640;
const CLAIM = { cx: 480, y: 24, w: 520, h: 62 };
const SUB_Y = 150;
const SUB_W = 280;
const SUB_H = 88;
const SUB_X = [165, 480, 795];
const EV_TOP = 302;
const EV_W = 224;
const EV_H = 48;
const EV_GAP = 62;

type Selection =
  | { kind: "claim" }
  | { kind: "subclaim"; subclaim: Subclaim }
  | { kind: "evidence"; item: EvidenceItem };

function trunc(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

function wrap2(s: string): [string, string] {
  const mid = Math.ceil(s.length / 2);
  let cut = s.indexOf(" ", mid);
  if (cut === -1 || cut > mid + 16) cut = mid;
  return [s.slice(0, cut), s.slice(cut).trim()];
}

function wordWrap(s: string, max: number, lines: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const w of s.split(/\s+/)) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max && cur) {
      out.push(cur);
      cur = w;
      if (out.length === lines) return out;
    } else {
      cur = next;
    }
  }
  if (cur && out.length < lines) out.push(cur);
  return out;
}

export default function EvidenceGraph({
  claim,
  overallNote,
  subclaims,
  evidence,
}: {
  claim: string;
  overallNote: string;
  subclaims: Subclaim[];
  evidence: EvidenceItem[];
}) {
  const [sel, setSel] = useState<Selection | null>(null);

  const { subPos, evPos } = useMemo(() => {
    const subPos = new Map<string, number>();
    subclaims.forEach((s, i) => subPos.set(s.id, SUB_X[Math.min(i, SUB_X.length - 1)]));
    const evPos = new Map<string, { x: number; y: number }>();
    const counters = new Map<string, number>();
    for (const e of evidence) {
      const i = counters.get(e.subclaimId) ?? 0;
      counters.set(e.subclaimId, i + 1);
      evPos.set(e.id, { x: subPos.get(e.subclaimId) ?? 480, y: EV_TOP + i * EV_GAP });
    }
    return { subPos, evPos };
  }, [subclaims, evidence]);

  const connectedIds = useMemo(() => {
    const set = new Set<string>(["claim"]);
    if (!sel) return null;
    if (sel.kind === "claim") {
      subclaims.forEach((s) => set.add(s.id));
      evidence.forEach((e) => set.add(e.id));
    } else if (sel.kind === "subclaim") {
      set.add(sel.subclaim.id);
      evidence
        .filter((e) => e.subclaimId === sel.subclaim.id)
        .forEach((e) => set.add(e.id));
    } else {
      set.add(sel.item.id);
      set.add(sel.item.subclaimId);
    }
    return set;
  }, [sel, subclaims, evidence]);

  const dim = (id: string) => (connectedIds && !connectedIds.has(id) ? 0.18 : 1);
  const stroke = (id: string) =>
    connectedIds && connectedIds.has(id) ? 2 : 1;

  const subclaimFor = (id: string) => subclaims.find((s) => s.id === id);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="overflow-x-auto rounded-sm border border-[#D8CDB0] bg-white p-3">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-auto w-full min-w-[640px]"
          role="img"
          aria-label="Evidence relationship map"
          data-testid="evidence-relationship-map"
        >
          {/* claim -> subclaim edges */}
          {subclaims.map((s) => {
            const x = subPos.get(s.id) ?? 480;
            const id = `edge-claim-${s.id}`;
            return (
              <path
                key={id}
                d={`M ${CLAIM.cx} ${CLAIM.y + CLAIM.h} C ${CLAIM.cx} 118, ${x} 116, ${x} ${SUB_Y}`}
                fill="none"
                stroke="#8D2939"
                strokeWidth={stroke(s.id)}
                opacity={dim(s.id) * 0.55}
                className="graph-edge"
              />
            );
          })}

          {/* subclaim -> evidence edges */}
          {evidence.map((e) => {
            const p = evPos.get(e.id);
            const sid = e.subclaimId;
            const x = p?.x ?? 480;
            return (
              <line
                key={`edge-${e.id}`}
                x1={x}
                y1={SUB_Y + SUB_H}
                x2={p?.x ?? x}
                y2={p?.y ?? EV_TOP}
                stroke={STANCE_META[e.stance].hex}
                strokeWidth={stroke(sid) === 2 && connectedIds?.has(e.id) ? 2 : 1.2}
                opacity={Math.min(dim(e.id), dim(sid)) * 0.7}
                className="graph-edge"
              />
            );
          })}

          {/* claim node */}
          <g
            className="graph-node"
            data-testid="graph-node-claim"
            onClick={() => setSel({ kind: "claim" })}
          >
            <rect
              x={CLAIM.cx - CLAIM.w / 2}
              y={CLAIM.y}
              width={CLAIM.w}
              height={CLAIM.h}
              rx={6}
              fill="#292522"
              stroke={sel?.kind === "claim" ? "#F39291" : "#292522"}
              strokeWidth={2}
              opacity={dim("claim")}
            />
            <text
              x={CLAIM.cx}
              y={CLAIM.y + 24}
              textAnchor="middle"
              fill="#F5EFD5"
              fontSize={13}
              fontStyle="italic"
              fontFamily="'Playfair Display Variable', Georgia, serif"
            >
              {wrap2(trunc(claim, 96))[0]}
            </text>
            <text
              x={CLAIM.cx}
              y={CLAIM.y + 43}
              textAnchor="middle"
              fill="#D8CDB0"
              fontSize={13}
              fontStyle="italic"
              fontFamily="'Playfair Display Variable', Georgia, serif"
            >
              {wrap2(trunc(claim, 96))[1]}
            </text>
          </g>

          {/* subclaim nodes */}
          {subclaims.map((s) => {
            const x = subPos.get(s.id) ?? 480;
            const selected = sel?.kind === "subclaim" && sel.subclaim.id === s.id;
            return (
              <g
                key={s.id}
                className="graph-node"
                data-testid={`graph-node-${s.id}`}
                onClick={() => setSel({ kind: "subclaim", subclaim: s })}
              >
                <rect
                  x={x - SUB_W / 2}
                  y={SUB_Y}
                  width={SUB_W}
                  height={SUB_H}
                  rx={5}
                  fill="#FFFFFF"
                  stroke={selected ? "#8D2939" : "#D8CDB0"}
                  strokeWidth={stroke(s.id)}
                  opacity={dim(s.id)}
                />
                <text
                  x={x - SUB_W / 2 + 14}
                  y={SUB_Y + 24}
                  fill="#8D2939"
                  fontSize={10}
                  fontFamily="'JetBrains Mono Variable', monospace"
                  letterSpacing={1.5}
                >
                  SUBCLAIM {s.index}
                </text>
                {wordWrap(s.text, 33, 3).map((line, li) => (
                  <text
                    key={li}
                    x={x - SUB_W / 2 + 14}
                    y={SUB_Y + 44 + li * 15}
                    fill="#292522"
                    fontSize={11}
                    fontFamily="'DM Sans Variable', sans-serif"
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {/* evidence leaf nodes */}
          {evidence.map((e) => {
            const p = evPos.get(e.id);
            if (!p) return null;
            const selected = sel?.kind === "evidence" && sel.item.id === e.id;
            return (
              <g
                key={e.id}
                className="graph-node"
                data-testid={`graph-node-${e.id}`}
                onClick={() => setSel({ kind: "evidence", item: e })}
              >
                <rect
                  x={p.x - EV_W / 2}
                  y={p.y}
                  width={EV_W}
                  height={EV_H}
                  rx={4}
                  fill={STANCE_META[e.stance].cls === "stance-supports" ? "#F2FAF5" : "#FDFBF3"}
                  stroke={selected ? "#8D2939" : "#D8CDB0"}
                  strokeWidth={1.4}
                  opacity={dim(e.id)}
                />
                <rect
                  x={p.x - EV_W / 2}
                  y={p.y}
                  width={4}
                  height={EV_H}
                  fill={STANCE_META[e.stance].hex}
                  opacity={dim(e.id)}
                />
                <text
                  x={p.x - EV_W / 2 + 14}
                  y={p.y + 19}
                  fill="#292522"
                  fontSize={10.5}
                  fontFamily="'DM Sans Variable', sans-serif"
                >
                  {trunc(e.sourceTitle, 30)}
                </text>
                <text
                  x={p.x - EV_W / 2 + 14}
                  y={p.y + 35}
                  fill="#5C544E"
                  fontSize={9.5}
                  fontFamily="'JetBrains Mono Variable', monospace"
                  letterSpacing={1}
                >
                  {trunc(e.publisher, 32).toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>

        <div
          className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#EFE8CC] px-2 py-3"
          data-testid="graph-legend"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5C544E]">
            Edge colour = stance
          </span>
          {(["supports", "contradicts", "partial", "contextual", "insufficient"] as const).map(
            (s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: STANCE_META[s].hex }}
                />
                <span className="font-mono text-[10px] tracking-[0.08em] text-[#292522]">
                  {STANCE_META[s].short}
                </span>
              </span>
            ),
          )}
        </div>
      </div>

      {/* inspection panel */}
      <aside
        className="h-fit rounded-sm border border-[#D8CDB0] bg-white p-5"
        data-testid="graph-detail-panel"
      >
        {!sel ? (
          <div className="py-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8D2939]">
              Node inspector
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#5C544E]">
              Select any node in the map to inspect the claim, a subclaim, or an
              individual piece of evidence.
            </p>
          </div>
        ) : sel.kind === "claim" ? (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8D2939]">
              Original claim
            </p>
            <p className="mt-3 font-heading text-lg italic leading-snug text-[#292522]">
              "{claim}"
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#5C544E]">
              Decomposed into {subclaims.length} subclaims with {evidence.length}{" "}
              traceable evidence items. {overallNote}
            </p>
          </div>
        ) : sel.kind === "subclaim" ? (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8D2939]">
              Subclaim {sel.subclaim.index}
            </p>
            <p className="mt-3 font-heading text-base leading-snug text-[#292522]">
              {sel.subclaim.text}
            </p>
            <div className="mt-3">
              <StanceBadge stance={sel.subclaim.assessmentStance} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#5C544E]">
              {sel.subclaim.verdict}
            </p>
          </div>
        ) : (
          <div>
            <StanceBadge stance={sel.item.stance} />
            <p className="mt-3 font-heading text-base font-semibold leading-snug text-[#292522]">
              {sel.item.sourceTitle}
            </p>
            <p className="mt-1 font-mono text-[11px] tracking-[0.06em] text-[#5C544E]">
              {sel.item.publisher} · {formatDate(sel.item.publishedAt)}
            </p>
            <p className="mt-3 border-l-2 border-[#8D2939] pl-3 font-heading text-sm italic leading-relaxed text-[#3D3834]">
              "{trunc(sel.item.excerpt, 150)}"
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#5C544E]">
              Maps to subclaim {subclaimFor(sel.item.subclaimId)?.index}
            </p>
            {sel.item.url && (
              <a
                href={sel.item.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#8D2939] underline decoration-[#F39291] underline-offset-2 hover:text-[#741F2D]"
                data-testid="graph-detail-source-link"
              >
                Open source
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
