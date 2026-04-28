import type { Job, SearchProfile, Scan, Settings } from "../types";

const BASE_URL = "/api";

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(
      response.status,
      body || `Request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

// Jobs
export function getJobs(): Promise<Job[]> {
  return request<Job[]>("/jobs");
}

export function getJob(id: string): Promise<Job> {
  return request<Job>(`/jobs/${id}`);
}

// Search Profiles
export function getProfiles(): Promise<SearchProfile[]> {
  return request<SearchProfile[]>("/profiles");
}

export function createProfile(data: {
  name: string;
  keywords: string[];
}): Promise<SearchProfile> {
  return request<SearchProfile>("/profiles", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProfile(
  id: string,
  data: { name: string; keywords: string[] },
): Promise<SearchProfile> {
  return request<SearchProfile>(`/profiles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProfile(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/profiles/${id}`, {
    method: "DELETE",
  });
}

// Scans
export function startScan(
  searchProfileId: string,
): Promise<{ scanId: string }> {
  return request<{ scanId: string }>("/scans", {
    method: "POST",
    body: JSON.stringify({ searchProfileId }),
  });
}

export function getScan(id: string): Promise<Scan> {
  return request<Scan>(`/scans/${id}`);
}

export function getScans(): Promise<Scan[]> {
  return request<Scan[]>("/scans");
}

// Settings
export function getSettings(): Promise<Settings> {
  return request<Settings>("/settings");
}
