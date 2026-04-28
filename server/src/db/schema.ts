import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const locationTypeEnum = pgEnum("location_type", [
  "remote",
  "hybrid",
  "onsite",
]);

export const experienceLevelEnum = pgEnum("experience_level", [
  "junior",
  "mid",
  "senior",
]);

export const jobTypeEnum = pgEnum("job_type", [
  "full-time",
  "contract",
  "freelance",
]);

export const sourceEnum = pgEnum("source", [
  "linkedin_jobs",
  "linkedin_posts",
]);

export const scanStatusEnum = pgEnum("scan_status", [
  "running",
  "completed",
  "failed",
]);

// ---------------------------------------------------------------------------
// Contact info JSONB shape
// ---------------------------------------------------------------------------

export interface ContactInfo {
  email?: string;
  recruiterName?: string;
  applyUrl?: string;
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 500 }).notNull(),
  company: varchar("company", { length: 300 }).notNull(),
  location: varchar("location", { length: 300 }),
  locationType: locationTypeEnum("location_type"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: varchar("salary_currency", { length: 3 }),
  experienceLevel: experienceLevelEnum("experience_level"),
  jobType: jobTypeEnum("job_type"),
  contactInfo: jsonb("contact_info").$type<ContactInfo>(),
  description: text("description").notNull(),
  summary: text("summary"),
  source: sourceEnum("source").notNull(),
  sourceUrl: varchar("source_url", { length: 2000 }).notNull(),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  scrapedAt: timestamp("scraped_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobTags = pgTable(
  "job_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    tagName: varchar("tag_name", { length: 100 }).notNull(),
  },
  (table) => ({
    uniqueJobTag: uniqueIndex("job_tags_job_id_tag_name_idx").on(
      table.jobId,
      table.tagName,
    ),
  }),
);

export const searchProfiles = pgTable("search_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  keywords: text("keywords").array().notNull(),
  filters: jsonb("filters").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  searchProfileId: uuid("search_profile_id")
    .notNull()
    .references(() => searchProfiles.id, { onDelete: "cascade" }),
  status: scanStatusEnum("status").notNull().default("running"),
  jobsFound: integer("jobs_found").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  errorMessage: text("error_message"),
});
