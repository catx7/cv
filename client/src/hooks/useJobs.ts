import { useState, useEffect, useCallback, useMemo } from "react";
import type { Job } from "../types";
import * as api from "../api/client";

export interface JobFilters {
  search: string;
  tags: string[];
  experienceLevel: string | null;
  jobType: string | null;
  locationType: string | null;
}

const DEFAULT_FILTERS: JobFilters = {
  search: "",
  tags: [],
  experienceLevel: null,
  jobType: null,
  locationType: null,
};

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getJobs();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search filter: match against title, company, or description
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesSearch =
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Tags filter: job must contain ALL selected tags
      if (filters.tags.length > 0) {
        const hasAllTags = filters.tags.every((tag) => job.tags.includes(tag));
        if (!hasAllTags) return false;
      }

      // Experience level filter
      if (filters.experienceLevel !== null) {
        if (job.experienceLevel !== filters.experienceLevel) return false;
      }

      // Job type filter
      if (filters.jobType !== null) {
        if (job.jobType !== filters.jobType) return false;
      }

      // Location type filter
      if (filters.locationType !== null) {
        if (job.locationType !== filters.locationType) return false;
      }

      return true;
    });
  }, [jobs, filters]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const job of jobs) {
      for (const tag of job.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [jobs]);

  return {
    jobs: filteredJobs,
    allJobs: jobs,
    allTags,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchJobs,
  };
}
