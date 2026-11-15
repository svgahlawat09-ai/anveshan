import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { EvidenceItem } from "@/data/demoInvestigation";
import { QUALITY_LEVEL_META, STANCE_META, StanceBadge, formatDate } from "./stance";

function QualityRow({
  dimension,
  level,
  note,
}: {
  dimension: string;
  level: "high" | "moderate" | "limited";
  note: string;
}) {
  const meta = QUALITY_LEVEL_META[level];
  return (
    <div
      className="flex items-start gap-2.5 border-b border-[#EFE8CC] py-2 last:border-b-0"
      data-testid={`quality-dimension-${dimension.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <span
        aria-hidden
        className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: meta.hex }}
      />
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#292522]">
          {dimension}
          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5C544E]">
            {meta.label}
          </span>
        </p>
        <p className="text-xs leading-relaxed text-[#5C544E]">{note}</p>
      </div>
    </div>
  );
}

export default function EvidenceCard({
  item,
  subclaimText,
  index,
}: {
  item: EvidenceItem;
  subclaimText: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const meta = STANCE_META[item.stance];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: (index % 4) * 0.05, ease: "easeOut" }}
      className="border border-[#D8CDB0] bg-white"
      data-testid={`evidence-card-${item.id}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid={`evidence-card-toggle-${item.id}`}
        className="w-full px-5 py-4 text-left"
      >
        <div className="flex flex-wrap items-center gap-2">
          <StanceBadge stance={item.stance} testid={`evidence-stance-${item.id}`} />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#5C544E]">
            {item.sourceType}
          </span>
          <ChevronDown
            className={`ml-auto h-4 w-4 text-[#5C544E] transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
        <h4 className="mt-2.5 font-heading text-lg font-semibold leading-snug text-[#292522]">
          {item.sourceTitle}
        </h4>
        <p className="mt-1 font-mono text-[11px] tracking-[0.06em] text-[#5C544E]">
          {item.publisher} · {formatDate(item.publishedAt)}
        </p>
      </button>

      <div className="px-5 pb-5">
        <blockquote
          className="border-l-2 border-[#8D2939] bg-[#FDFBF3] px-4 py-3 font-heading text-[15px] italic leading-relaxed text-[#3D3834]"
          data-testid={`evidence-excerpt-${item.id}`}
        >
          "{item.excerpt}"
        </blockquote>

        {open && (
          <div className="mt-4 space-y-4 border-t border-[#EFE8CC] pt-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8D2939]">
                Related subclaim
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#292522]">
                {subclaimText}
              </p>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8D2939]">
                Source quality indicators
              </p>
              <div className="mt-1.5 rounded-sm border border-[#EFE8CC] px-3 py-1">
                {item.quality.map((qi) => (
                  <QualityRow key={qi.dimension} {...qi} />
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8D2939]">
                Traceability
              </p>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-testid={`evidence-source-link-${item.id}`}
                  className="mt-1.5 inline-flex items-center gap-1.5 break-all text-sm text-[#8D2939] underline decoration-[#F39291] decoration-2 underline-offset-2 hover:text-[#741F2D]"
                >
                  {item.url}
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                </a>
              ) : (
                <p className="mt-1.5 font-mono text-xs text-[#6A625A]">
                  No source provided with the original claim.
                </p>
              )}
            </div>

            <p className="border-t border-[#EFE8CC] pt-3 font-mono text-[10px] leading-relaxed tracking-[0.06em] text-[#6A625A]">
              DEMONSTRATION EXCERPT — illustration for this frontend prototype, not a
              quotation from a live investigation.
            </p>
          </div>
        )}

        {!open && (
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#5C544E]">
            {meta.short} evidence · expand for quality indicators
          </p>
        )}
      </div>
    </motion.article>
  );
}
