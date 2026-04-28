import type { Job } from "../types";
import { JobCard } from "./JobCard";

interface JobTableProps {
  jobs: Job[];
  loading: boolean;
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 0,
  } as React.CSSProperties,
  statusText: {
    fontSize: "0.875rem",
    color: "#64748b",
    textAlign: "center" as const,
    padding: "32px 0",
  } as React.CSSProperties,
  count: {
    fontSize: "0.875rem",
    color: "#64748b",
    marginBottom: 12,
  } as React.CSSProperties,
} as const;

export function JobTable({ jobs, loading }: JobTableProps) {
  if (loading) {
    return <p style={styles.statusText}>Loading jobs...</p>;
  }

  if (jobs.length === 0) {
    return (
      <p style={styles.statusText}>
        No jobs found. Try adjusting your filters or run a new scan.
      </p>
    );
  }

  return (
    <div style={styles.container}>
      <p style={styles.count}>
        {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
      </p>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
