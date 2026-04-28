import { useState } from "react";
import type { Job } from "../types";

interface JobCardProps {
  job: Job;
}

function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null,
): string | null {
  if (min === null && max === null) return null;

  const cur = currency ?? "USD";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);

  if (min !== null && max !== null) return `${fmt(min)} - ${fmt(max)}`;
  if (min !== null) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const styles = {
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    transition: "box-shadow 0.15s ease",
  } as React.CSSProperties,
  header: {
    padding: "14px 16px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    userSelect: "none" as const,
  } as React.CSSProperties,
  headerTopRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  } as React.CSSProperties,
  titleGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
    minWidth: 0,
    flex: 1,
  } as React.CSSProperties,
  title: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#1a202c",
    margin: 0,
    lineHeight: 1.3,
  } as React.CSSProperties,
  companyLocation: {
    fontSize: "0.875rem",
    color: "#64748b",
    margin: 0,
  } as React.CSSProperties,
  rightGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  } as React.CSSProperties,
  salary: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#059669",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  locationBadge: (isRemote: boolean) =>
    ({
      fontSize: "0.75rem",
      fontWeight: 500,
      padding: "2px 8px",
      borderRadius: 4,
      whiteSpace: "nowrap" as const,
      backgroundColor: isRemote ? "#d1fae5" : "#dbeafe",
      color: isRemote ? "#065f46" : "#1e40af",
    }) as React.CSSProperties,
  tagsRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 6,
  } as React.CSSProperties,
  tag: {
    fontSize: "0.75rem",
    padding: "2px 8px",
    borderRadius: 4,
    backgroundColor: "#f3f4f6",
    color: "#374151",
  } as React.CSSProperties,
  experienceTag: {
    fontSize: "0.75rem",
    padding: "2px 8px",
    borderRadius: 4,
    backgroundColor: "#fef3c7",
    color: "#92400e",
  } as React.CSSProperties,
  jobTypeTag: {
    fontSize: "0.75rem",
    padding: "2px 8px",
    borderRadius: 4,
    backgroundColor: "#ede9fe",
    color: "#5b21b6",
  } as React.CSSProperties,
  expandedSection: {
    padding: "0 16px 16px",
    borderTop: "1px solid #f3f4f6",
    display: "flex",
    flexDirection: "column" as const,
    gap: 14,
  } as React.CSSProperties,
  sectionLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: 4,
  } as React.CSSProperties,
  summary: {
    fontSize: "0.875rem",
    color: "#334155",
    lineHeight: 1.6,
    margin: 0,
    paddingTop: 14,
  } as React.CSSProperties,
  contactRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 16,
    fontSize: "0.875rem",
    color: "#475569",
  } as React.CSSProperties,
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  } as React.CSSProperties,
  contactLabel: {
    fontWeight: 600,
    color: "#64748b",
  } as React.CSSProperties,
  link: {
    color: "#2563eb",
    textDecoration: "none",
  } as React.CSSProperties,
  description: {
    fontSize: "0.875rem",
    color: "#334155",
    lineHeight: 1.6,
    margin: 0,
    whiteSpace: "pre-wrap" as const,
    maxHeight: 300,
    overflowY: "auto" as const,
  } as React.CSSProperties,
  metaRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 16,
    fontSize: "0.8rem",
    color: "#94a3b8",
  } as React.CSSProperties,
  chevron: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    transition: "transform 0.15s ease",
    flexShrink: 0,
    marginTop: 2,
  } as React.CSSProperties,
} as const;

export function JobCard({ job }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  const salaryText = formatSalary(
    job.salaryMin,
    job.salaryMax,
    job.salaryCurrency,
  );
  const isRemote = job.locationType === "remote";
  const locationLabel = job.location ?? "";
  const companyLine = [job.company, locationLabel].filter(Boolean).join(" - ");

  return (
    <div
      style={{
        ...styles.card,
        boxShadow: expanded
          ? "0 2px 8px rgba(0,0,0,0.08)"
          : "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={styles.header}
        onClick={() => setExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        aria-expanded={expanded}
      >
        <div style={styles.headerTopRow}>
          <div style={styles.titleGroup}>
            <h3 style={styles.title}>{job.title}</h3>
            <p style={styles.companyLocation}>{companyLine}</p>
          </div>
          <div style={styles.rightGroup}>
            {salaryText && <span style={styles.salary}>{salaryText}</span>}
            {job.locationType && (
              <span style={styles.locationBadge(isRemote)}>
                {job.locationType}
              </span>
            )}
            <span
              style={{
                ...styles.chevron,
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              &#9660;
            </span>
          </div>
        </div>

        {(job.tags.length > 0 ||
          job.experienceLevel !== null ||
          job.jobType !== null) && (
          <div style={styles.tagsRow}>
            {job.experienceLevel && (
              <span style={styles.experienceTag}>{job.experienceLevel}</span>
            )}
            {job.jobType && (
              <span style={styles.jobTypeTag}>{job.jobType}</span>
            )}
            {job.tags.map((tag) => (
              <span key={tag} style={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {expanded && (
        <div style={styles.expandedSection}>
          {job.summary && (
            <div>
              <div style={styles.sectionLabel}>AI Summary</div>
              <p style={styles.summary}>{job.summary}</p>
            </div>
          )}

          {job.contactInfo &&
            (job.contactInfo.recruiterName ||
              job.contactInfo.email ||
              job.contactInfo.applyUrl) && (
              <div>
                <div style={styles.sectionLabel}>Contact</div>
                <div style={styles.contactRow}>
                  {job.contactInfo.recruiterName && (
                    <div style={styles.contactItem}>
                      <span style={styles.contactLabel}>Recruiter:</span>
                      <span>{job.contactInfo.recruiterName}</span>
                    </div>
                  )}
                  {job.contactInfo.email && (
                    <div style={styles.contactItem}>
                      <span style={styles.contactLabel}>Email:</span>
                      <a
                        href={`mailto:${job.contactInfo.email}`}
                        style={styles.link}
                      >
                        {job.contactInfo.email}
                      </a>
                    </div>
                  )}
                  {job.contactInfo.applyUrl && (
                    <div style={styles.contactItem}>
                      <a
                        href={job.contactInfo.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.link}
                      >
                        Apply Link
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

          <div>
            <div style={styles.sectionLabel}>Description</div>
            <p style={styles.description}>{job.description}</p>
          </div>

          <div style={styles.metaRow}>
            <span>
              Source:{" "}
              {job.source === "linkedin_jobs"
                ? "LinkedIn Jobs"
                : "LinkedIn Posts"}
            </span>
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...styles.link, fontSize: "0.8rem" }}
            >
              View on LinkedIn
            </a>
            {job.postedAt && <span>Posted: {formatDate(job.postedAt)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
