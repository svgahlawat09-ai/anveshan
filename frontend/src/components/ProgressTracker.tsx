import { useEffect, useState } from "react";
import { Check } from "lucide-react";

const STAGES = [
  {
    id: "01",
    label: "PARSING CLAIM",
    telemetry: [
      "tokenising claim text",
      "assertion type detected: comparative ranking",
      "entities extracted: India · unemployment rate · developing countries",
    ],
  },
  {
    id: "02",
    label: "DECOMPOSING SUBCLAIMS",
    telemetry: [
      "splitting claim into independently verifiable subclaims",
      "mapping logical dependencies between subclaims",
      "flagging implicit assumptions: dataset · definition · period",
    ],
  },
  {
    id: "03",
    label: "DISCOVERING SOURCES",
    telemetry: [
      "querying official statistics portals",
      "retrieving research literature and original publications",
      "screening 14 candidate sources for traceability",
    ],
  },
  {
    id: "04",
    label: "EVALUATING EVIDENCE",
    telemetry: [
      "classifying stance per subclaim",
      "comparing measurement definitions across systems",
      "isolating conflicting estimates and period mismatches",
    ],
  },
  {
    id: "05",
    label: "COMPILING REPORT",
    telemetry: [
      "drafting executive summary",
      "formatting source bibliography",
      "finalising transparent assessment labels",
    ],
  },
];

const STAGE_MS = 1500;

export default function ProgressTracker({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [active, setActive] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (active >= STAGES.length) {
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
    const telemetryTimer = setInterval(() => setTick((v) => v + 1), 420);
    const stageTimer = setTimeout(() => {
      setTick(0);
      setActive((a) => a + 1);
    }, STAGE_MS);
    return () => {
      clearInterval(telemetryTimer);
      clearTimeout(stageTimer);
    };
  }, [active, onComplete]);

  const progress = Math.min((active / STAGES.length) * 100, 100);
  const stage = STAGES[Math.min(active, STAGES.length - 1)];

  return (
    <div
      className="mx-auto max-w-2xl rounded-sm border border-[#D8CDB0] bg-white p-6 sm:p-8"
      data-testid="investigation-progress"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#292522]">
          Investigating
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8D2939]">
          Demonstration run
        </span>
      </div>
      <p className="mt-1 text-sm text-[#5C544E]">
        Following the evidence through five investigation stages.
      </p>

      <div
        className="mt-5 h-1 w-full overflow-hidden rounded-full bg-[#EFE8CC]"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        data-testid="investigation-progress-bar"
      >
        <div
          className="h-full bg-[#8D2939] transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="mt-6 space-y-1" role="list" data-testid="investigation-stage-list">
        {STAGES.map((s, i) => {
          const done = i < active;
          const isActive = i === active;
          return (
            <li
              key={s.id}
              className={`flex items-start gap-3 rounded-sm px-3 py-2.5 transition-colors duration-300 ${
                isActive ? "bg-[#EFE8CC]" : done ? "" : "opacity-45"
              }`}
              aria-current={isActive ? "step" : undefined}
              data-testid={`investigation-stage-${s.id}`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border font-mono text-[9px] ${
                  done
                    ? "border-[#2D6A4F] bg-[#E6F4EA] text-[#1B4D3E]"
                    : isActive
                      ? "border-[#8D2939] bg-[#8D2939] text-white"
                      : "border-[#D8CDB0] text-[#5C544E]"
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : s.id}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`font-mono text-xs uppercase tracking-[0.18em] ${
                    isActive ? "text-[#8D2939]" : "text-[#292522]"
                  }`}
                >
                  {s.id} — {s.label}
                </p>
                {isActive && (
                  <p className="mt-1 truncate font-mono text-[10px] tracking-[0.04em] text-[#5C544E]">
                    {'>'} {s.telemetry[tick % s.telemetry.length]}
                  </p>
                )}
              </div>
              {isActive && (
                <span
                  aria-hidden
                  className="mt-1.5 h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-[#F39291]"
                />
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-6 border-t border-[#EFE8CC] pt-4 font-mono text-[10px] leading-relaxed tracking-[0.06em] text-[#6A625A]">
        PROTOTYPE NOTE — this sequence is a simulated demonstration. A live
        investigation would stream real source discovery and evaluation telemetry.
      </p>
    </div>
  );
}
