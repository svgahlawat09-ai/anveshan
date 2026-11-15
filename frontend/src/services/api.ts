const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export interface EvidenceSource {
  quote: string;
  relation: string;
  source_type: string;
  published?: string | null;
  verified?: boolean;
  url: string;
  domain: string;
}

export interface SubclaimResult {
  id: string;
  text: string;
  status: string;
  explanation: string;
  evidence: EvidenceSource[];
}

export interface InvestigationResult {
  overall: {
    label: string;
    summary: string;
    coverage: string;
    source_quality: string;
  };
  subclaims: SubclaimResult[];
  missing: string[];
  stats?: {
    sources_read: number;
    quotes_proposed: number;
    quotes_verified: number;
  };
  limitations?: string;
  extracted_claims?: string[];
  original_language?: string;
}

async function pollJob(
  job_id: string,
  onStep?: (step: string) => void
): Promise<InvestigationResult> {
  for (let attempt = 0; attempt < 180; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const response = await fetch(`${API_BASE}/result/${job_id}`);
    if (!response.ok) {
      throw new Error("Could not retrieve investigation status.");
    }
    const job = await response.json();
    if (job.status === "done") {
      if (!job.report) {
        throw new Error("Investigation returned an empty report.");
      }
      return job.report as InvestigationResult;
    }
    if (job.status === "failed") {
      throw new Error(job.step || "Investigation failed.");
    }
    onStep?.(job.step || "Investigating claim...");
  }
  throw new Error("Investigation timed out. Please try again.");
}

export async function investigateText(
  text: string,
  onStep?: (step: string) => void
): Promise<InvestigationResult> {
  if (!API_BASE) {
    throw new Error("Backend URL is not configured.");
  }
  const startResponse = await fetch(`${API_BASE}/investigate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (!startResponse.ok) {
    const err = await startResponse.json().catch(() => ({}));
    throw new Error(err.detail || "Could not start investigation.");
  }
  const { job_id } = await startResponse.json();
  if (!job_id) {
    throw new Error("Backend did not return a job ID.");
  }
  return pollJob(job_id, onStep);
}

export async function investigatePdf(
  file: File,
  onStep?: (step: string) => void
): Promise<InvestigationResult> {
  if (!API_BASE) {
    throw new Error("Backend URL is not configured.");
  }
  const formData = new FormData();
  formData.append("file", file);

  const startResponse = await fetch(`${API_BASE}/investigate/pdf`, {
    method: "POST",
    body: formData,
  });
  if (!startResponse.ok) {
    const err = await startResponse.json().catch(() => ({}));
    throw new Error(err.detail || "Could not upload and start PDF investigation.");
  }
  const { job_id } = await startResponse.json();
  if (!job_id) {
    throw new Error("Backend did not return a job ID.");
  }
  return pollJob(job_id, onStep);
}

export async function investigateUrl(
  url: string,
  onStep?: (step: string) => void
): Promise<InvestigationResult> {
  if (!API_BASE) {
    throw new Error("Backend URL is not configured.");
  }
  const startResponse = await fetch(`${API_BASE}/investigate/url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });
  if (!startResponse.ok) {
    const err = await startResponse.json().catch(() => ({}));
    throw new Error(err.detail || "Could not start URL investigation.");
  }
  const { job_id } = await startResponse.json();
  if (!job_id) {
    throw new Error("Backend did not return a job ID.");
  }
  return pollJob(job_id, onStep);
}
