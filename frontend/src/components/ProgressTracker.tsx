import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const STAGES = [
  {
    id: "01",
    label: "PARSING & DECOMPOSING",
    keywords: ["starting", "breaking", "decomposing", "parsing", "cached"],
    description: "Detecting language, isolating factual assertion, and decomposing into subclaims",
  },
  {
    id: "02",
    label: "DISCOVERING SOURCES",
    keywords: ["searching", "discovering", "querying"],
    description: "Searching primary, official, opposing and corroborating sources",
  },
  {
    id: "03",
    label: "READING DOCUMENTS",
    keywords: ["reading", "retrieving", "fetching"],
    description: "Extracting complete text content and screening candidates",
  },
  {
    id: "04",
    label: "EXTRACTING & VERIFYING PASSAGES",
    keywords: ["extracting", "verifying", "quotes"],
    description: "Checking verbatim character matches and verifying quote integrity",
  },
  {
    id: "05",
    label: "INDEPENDENCE & ASSESSMENT",
    keywords: ["independent", "weighing", "compiling", "evaluating"],
    description: "Detecting syndicated cross-dependencies and compiling final dossier",
  },
];

interface ProgressTrackerProps {
  currentStep?: string;
  onComplete?: () => void;
}

export default function ProgressTracker({
  currentStep = "Initiating investigation…",
  onComplete,
}: ProgressTrackerProps) {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const stepLower = currentStep.toLowerCase();
    const stageIndex = STAGES.findIndex((s) =>
      s.keywords.some((kw) => stepLower.includes(kw))
    );
    if (stageIndex >= 0) {
      setActiveStage(stageIndex);
    }
  }, [currentStep]);

  const progressPercent = Math.min(
    Math.max(((activeStage + 1) / STAGES.length) * 100, 20),
    100
  );

  return (
    <div
      className="mx-auto max-w-2xl rounded-sm border border-[#D8CDB0] bg-white p-6 sm:p-8 shadow-sm"
      data-testid="investigation-progress"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#292522]">
          Investigating Claim
        </h2>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8D2939]">
          <Loader2 className="h-3 w-3 animate-spin" /> Live Pipeline
        </span>
      </div>

      <p className="mt-1 text-sm text-[#5C544E]">
        Verifying assertions through open-web retrieval, primary sources, and cross-source evaluation.
      </p>

      {/* Progress bar */}
      <div
        className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[#EFE8CC]"
        role="progressbar"
        aria-valuenow={Math.round(progressPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        data-testid="investigation-progress-bar"
      >
        <div
          className="h-full bg-[#8D2939] transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Current Step Banner */}
      <div className="mt-6 flex items-center gap-3 rounded-sm border border-[#D8CDB0] bg-[#FDFBF3] px-4 py-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8D2939] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#8D2939]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8D2939]">
            Active Step
          </p>
          <p className="mt-0.5 truncate font-mono text-sm font-medium text-[#292522]" data-testid="current-step-display">
            {currentStep}
          </p>
        </div>
      </div>

      {/* Stages list */}
      <ol className="mt-6 space-y-2" role="list" data-testid="investigation-stage-list">
        {STAGES.map((s, i) => {
          const done = i < activeStage;
          const isActive = i === activeStage;
          return (
            <li
              key={s.id}
              className={`flex items-start gap-3 rounded-sm px-3.5 py-2.5 transition-colors duration-300 ${
                isActive
                  ? "border border-[#D8CDB0] bg-[#EFE8CC]/70"
                  : done
                    ? "opacity-90"
                    : "opacity-45"
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
                  className={`font-mono text-xs uppercase tracking-[0.16em] font-medium ${
                    isActive ? "text-[#8D2939]" : "text-[#292522]"
                  }`}
                >
                  {s.id} — {s.label}
                </p>
                <p className="mt-0.5 text-xs text-[#5C544E]">
                  {s.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 border-t border-[#EFE8CC] pt-4 font-mono text-[10px] leading-relaxed tracking-[0.06em] text-[#6A625A]">
        Investigations check official sources, research publications, and press archives. Results stream directly from the analysis engine.
      </p>
    </div>
  );
}
