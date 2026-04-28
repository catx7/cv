// ---------------------------------------------------------------------------
// Shared types for the Lead Finder API
// ---------------------------------------------------------------------------

export interface ContactInfo {
  email?: string;
  recruiterName?: string;
  applyUrl?: string;
}

export interface ExtractedJob {
  title: string;
  company: string;
  location?: string;
  locationType?: "remote" | "hybrid" | "onsite";
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  experienceLevel?: "junior" | "mid" | "senior";
  jobType?: "full-time" | "contract" | "freelance";
  contactInfo?: ContactInfo;
  description: string;
  summary?: string;
  source: "linkedin_jobs" | "linkedin_posts";
  sourceUrl: string;
  postedAt?: string;
  tags: string[];
}

export interface ScanRequest {
  searchProfileId: string;
}

export interface ScanResult {
  jobs: ExtractedJob[];
  error?: string;
}
