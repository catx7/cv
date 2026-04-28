// ---------------------------------------------------------------------------
// /api/settings – Application configuration (read-only)
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  // -----------------------------------------------------------------------
  // GET /api/settings
  // -----------------------------------------------------------------------
  app.get("/api/settings", async (_request, reply) => {
    const linkedinEmail = process.env["LINKEDIN_EMAIL"] ?? "";

    return reply.send({
      linkedinEmail,
      linkedinConfigured: linkedinEmail.length > 0,
      ollamaBaseUrl: process.env["OLLAMA_BASE_URL"] ?? "http://localhost:11434",
      ollamaModel: process.env["OLLAMA_MODEL"] ?? "llama3.1",
    });
  });
}
