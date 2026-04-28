// ---------------------------------------------------------------------------
// /api/profiles – CRUD routes for search profiles
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { desc, eq } from "drizzle-orm";

import { db } from "../db/connection.js";
import { searchProfiles } from "../db/schema.js";

interface CreateProfileBody {
  name: string;
  keywords: string[];
  filters?: Record<string, unknown>;
}

interface UpdateProfileBody {
  name?: string;
  keywords?: string[];
  filters?: Record<string, unknown>;
}

interface IdParams {
  id: string;
}

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  // -----------------------------------------------------------------------
  // GET /api/profiles
  // -----------------------------------------------------------------------
  app.get("/api/profiles", async (_request, reply) => {
    const profiles = await db.query.searchProfiles.findMany({
      orderBy: desc(searchProfiles.createdAt),
    });

    return reply.send(profiles);
  });

  // -----------------------------------------------------------------------
  // POST /api/profiles
  // -----------------------------------------------------------------------
  app.post<{ Body: CreateProfileBody }>("/api/profiles", async (request, reply) => {
    const { name, keywords, filters } = request.body;

    const [profile] = await db
      .insert(searchProfiles)
      .values({
        name,
        keywords,
        filters: filters ?? null,
      })
      .returning();

    return reply.status(201).send(profile);
  });

  // -----------------------------------------------------------------------
  // PUT /api/profiles/:id
  // -----------------------------------------------------------------------
  app.put<{ Params: IdParams; Body: UpdateProfileBody }>(
    "/api/profiles/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { name, keywords, filters } = request.body;

      const existing = await db.query.searchProfiles.findFirst({
        where: eq(searchProfiles.id, id),
      });

      if (!existing) {
        return reply.status(404).send({ error: "Profile not found" });
      }

      const [updated] = await db
        .update(searchProfiles)
        .set({
          ...(name !== undefined && { name }),
          ...(keywords !== undefined && { keywords }),
          ...(filters !== undefined && { filters }),
          updatedAt: new Date(),
        })
        .where(eq(searchProfiles.id, id))
        .returning();

      return reply.send(updated);
    },
  );

  // -----------------------------------------------------------------------
  // DELETE /api/profiles/:id
  // -----------------------------------------------------------------------
  app.delete<{ Params: IdParams }>(
    "/api/profiles/:id",
    async (request, reply) => {
      const { id } = request.params;

      const existing = await db.query.searchProfiles.findFirst({
        where: eq(searchProfiles.id, id),
      });

      if (!existing) {
        return reply.status(404).send({ error: "Profile not found" });
      }

      await db.delete(searchProfiles).where(eq(searchProfiles.id, id));

      return reply.send({ success: true });
    },
  );
}
