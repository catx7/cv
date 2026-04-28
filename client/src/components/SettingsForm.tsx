import { useState, useEffect } from "react";
import type { Settings } from "../types";
import * as api from "../api/client";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 24,
  } as React.CSSProperties,
  section: {
    padding: 16,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    backgroundColor: "#fafafa",
  } as React.CSSProperties,
  sectionHeading: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#1a202c",
    margin: "0 0 12px",
  } as React.CSSProperties,
  row: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  } as React.CSSProperties,
  label: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    marginBottom: 4,
  } as React.CSSProperties,
  badgeConfigured: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: "0.8rem",
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: 4,
    backgroundColor: "#d1fae5",
    color: "#065f46",
  } as React.CSSProperties,
  badgeNotConfigured: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: "0.8rem",
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: 4,
    backgroundColor: "#fef3c7",
    color: "#92400e",
  } as React.CSSProperties,
  helpText: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    margin: "8px 0 0",
    lineHeight: 1.5,
  } as React.CSSProperties,
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
    marginBottom: 12,
  } as React.CSSProperties,
  readonlyInput: {
    padding: "8px 12px",
    fontSize: "0.875rem",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    fontFamily: "inherit",
    maxWidth: 400,
  } as React.CSSProperties,
  statusText: {
    fontSize: "0.875rem",
    color: "#64748b",
    textAlign: "center" as const,
    padding: "32px 0",
  } as React.CSSProperties,
  errorBanner: {
    padding: "10px 14px",
    fontSize: "0.875rem",
    color: "#991b1b",
    backgroundColor: "#fee2e2",
    borderRadius: 6,
  } as React.CSSProperties,
} as const;

export function SettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSettings() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getSettings();
        if (!cancelled) {
          setSettings(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch settings",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p style={styles.statusText}>Loading settings...</p>;
  }

  if (error) {
    return <div style={styles.errorBanner}>{error}</div>;
  }

  if (!settings) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h3 style={styles.sectionHeading}>LinkedIn Configuration</h3>

        <div style={styles.row}>
          {settings.linkedinConfigured ? (
            <span style={styles.badgeConfigured}>
              Configured ({settings.linkedinEmail})
            </span>
          ) : (
            <span style={styles.badgeNotConfigured}>Not configured</span>
          )}
        </div>

        <p style={styles.helpText}>
          LinkedIn credentials are configured via the{" "}
          <code
            style={{
              fontSize: "0.8rem",
              backgroundColor: "#e2e8f0",
              padding: "1px 4px",
              borderRadius: 3,
            }}
          >
            .env
          </code>{" "}
          file on the server. Set{" "}
          <code
            style={{
              fontSize: "0.8rem",
              backgroundColor: "#e2e8f0",
              padding: "1px 4px",
              borderRadius: 3,
            }}
          >
            LINKEDIN_EMAIL
          </code>{" "}
          and{" "}
          <code
            style={{
              fontSize: "0.8rem",
              backgroundColor: "#e2e8f0",
              padding: "1px 4px",
              borderRadius: 3,
            }}
          >
            LINKEDIN_PASSWORD
          </code>{" "}
          to enable scanning.
        </p>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionHeading}>Ollama Configuration</h3>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Base URL</label>
          <input
            type="text"
            value={settings.ollamaBaseUrl}
            readOnly
            style={styles.readonlyInput}
            aria-label="Ollama Base URL"
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Model</label>
          <input
            type="text"
            value={settings.ollamaModel}
            readOnly
            style={styles.readonlyInput}
            aria-label="Ollama Model"
          />
        </div>

        <p style={styles.helpText}>
          Ollama settings are configured via the{" "}
          <code
            style={{
              fontSize: "0.8rem",
              backgroundColor: "#e2e8f0",
              padding: "1px 4px",
              borderRadius: 3,
            }}
          >
            .env
          </code>{" "}
          file on the server. Set{" "}
          <code
            style={{
              fontSize: "0.8rem",
              backgroundColor: "#e2e8f0",
              padding: "1px 4px",
              borderRadius: 3,
            }}
          >
            OLLAMA_BASE_URL
          </code>{" "}
          and{" "}
          <code
            style={{
              fontSize: "0.8rem",
              backgroundColor: "#e2e8f0",
              padding: "1px 4px",
              borderRadius: 3,
            }}
          >
            OLLAMA_MODEL
          </code>{" "}
          to customize.
        </p>
      </div>
    </div>
  );
}
