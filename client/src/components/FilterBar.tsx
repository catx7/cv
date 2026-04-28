// Define locally since hooks are created in parallel
interface JobFilters {
  search: string;
  tags: string[];
  experienceLevel: string | null;
  jobType: string | null;
  locationType: string | null;
}

interface FilterBarProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  allTags: string[];
}

const EXPERIENCE_OPTIONS = [
  { value: "", label: "All Experience" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
] as const;

const JOB_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "full-time", label: "Full-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
] as const;

const LOCATION_TYPE_OPTIONS = [
  { value: "", label: "All Locations" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
] as const;

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    padding: 16,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    backgroundColor: "#fafafa",
    marginBottom: 16,
  } as React.CSSProperties,
  row: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 10,
    alignItems: "center",
  } as React.CSSProperties,
  input: {
    flex: "1 1 220px",
    padding: "8px 12px",
    fontSize: "0.875rem",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    outline: "none",
    color: "#1a202c",
    backgroundColor: "#fff",
    minWidth: 0,
  } as React.CSSProperties,
  select: {
    padding: "8px 12px",
    fontSize: "0.875rem",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    outline: "none",
    color: "#1a202c",
    backgroundColor: "#fff",
    cursor: "pointer",
  } as React.CSSProperties,
  tagsSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  } as React.CSSProperties,
  tagBadgesRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 6,
  } as React.CSSProperties,
  tagBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: "0.75rem",
    padding: "3px 8px",
    borderRadius: 4,
    backgroundColor: "#e0e7ff",
    color: "#3730a3",
    cursor: "pointer",
    border: "none",
    fontFamily: "inherit",
    lineHeight: 1.4,
  } as React.CSSProperties,
  tagRemove: {
    fontWeight: 700,
    fontSize: "0.8rem",
    marginLeft: 2,
  } as React.CSSProperties,
} as const;

export function FilterBar({ filters, onFiltersChange, allTags }: FilterBarProps) {
  const availableTags = allTags.filter((t) => !filters.tags.includes(t));

  const updateFilter = <K extends keyof JobFilters>(
    key: K,
    value: JobFilters[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleAddTag = (tag: string) => {
    if (tag && !filters.tags.includes(tag)) {
      updateFilter("tags", [...filters.tags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    updateFilter(
      "tags",
      filters.tags.filter((t) => t !== tag),
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <input
          type="text"
          placeholder="Search jobs..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          style={styles.input}
          aria-label="Search jobs"
        />

        <select
          value={filters.experienceLevel ?? ""}
          onChange={(e) =>
            updateFilter("experienceLevel", e.target.value || null)
          }
          style={styles.select}
          aria-label="Experience level"
        >
          {EXPERIENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.jobType ?? ""}
          onChange={(e) => updateFilter("jobType", e.target.value || null)}
          style={styles.select}
          aria-label="Job type"
        >
          {JOB_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.locationType ?? ""}
          onChange={(e) =>
            updateFilter("locationType", e.target.value || null)
          }
          style={styles.select}
          aria-label="Location type"
        >
          {LOCATION_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {(availableTags.length > 0 || filters.tags.length > 0) && (
        <div style={styles.tagsSection}>
          <div style={styles.row}>
            {availableTags.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  handleAddTag(e.target.value);
                  e.target.value = "";
                }}
                style={styles.select}
                aria-label="Add tag filter"
              >
                <option value="" disabled>
                  Add tag filter...
                </option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            )}
          </div>

          {filters.tags.length > 0 && (
            <div style={styles.tagBadgesRow}>
              {filters.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  style={styles.tagBadge}
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={`Remove ${tag} filter`}
                >
                  {tag}
                  <span style={styles.tagRemove}>&times;</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
