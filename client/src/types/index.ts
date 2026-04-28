export interface ContactInfo {
  email?: string;
  recruiterName?: string;
  applyUrl?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  locationType: "remote" | "hybrid" | "onsite" | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  experienceLevel: "junior" | "mid" | "senior" | null;
  jobType: "full-time" | "contract" | "freelance" | null;
  contactInfo: ContactInfo | null;
  description: string;
  summary: string | null;
  source: "linkedin_jobs" | "linkedin_posts";
  sourceUrl: string;
  postedAt: string | null;
  scrapedAt: string;
  createdAt: string;
  tags: string[];
}

export interface SearchProfile {
  id: string;
  name: string;
  keywords: string[];
  filters: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Scan {
  id: string;
  searchProfileId: string;
  status: "running" | "completed" | "failed";
  jobsFound: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface Settings {
  linkedinEmail: string;
  linkedinConfigured: boolean;
  ollamaBaseUrl: string;
  ollamaModel: string;
}
