import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, FileText, Link2, Type, Upload } from "lucide-react";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import ProgressTracker from "@/components/ProgressTracker";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EXAMPLE_CLAIMS } from "@/data/demoInvestigation";
import { addHistoryEntry } from "@/lib/storage";
import { investigateText, investigateUrl, investigatePdf } from "@/services/api";

type Mode = "text" | "url" | "document";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const URL_RE = /^https?:\/\/[^\s]+\.[^\s]+$/;

export default function InvestigationPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("text");
  const [claim, setClaim] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState("Ready");

  const urlValid = url.trim() === "" || URL_RE.test(url.trim());
  const canRun = useMemo(() => {
    if (mode === "text") return claim.trim().length >= 10;
    if (mode === "url") return URL_RE.test(url.trim());
    return file !== null;
  }, [mode, claim, url, file]);

  const onInvestigate = async () => {
    if (!canRun) {
      toast.error(
        mode === "text"
          ? "Enter a claim of at least 10 characters."
          : mode === "url"
            ? "Enter a valid http(s) URL."
            : "Attach a PDF document first."
      );
      return;
    }

    try {
      setRunning(true);
      setCurrentStep("Initializing investigation…");

      let report;
      let subject = "";

      if (mode === "text") {
        subject = claim.trim();
        report = await investigateText(claim, (step) => setCurrentStep(step));
      } else if (mode === "url") {
        subject = url.trim();
        report = await investigateUrl(url.trim(), (step) => setCurrentStep(step));
      } else {
        if (!file) {
          throw new Error("No PDF file selected.");
        }
        subject = file.name;
        report = await investigatePdf(file, (step) => setCurrentStep(step));
      }

      const investigation = {
        id: crypto.randomUUID(),
        claim: subject,
        mode,
        report,
        date: new Date().toISOString(),
      };

      sessionStorage.setItem(
        "anveshan_current_investigation",
        JSON.stringify(investigation)
      );

      addHistoryEntry({
        id: investigation.id,
        claim: subject,
        mode,
        date: investigation.date,
      });

      navigate("/results");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Investigation failed."
      );
      setRunning(false);
    }
  };

  const acceptFile = (f: File | null) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("PDF exceeds 10 MB limit.");
      return;
    }
    setFile(f);
  };

  if (running) {
    return (
      <WorkspaceLayout>
        <div className="px-4 py-16 sm:px-6 lg:px-8">
          <ProgressTracker currentStep={currentStep} />
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8D2939]">
          New Investigation
        </p>
        <h1
          className="mt-3 font-heading text-4xl font-semibold tracking-tight text-[#292522] sm:text-5xl"
          data-testid="investigation-heading"
        >
          Start an investigation.
        </h1>
        <p className="mt-3 text-lg text-[#5C544E]">
          Enter a claim in English, Hindi or Hinglish. We'll follow the evidence.
        </p>

        <div className="mt-8 rounded-sm border border-[#D8CDB0] bg-white p-5 sm:p-7 shadow-sm">
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as Mode)}
            data-testid="input-mode-tabs"
          >
            <TabsList className="w-full" data-testid="input-mode-tablist">
              <TabsTrigger value="text" data-testid="input-mode-text" className="flex-1 gap-2">
                <Type className="h-3.5 w-3.5" /> Text claim
              </TabsTrigger>
              <TabsTrigger value="url" data-testid="input-mode-url" className="flex-1 gap-2">
                <Link2 className="h-3.5 w-3.5" /> Website URL
              </TabsTrigger>
              <TabsTrigger value="document" data-testid="input-mode-document" className="flex-1 gap-2">
                <FileText className="h-3.5 w-3.5" /> Document upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-5">
              <label
                htmlFor="claim-input"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5C544E]"
              >
                Claim to investigate
              </label>
              <Textarea
                id="claim-input"
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                rows={5}
                maxLength={1000}
                data-testid="claim-text-input"
                placeholder='e.g. "India has the highest unemployment rate among all developing countries." or "5G causes cancer" or "भारत में बेरोजगारी बढ़ रही है"'
                className="mt-2 resize-y border-[#D8CDB0] bg-[#FDFBF3] leading-relaxed"
              />
              <p className="mt-1.5 text-right font-mono text-[10px] text-[#6A625A]">
                {claim.length}/1000
              </p>
            </TabsContent>

            <TabsContent value="url" className="mt-5">
              <label
                htmlFor="url-input"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5C544E]"
              >
                Article or post URL
              </label>
              <Input
                id="url-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                data-testid="claim-url-input"
                placeholder="https://example.com/article-making-a-claim"
                className="mt-2 border-[#D8CDB0] bg-[#FDFBF3]"
              />
              {!urlValid && (
                <p
                  className="mt-2 font-mono text-[11px] text-[#8B302B]"
                  data-testid="url-input-error"
                >
                  Enter a full URL including http(s):// — claims will be extracted from the page.
                </p>
              )}
            </TabsContent>

            <TabsContent value="document" className="mt-5">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  acceptFile(e.dataTransfer.files?.[0] ?? null);
                }}
                data-testid="document-dropzone"
                className={`flex flex-col items-center justify-center rounded-sm border border-dashed px-6 py-10 text-center transition-colors ${
                  dragging ? "border-[#8D2939] bg-[#FCE8E6]" : "border-[#D8CDB0] bg-[#FDFBF3]"
                }`}
              >
                <Upload className="h-6 w-6 text-[#8D2939]" />
                <p className="mt-3 text-sm text-[#292522]">
                  Drag & drop a PDF here, or
                </p>
                <label
                  htmlFor="document-file-input"
                  data-testid="document-browse-button"
                  className="mt-2 cursor-pointer rounded-sm border border-[#8D2939] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8D2939] transition-colors hover:bg-[#FCE8E6]"
                >
                  Browse files
                </label>
                <input
                  id="document-file-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  data-testid="document-file-input"
                  onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
                />
                <p className="mt-3 font-mono text-[10px] tracking-[0.08em] text-[#6A625A]">
                  PDF documents up to 10 MB · Text is extracted and factual assertions investigated
                </p>
              </div>
              {file && (
                <div
                  className="mt-3 flex items-center gap-3 rounded-sm border border-[#D8CDB0] bg-white px-3.5 py-2.5"
                  data-testid="document-file-summary"
                >
                  <FileText className="h-4 w-4 flex-shrink-0 text-[#8D2939]" />
                  <span className="min-w-0 flex-1 truncate text-sm text-[#292522]">
                    {file.name}
                  </span>
                  <span className="font-mono text-[10px] text-[#5C544E]">
                    {formatBytes(file.size)}
                  </span>
                  <button
                    type="button"
                    data-testid="document-remove-file"
                    onClick={() => setFile(null)}
                    className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8B302B] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-6 border-t border-[#EFE8CC] pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5C544E]">
              Try an example claim
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {EXAMPLE_CLAIMS.map((c) => (
                <button
                  key={c}
                  type="button"
                  data-testid={`example-claim-${EXAMPLE_CLAIMS.indexOf(c)}`}
                  onClick={() => {
                    setMode("text");
                    setClaim(c);
                  }}
                  className="rounded-sm border border-[#D8CDB0] bg-[#FDFBF3] px-3 py-1.5 text-left text-xs leading-snug text-[#3D3834] transition-colors hover:border-[#8D2939] hover:bg-[#FCE8E6]"
                >
                  {c.length > 64 ? c.slice(0, 63) + "…" : c}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onInvestigate}
            disabled={!canRun}
            data-testid="investigate-claim-button"
            className="mt-7 inline-flex w-full items-center justify-center gap-2.5 rounded-sm bg-[#8D2939] px-6 py-3.5 font-mono text-sm font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#741F2D] disabled:cursor-not-allowed disabled:opacity-45 shadow-sm"
          >
            Investigate Claim
            <ArrowRight className="h-4 w-4" />
          </button>
          {!canRun && (
            <p
              className="mt-2 text-center font-mono text-[10px] tracking-[0.08em] text-[#6A625A]"
              data-testid="investigate-button-hint"
            >
              {mode === "text"
                ? "Enter at least 10 characters to begin."
                : mode === "url"
                  ? "Provide a valid http(s) URL to begin."
                  : "Attach a PDF document to begin."}
            </p>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}
