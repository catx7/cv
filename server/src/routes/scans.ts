// ---------------------------------------------------------------------------
// /api/scans – Scan trigger & status routes
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";

import { startScan, getScanById, getScans } from "../services/scan-service.js";

interface StartScanBody {
  searchProfileId: string;
}

interface IdParams {
  id: string;
}

export async function scanRoutes(app: FastifyInstance): Promise<void> {
  // -----------------------------------------------------------------------
  // POST /api/scans
  // -----------------------------------------------------------------------
  app.post<{ Body: StartScanBody }>("/api/scans", async (request, reply) => {
    const { searchProfileId } = request.body;

    try {
      const scanId = await startScan(searchProfileId);
      return reply.status(202).send({ scanId });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("not found")
      ) {
        return reply.status(404).send({ error: error.message });
      }
      throw error;
    }
  });

  // -----------------------------------------------------------------------
  // GET /api/scans/:id
  // -----------------------------------------------------------------------
  app.get<{ Params: IdParams }>("/api/scans/:id", async (request, reply) => {
    const scan = await getScanById(request.params.id);

    if (!scan) {
      return reply.status(404).send({ error: "Scan not found" });
    }

    return reply.send(scan);
  });

  // -----------------------------------------------------------------------
  // GET /api/scans
  // -----------------------------------------------------------------------
  app.get("/api/scans", async (_request, reply) => {
    const allScans = await getScans();
    return reply.send(allScans);
  });
}
