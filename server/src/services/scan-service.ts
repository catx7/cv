// ---------------------------------------------------------------------------
// Scan orchestration service
// ---------------------------------------------------------------------------

import { desc, eq } from "drizzle-orm";

import { db } from "../db/connection.js";
import { scans, searchProfiles } from "../db/schema.js";
import { triggerScan } from "./scanner-client.js";
import { persistJobs } from "./job-service.js";

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/**
 * Kick off a new scan for a given search profile.
 * Inserts a "running" scan record, fires the actual scan async (non-blocking),
 * and returns the scan id immediately so the client can poll for status.
 */
export async function startScan(searchProfileId: string): Promise<string> {
  const profile = await db.query.searchProfiles.findFirst({
    where: eq(searchProfiles.id, searchProfileId),
  });

  if (!profile) {
    throw new Error(`Search profile not found: ${searchProfileId}`);
  }

  const [scan] = await db
    .insert(scans)
    .values({ searchProfileId })
    .returning({ id: scans.id });

  // Fire-and-forget – errors are captured inside runScan
  runScan(scan.id, profile.keywords, profile.filters ?? undefined).catch(
    () => {
      /* already handled inside runScan */
    },
  );

  return scan.id;
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

/**
 * Execute the actual scan against the Python scanner service, persist results,
 * and update the scan record accordingly.
 */
async function runScan(
  scanId: string,
  keywords: string[],
  filters?: Record<string, unknown>,
): Promise<void> {
  try {
    const result = await triggerScan({ keywords, filters });

    if (result.error) {
      await db
        .update(scans)
        .set({
          status: "failed",
          errorMessage: result.error,
          completedAt: new Date(),
        })
        .where(eq(scans.id, scanId));
      return;
    }

    const jobsFound = await persistJobs(result.jobs);

    await db
      .update(scans)
      .set({
        status: "completed",
        jobsFound,
        completedAt: new Date(),
      })
      .where(eq(scans.id, scanId));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown scanner error";

    await db
      .update(scans)
      .set({
        status: "failed",
        errorMessage: message,
        completedAt: new Date(),
      })
      .where(eq(scans.id, scanId));
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Return a single scan by id, or null if not found.
 */
export async function getScanById(id: string) {
  return db.query.scans.findFirst({
    where: eq(scans.id, id),
  });
}

/**
 * Return all scans ordered by startedAt desc.
 */
export async function getScans() {
  return db.query.scans.findMany({
    orderBy: desc(scans.startedAt),
  });
}
