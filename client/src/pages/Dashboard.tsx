import { useState, useCallback } from "react";
import { useJobs } from "../hooks/useJobs";
import { useProfiles } from "../hooks/useProfiles";
import { useScan } from "../hooks/useScan";
import { JobTable } from "../components/JobTable";
import { FilterBar } from "../components/FilterBar";
import { ScanButton } from "../components/ScanButton";
import { ProfileSelector } from "../components/ProfileSelector";
import { ProfileForm } from "../components/ProfileForm";

const styles = {
  heading: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1a202c",
    margin: "0 0 20px",
  } as React.CSSProperties,
  topRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  } as React.CSSProperties,
  quickAddSection: {
    marginBottom: 20,
  } as React.CSSProperties,
  quickAddHeading: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#64748b",
    margin: "0 0 8px",
  } as React.CSSProperties,
  errorBanner: {
    padding: "10px 14px",
    fontSize: "0.875rem",
    color: "#991b1b",
    backgroundColor: "#fee2e2",
    borderRadius: 6,
    marginBottom: 16,
  } as React.CSSProperties,
} as const;

export function Dashboard() {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const { jobs, allTags, loading, error, filters, setFilters, refetch } =
    useJobs();
  const {
    profiles,
    loading: profilesLoading,
    create,
  } = useProfiles();
  const { scan, scanning, startScan } = useScan();

  const handleScan = useCallback(() => {
    if (!selectedProfileId) return;
    startScan(selectedProfileId, () => {
      refetch();
    });
  }, [selectedProfileId, startScan, refetch]);

  const handleCreateProfile = useCallback(
    async (name: string, keywords: string[]) => {
      const profile = await create(name, keywords);
      setSelectedProfileId(profile.id);
    },
    [create],
  );

  return (
    <div>
      <h2 style={styles.heading}>Dashboard</h2>

      <div style={styles.topRow}>
        <ProfileSelector
          profiles={profiles}
          selectedId={selectedProfileId}
          onSelect={setSelectedProfileId}
        />
        <ScanButton
          scanning={scanning}
          scan={scan}
          disabled={selectedProfileId === null || profilesLoading}
          onScan={handleScan}
        />
      </div>

      <div style={styles.quickAddSection}>
        <p style={styles.quickAddHeading}>Quick Add Profile</p>
        <ProfileForm onSubmit={handleCreateProfile} />
      </div>

      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        allTags={allTags}
      />

      {error && <div style={styles.errorBanner}>{error}</div>}

      <JobTable jobs={jobs} loading={loading} />
    </div>
  );
}
