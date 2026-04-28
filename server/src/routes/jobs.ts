// ---------------------------------------------------------------------------
// /api/jobs – Job listing routes
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";

import { getAllJobs, getJobById } from "../services/job-service.js";

interface IdParams {
  id: string;
}

export async function jobRoutes(app: FastifyInstance): Promise<void> {
  // -----------------------------------------------------------------------
  // GET /api/jobs
  // -----------------------------------------------------------------------
  app.get("/api/jobs", async (_request, reply) => {
    const allJobs = await getAllJobs();
    return reply.send(allJobs);
  });

  // -----------------------------------------------------------------------
  // GET /api/jobs/:id
  // -----------------------------------------------------------------------
  app.get<{ Params: IdParams }>("/api/jobs/:id", async (request, reply) => {
    const job = await getJobById(request.params.id);

    if (!job) {
      return reply.status(404).send({ error: "Job not found" });
    }

    return reply.send(job);
  });
}
