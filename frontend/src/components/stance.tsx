import type { Stance } from "@/data/demoInvestigation";

export const STANCE_META: Record<
  Stance,
  { label: string; short: string; cls: string; hex: string }
> = {
  supports: { label: "SUPPORTS", short: "Supporting", cls: "stance-supports", hex: "#2D6A4F" },
  contradicts: { label: "CONTRADICTS", short: "Contradicting", cls: "stance-contradicts", hex: "#8B302B" },
  partial: { label: "PARTIALLY SUPPORTS", short: "Partial", cls: "stance-partial", hex: "#A26E00" },
  contextual: { label: "CONTEXTUAL", short: "Contextual", cls: "stance-contextual", hex: "#2B4C7E" },
  insufficient: { label: "INSUFFICIENT EVIDENCE", short: "Insufficient", cls: "stance-insufficient", hex: "#6A625A" },
};

export function StanceBadge({
  stance,
  testid,
  size = "sm",
}: {
  stance: Stance;
  testid?: string;
  size?: "xs" | "sm";
}) {
  const meta = STANCE_META[stance];
  return (
    <span
      data-testid={testid}
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono uppercase tracking-[0.14em] ${meta.cls} ${
        size === "xs" ? "text-[10px]" : "text-xs"
      }`}
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.hex }}
      />
      {meta.label}
    </span>
  );
}

export const QUALITY_LEVEL_META: Record<
  "high" | "moderate" | "limited",
  { hex: string; label: string }
> = {
  high: { hex: "#2D6A4F", label: "High" },
  moderate: { hex: "#A26E00", label: "Moderate" },
  limited: { hex: "#6A625A", label: "Limited" },
};

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
