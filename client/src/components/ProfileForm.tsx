import { useState } from "react";

interface ProfileFormProps {
  onSubmit: (name: string, keywords: string[]) => Promise<void>;
}

const styles = {
  form: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 10,
    alignItems: "flex-end",
    padding: 16,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    backgroundColor: "#fafafa",
  } as React.CSSProperties,
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    flex: "1 1 180px",
    minWidth: 0,
  } as React.CSSProperties,
  label: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  } as React.CSSProperties,
  input: {
    padding: "8px 12px",
    fontSize: "0.875rem",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    outline: "none",
    color: "#1a202c",
    backgroundColor: "#fff",
    fontFamily: "inherit",
  } as React.CSSProperties,
  button: (active: boolean) =>
    ({
      padding: "8px 20px",
      fontSize: "0.875rem",
      fontWeight: 600,
      fontFamily: "inherit",
      border: "none",
      borderRadius: 6,
      cursor: active ? "pointer" : "default",
      backgroundColor: active ? "#2563eb" : "#94a3b8",
      color: "#fff",
      transition: "background-color 0.15s ease",
      whiteSpace: "nowrap" as const,
      alignSelf: "flex-end",
    }) as React.CSSProperties,
} as const;

export function ProfileForm({ onSubmit }: ProfileFormProps) {
  const [name, setName] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parsedKeywords = keywordsInput
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const canSubmit =
    !submitting && name.trim().length > 0 && parsedKeywords.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await onSubmit(name.trim(), parsedKeywords);
      setName("");
      setKeywordsInput("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form style={styles.form} onSubmit={handleSubmit}>
      <div style={styles.fieldGroup}>
        <label style={styles.label} htmlFor="profile-name">
          Profile Name
        </label>
        <input
          id="profile-name"
          type="text"
          placeholder="e.g. React Senior"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
          disabled={submitting}
        />
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label} htmlFor="profile-keywords">
          Keywords (comma-separated)
        </label>
        <input
          id="profile-keywords"
          type="text"
          placeholder="e.g. react, typescript, senior"
          value={keywordsInput}
          onChange={(e) => setKeywordsInput(e.target.value)}
          style={styles.input}
          disabled={submitting}
        />
      </div>

      <button
        type="submit"
        style={styles.button(canSubmit)}
        disabled={!canSubmit}
      >
        {submitting ? "Adding..." : "Add Profile"}
      </button>
    </form>
  );
}
