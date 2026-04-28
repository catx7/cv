// ---------------------------------------------------------------------------
// HTTP client for the Python scanner micro-service
// ---------------------------------------------------------------------------

const SCANNER_URL = process.env["SCANNER_URL"] ?? "http://localhost:8001";

// ---------------------------------------------------------------------------
// Types – mirror the snake_case contract exposed by the Python service
// ---------------------------------------------------------------------------

export interface ScanParams {
  keywords: string[];
  filters?: Record<string, unknown>;
}

export interface ScannerJob {
  title: string;
  company: string;
  location?: string;
  location_type?: "remote" | "hybrid" | "onsite";
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  experience_level?: "junior" | "mid" | "senior";
  job_type?: "full-time" | "contract" | "freelance";
  contact_info?: {
    email?: string;
    recruiter_name?: string;
    apply_url?: string;
  };
  description: string;
  summary?: string;
  source: "linkedin_jobs" | "linkedin_posts";
  source_url: string;
  posted_at?: string;
  tags: string[];
}

export interface ScannerResponse {
  jobs: ScannerJob[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

/**
 * POST /scan on the Python scanner service and return the parsed response.
 * Throws on network errors or non-2xx status codes.
 */
export async function triggerScan(params: ScanParams): Promise<ScannerResponse> {
  const url = `${SCANNER_URL}/scan`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Scanner service responded with ${response.status}: ${body}`,
    );
  }

  return (await response.json()) as ScannerResponse;
}
