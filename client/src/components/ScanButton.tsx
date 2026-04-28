import type { Scan } from "../types";

interface ScanButtonProps {
  scanning: boolean;
  scan: Scan | null;
  disabled: boolean;
  onScan: () => void;
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap" as const,
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
    }) as React.CSSProperties,
  status: (
    color: "yellow" | "green" | "red",
  ): React.CSSProperties => {
    const colorMap = {
      yellow: { bg: "#fef3c7", text: "#92400e" },
      green: { bg: "#d1fae5", text: "#065f46" },
      red: { bg: "#fee2e2", text: "#991b1b" },
    } as const;
    const c = colorMap[color];
    return {
      fontSize: "0.8rem",
      padding: "4px 10px",
      borderRadius: 4,
      backgroundColor: c.bg,
      color: c.text,
      fontWeight: 500,
    };
  },
} as const;

export function ScanButton({ scanning, scan, disabled, onScan }: ScanButtonProps) {
  const canClick = !scanning && !disabled;

  return (
    <div style={styles.container}>
      <button
        type="button"
        style={styles.button(canClick)}
        onClick={canClick ? onScan : undefined}
        disabled={!canClick}
        aria-label={scanning ? "Scanning in progress" : "Start scan"}
      >
        {scanning ? "Scanning..." : "Scan Now"}
      </button>

      {scan && scan.status === "running" && (
        <span style={styles.status("yellow")}>Scan running...</span>
      )}

      {scan && scan.status === "completed" && (
        <span style={styles.status("green")}>
          Completed - {scan.jobsFound} job{scan.jobsFound !== 1 ? "s" : ""}{" "}
          found
        </span>
      )}

      {scan && scan.status === "failed" && (
        <span style={styles.status("red")}>
          Failed: {scan.errorMessage ?? "Unknown error"}
        </span>
      )}
    </div>
  );
}
