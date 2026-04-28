// ---------------------------------------------------------------------------
// Job persistence & query service
// ---------------------------------------------------------------------------

import { desc, eq } from "drizzle-orm";

import { db } from "../db/connection.js";
import { jobs, jobTags } from "../db/schema.js";
import type { ScannerJob } from "./scanner-client.js";

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * Persist an array of scanner jobs. Duplicates (by source_url) are skipped.
 * Returns the number of newly inserted jobs.
 */
export async function persistJobs(scannerJobs: ScannerJob[]): Promise<number> {
  let persisted = 0;

  for (const sj of scannerJobs) {
    // Dedup: skip if a job with the same sourceUrl already exists
    const existing = await db.query.jobs.findFirst({
      where: eq(jobs.sourceUrl, sj.source_url),
    });

    if (existing) continue;

    const [inserted] = await db
      .insert(jobs)
      .values({
        title: sj.title,
        company: sj.company,
        location: sj.location ?? null,
        locationType: sj.location_type ?? null,
        salaryMin: sj.salary_min ?? null,
        salaryMax: sj.salary_max ?? null,
        salaryCurrency: sj.salary_currency ?? null,
        experienceLevel: sj.experience_level ?? null,
        jobType: sj.job_type ?? null,
        contactInfo: sj.contact_info
          ? {
              email: sj.contact_info.email,
              recruiterName: sj.contact_info.recruiter_name,
              applyUrl: sj.contact_info.apply_url,
            }
          : null,
        description: sj.description,
        summary: sj.summary ?? null,
        source: sj.source,
        sourceUrl: sj.source_url,
        postedAt: sj.posted_at ? new Date(sj.posted_at) : null,
      })
      .returning({ id: jobs.id });

    // Insert associated tags
    if (inserted && sj.tags.length > 0) {
      await db.insert(jobTags).values(
        sj.tags.map((tagName) => ({
          jobId: inserted.id,
          tagName,
        })),
      );
    }

    persisted++;
  }

  return persisted;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Return all jobs ordered by createdAt desc, each with an array of tag names.
 */
export async function getAllJobs() {
  const allJobs = await db.query.jobs.findMany({
    orderBy: desc(jobs.createdAt),
  });

  const allTags = await db.query.jobTags.findMany();

  // Group tags by jobId for O(n) lookup
  const tagsByJobId = new Map<string, string[]>();
  for (const tag of allTags) {
    const existing = tagsByJobId.get(tag.jobId);
    if (existing) {
      existing.push(tag.tagName);
    } else {
      tagsByJobId.set(tag.jobId, [tag.tagName]);
    }
  }

  return allJobs.map((job) => ({
    ...job,
    tags: tagsByJobId.get(job.id) ?? [],
  }));
}

/**
 * Return a single job by id with its tag names, or null if not found.
 */
export async function getJobById(id: string) {
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, id),
  });

  if (!job) return null;

  const tags = await db.query.jobTags.findMany({
    where: eq(jobTags.jobId, id),
  });

  return {
    ...job,
    tags: tags.map((t) => t.tagName),
  };
}
