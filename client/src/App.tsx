import { Routes, Route, Link } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";

const styles = {
  app: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 0",
    borderBottom: "1px solid #e2e8f0",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: "#1a202c",
  },
  nav: {
    display: "flex",
    gap: 16,
  },
  link: {
    color: "#4a5568",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    padding: "6px 12px",
    borderRadius: 6,
    transition: "background-color 0.15s ease",
  },
} as const;

export function App() {
  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>LinkedIn Lead Finder</h1>
        <nav style={styles.nav}>
          <Link to="/" style={styles.link}>
            Dashboard
          </Link>
          <Link to="/settings" style={styles.link}>
            Settings
          </Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
