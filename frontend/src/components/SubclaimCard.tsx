import { motion } from "motion/react";
import type { Subclaim, EvidenceItem } from "@/data/demoInvestigation";
import { STANCE_META, StanceBadge } from "./stance";

export default function SubclaimCard({
  subclaim,
  evidence,
  index,
}: {
  subclaim: Subclaim;
  evidence: EvidenceItem[];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: "easeOut" }}
      className="hover-lift border border-[#D8CDB0] bg-white p-5"
      data-testid={`subclaim-card-${subclaim.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-2xl font-medium text-[#D8CDB0]">
          {subclaim.index}
        </span>
        <StanceBadge
          stance={subclaim.assessmentStance}
          testid={`subclaim-assessment-${subclaim.id}`}
        />
      </div>
      <h4 className="mt-3 font-heading text-lg font-semibold leading-snug text-[#292522]">
        {subclaim.text}
      </h4>
      <p className="mt-2.5 text-sm leading-relaxed text-[#5C544E]">
        {subclaim.verdict}
      </p>
      <div className="mt-4 flex items-center gap-2 border-t border-[#EFE8CC] pt-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5C544E]">
          {evidence.length} evidence item{evidence.length === 1 ? "" : "s"}
        </span>
        <span className="ml-auto flex items-center gap-1.5" aria-hidden>
          {evidence.map((e) => (
            <span
              key={e.id}
              title={STANCE_META[e.stance].label}
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: STANCE_META[e.stance].hex }}
            />
          ))}
        </span>
      </div>
    </motion.div>
  );
}
