import type { SearchProfile } from "../types";

interface ProfileSelectorProps {
  profiles: SearchProfile[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const styles = {
  select: {
    padding: "8px 12px",
    fontSize: "0.875rem",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    outline: "none",
    color: "#1a202c",
    backgroundColor: "#fff",
    cursor: "pointer",
    minWidth: 220,
    fontFamily: "inherit",
  } as React.CSSProperties,
} as const;

export function ProfileSelector({
  profiles,
  selectedId,
  onSelect,
}: ProfileSelectorProps) {
  return (
    <select
      value={selectedId ?? ""}
      onChange={(e) => onSelect(e.target.value || null)}
      style={styles.select}
      aria-label="Select search profile"
    >
      <option value="">Select profile...</option>
      {profiles.map((profile) => (
        <option key={profile.id} value={profile.id}>
          {profile.name} - {profile.keywords.join(", ")}
        </option>
      ))}
    </select>
  );
}
