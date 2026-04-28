import { useCallback } from "react";
import { useProfiles } from "../hooks/useProfiles";
import { ProfileForm } from "../components/ProfileForm";
import { SettingsForm } from "../components/SettingsForm";

const styles = {
  heading: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1a202c",
    margin: "0 0 24px",
  } as React.CSSProperties,
  section: {
    marginBottom: 32,
  } as React.CSSProperties,
  sectionHeading: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#1a202c",
    margin: "0 0 12px",
  } as React.CSSProperties,
  profileList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 0,
    marginTop: 16,
  } as React.CSSProperties,
  profileItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  } as React.CSSProperties,
  profileInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
    minWidth: 0,
    flex: 1,
  } as React.CSSProperties,
  profileName: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#1a202c",
    margin: 0,
  } as React.CSSProperties,
  profileKeywords: {
    fontSize: "0.8rem",
    color: "#64748b",
    margin: 0,
  } as React.CSSProperties,
  deleteButton: {
    padding: "6px 14px",
    fontSize: "0.8rem",
    fontWeight: 600,
    fontFamily: "inherit",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    transition: "background-color 0.15s ease",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  } as React.CSSProperties,
  statusText: {
    fontSize: "0.875rem",
    color: "#64748b",
    textAlign: "center" as const,
    padding: "24px 0",
  } as React.CSSProperties,
  errorBanner: {
    padding: "10px 14px",
    fontSize: "0.875rem",
    color: "#991b1b",
    backgroundColor: "#fee2e2",
    borderRadius: 6,
    marginBottom: 16,
  } as React.CSSProperties,
  emptyText: {
    fontSize: "0.875rem",
    color: "#94a3b8",
    margin: "12px 0 0",
  } as React.CSSProperties,
} as const;

export function Settings() {
  const { profiles, loading, error, create, remove } = useProfiles();

  const handleCreate = useCallback(
    async (name: string, keywords: string[]) => {
      await create(name, keywords);
    },
    [create],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await remove(id);
    },
    [remove],
  );

  return (
    <div>
      <h2 style={styles.heading}>Settings</h2>

      <div style={styles.section}>
        <h3 style={styles.sectionHeading}>Search Profiles</h3>
        <ProfileForm onSubmit={handleCreate} />

        {loading && <p style={styles.statusText}>Loading profiles...</p>}

        {error && <div style={styles.errorBanner}>{error}</div>}

        {!loading && !error && profiles.length === 0 && (
          <p style={styles.emptyText}>
            No profiles yet. Create one above to get started.
          </p>
        )}

        {!loading && profiles.length > 0 && (
          <div style={styles.profileList}>
            {profiles.map((profile) => (
              <div key={profile.id} style={styles.profileItem}>
                <div style={styles.profileInfo}>
                  <p style={styles.profileName}>{profile.name}</p>
                  <p style={styles.profileKeywords}>
                    {profile.keywords.join(", ")}
                  </p>
                </div>
                <button
                  type="button"
                  style={styles.deleteButton}
                  onClick={() => handleDelete(profile.id)}
                  aria-label={`Delete profile ${profile.name}`}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <SettingsForm />
      </div>
    </div>
  );
}
