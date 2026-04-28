import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";

import { profileRoutes } from "./routes/profiles.js";
import { scanRoutes } from "./routes/scans.js";
import { jobRoutes } from "./routes/jobs.js";
import { settingsRoutes } from "./routes/settings.js";

const PORT = Number(process.env["PORT"] ?? 3001);
const HOST = process.env["HOST"] ?? "0.0.0.0";

const app = Fastify({ logger: true });

// ---------------------------------------------------------------------------
// Plugins
// ---------------------------------------------------------------------------

await app.register(cors, {
  origin: "http://localhost:5173",
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get("/api/health", async () => {
  return { status: "ok" };
});

await app.register(profileRoutes);
await app.register(scanRoutes);
await app.register(jobRoutes);
await app.register(settingsRoutes);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

try {
  await app.listen({ port: PORT, host: HOST });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
