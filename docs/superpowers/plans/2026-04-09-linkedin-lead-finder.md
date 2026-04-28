# LinkedIn Lead Finder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user app that scans LinkedIn Jobs and Posts for software developer leads, extracts structured data via Ollama, and presents results in a filterable React dashboard.

**Architecture:** Monolith with three services — React+Vite SPA frontend, Fastify TypeScript API server, and Python FastAPI scraping/AI service. PostgreSQL for persistence. Node API orchestrates scans by calling the Python service, which handles LinkedIn data access and LLM extraction.

**Tech Stack:** React 18, Vite 5, TypeScript 5, Fastify 4, Drizzle ORM, PostgreSQL 16, Python 3.12, FastAPI, linkedin-api (unofficial), Ollama, Vitest, Pytest

---

## File Structure

```
cv/
├── client/                          # React + Vite frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts           # Typed API client (fetch wrapper)
│   │   ├── components/
│   │   │   ├── JobCard.tsx          # Expandable job card
│   │   │   ├── JobTable.tsx         # Job listing table
│   │   │   ├── FilterBar.tsx        # Tag/filter controls
│   │   │   ├── ScanButton.tsx       # Scan trigger + status indicator
│   │   │   ├── ProfileSelector.tsx  # Search profile dropdown
│   │   │   ├── ProfileForm.tsx      # Create/edit search profile
│   │   │   └── SettingsForm.tsx     # LinkedIn creds + Ollama config
│   │   ├── hooks/
│   │   │   ├── useJobs.ts           # Job fetching + filtering
│   │   │   ├── useScan.ts           # Scan trigger + polling
│   │   │   └── useProfiles.ts       # Search profile CRUD
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        # Main dashboard page
│   │   │   └── Settings.tsx         # Settings page
│   │   ├── types/
│   │   │   └── index.ts            # Shared frontend types
│   │   ├── App.tsx                  # Router + layout
│   │   └── main.tsx                 # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── server/                          # Fastify API
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts           # Drizzle schema definitions
│   │   │   ├── migrate.ts          # Migration runner
│   │   │   └── connection.ts       # Database connection pool
│   │   ├── routes/
│   │   │   ├── jobs.ts             # GET /api/jobs, GET /api/jobs/:id
│   │   │   ├── scans.ts            # POST /api/scans, GET /api/scans/:id
│   │   │   ├── profiles.ts         # CRUD /api/profiles
│   │   │   └── settings.ts         # GET/PUT /api/settings
│   │   ├── services/
│   │   │   ├── job-service.ts      # Job persistence + dedup logic
│   │   │   ├── scan-service.ts     # Scan orchestration
│   │   │   └── scanner-client.ts   # HTTP client to Python service
│   │   ├── types/
│   │   │   └── index.ts            # Shared server types
│   │   └── index.ts                # Fastify app bootstrap
│   ├── drizzle.config.ts           # Drizzle Kit config
│   ├── tsconfig.json
│   └── package.json
├── scanner/                         # Python FastAPI service
│   ├── app/
│   │   ├── main.py                 # FastAPI app + /scan endpoint
│   │   ├── models.py               # Pydantic models
│   │   ├── linkedin/
│   │   │   ├── __init__.py
│   │   │   ├── client.py           # Unified LinkedIn client
│   │   │   ├── jobs.py             # Job search scraping
│   │   │   └── posts.py            # Post feed scraping
│   │   └── extraction/
│   │       ├── __init__.py
│   │       ├── ollama.py           # Ollama HTTP client
│   │       └── extractor.py        # Extraction prompt + validation
│   ├── tests/
│   │   ├── test_models.py
│   │   ├── test_extractor.py
│   │   └── test_main.py
│   ├── requirements.txt
│   └── pyproject.toml
├── docker-compose.yml               # PostgreSQL
├── package.json                     # Root workspace scripts
└── .env.example                     # Environment template
```

---

## Task 1: Project Scaffolding + Docker + Database

**Files:**
- Create: `package.json`
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`
- Create: `server/src/db/connection.ts`
- Create: `server/src/db/schema.ts`
- Create: `server/src/db/migrate.ts`
- Create: `server/drizzle.config.ts`

- [ ] **Step 1: Create root package.json with workspace scripts**

```json
{
  "name": "linkedin-lead-finder",
  "private": true,
  "scripts": {
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "dev:scanner": "cd scanner && uvicorn app.main:app --reload --port 8001",
    "db:generate": "cd server && npx drizzle-kit generate",
    "db:migrate": "cd server && npx tsx src/db/migrate.ts",
    "db:studio": "cd server && npx drizzle-kit studio"
  }
}
```

- [ ] **Step 2: Create docker-compose.yml with PostgreSQL**

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: lead_finder
      POSTGRES_USER: lead_finder
      POSTGRES_PASSWORD: lead_finder_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- [ ] **Step 3: Create .env.example**

```env
DATABASE_URL=postgresql://lead_finder:lead_finder_dev@localhost:5432/lead_finder
SCANNER_URL=http://localhost:8001

LINKEDIN_EMAIL=
LINKEDIN_PASSWORD=

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
.env
*.pyc
__pycache__/
.venv/
*.egg-info/
.drizzle/
```

- [ ] **Step 5: Initialize server package with dependencies**

```json
{
  "name": "@lead-finder/server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "fastify": "^4.28.0",
    "@fastify/cors": "^9.0.1",
    "drizzle-orm": "^0.33.0",
    "postgres": "^3.4.4",
    "uuid": "^10.0.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/uuid": "^10.0.0",
    "drizzle-kit": "^0.24.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 6: Create server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 7: Create server/src/db/connection.ts**

```typescript
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
```

- [ ] **Step 8: Create server/src/db/schema.ts with all tables**

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

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
  contactInfo: jsonb("contact_info").$type<{
    email?: string;
    recruiterName?: string;
    applyUrl?: string;
  }>(),
  description: text("description").notNull(),
  summary: text("summary"),
  source: sourceEnum("source").notNull(),
  sourceUrl: varchar("source_url", { length: 2000 }).notNull(),
  postedAt: timestamp("posted_at"),
  scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
    uniqueJobTag: uniqueIndex("unique_job_tag").on(table.jobId, table.tagName),
  })
);

export const searchProfiles = pgTable("search_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  keywords: text("keywords").array().notNull(),
  filters: jsonb("filters").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  searchProfileId: uuid("search_profile_id")
    .notNull()
    .references(() => searchProfiles.id, { onDelete: "cascade" }),
  status: scanStatusEnum("status").notNull().default("running"),
  jobsFound: integer("jobs_found").notNull().default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
});
```

- [ ] **Step 9: Create server/drizzle.config.ts**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 10: Create server/src/db/migrate.ts**

```typescript
import "dotenv/config";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const migrationClient = postgres(connectionString, { max: 1 });
const db = drizzle(migrationClient);

async function main() {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");
  await migrationClient.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
```

- [ ] **Step 11: Create minimal server/src/index.ts**

```typescript
import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify({ logger: true });

await app.register(cors, { origin: "http://localhost:5173" });

app.get("/api/health", async () => ({ status: "ok" }));

const port = Number(process.env.PORT) || 3001;
await app.listen({ port, host: "0.0.0.0" });
console.log(`Server running on http://localhost:${port}`);
```

- [ ] **Step 12: Install dependencies, start Postgres, generate and run migrations**

Run:
```bash
cd server && npm install
cd .. && docker compose up -d
cp .env.example .env
cd server && npx drizzle-kit generate && npx tsx src/db/migrate.ts
```

- [ ] **Step 13: Verify server starts**

Run: `cd server && npx tsx src/index.ts`
Expected: Server running on http://localhost:3001, health check returns `{"status":"ok"}`

- [ ] **Step 14: Commit**

```bash
git add package.json docker-compose.yml .env.example .gitignore server/
git commit -m "feat: scaffold server with Fastify, Drizzle ORM, and PostgreSQL schema"
```

---

## Task 2: Server API Routes — Profiles + Scans + Jobs

**Files:**
- Create: `server/src/types/index.ts`
- Create: `server/src/routes/profiles.ts`
- Create: `server/src/routes/jobs.ts`
- Create: `server/src/routes/scans.ts`
- Create: `server/src/routes/settings.ts`
- Create: `server/src/services/job-service.ts`
- Create: `server/src/services/scan-service.ts`
- Create: `server/src/services/scanner-client.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create server/src/types/index.ts**

```typescript
export interface ContactInfo {
  email?: string;
  recruiterName?: string;
  applyUrl?: string;
}

export interface ExtractedJob {
  title: string;
  company: string;
  location?: string;
  locationType?: "remote" | "hybrid" | "onsite";
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  experienceLevel?: "junior" | "mid" | "senior";
  jobType?: "full-time" | "contract" | "freelance";
  contactInfo?: ContactInfo;
  description: string;
  summary?: string;
  source: "linkedin_jobs" | "linkedin_posts";
  sourceUrl: string;
  postedAt?: string;
  tags: string[];
}

export interface ScanRequest {
  searchProfileId: string;
}

export interface ScanResult {
  jobs: ExtractedJob[];
  error?: string;
}
```

- [ ] **Step 2: Create server/src/services/scanner-client.ts**

```typescript
const SCANNER_URL = process.env.SCANNER_URL || "http://localhost:8001";

export interface ScanParams {
  keywords: string[];
  filters?: Record<string, unknown>;
}

export interface ScannerJob {
  title: string;
  company: string;
  location?: string;
  location_type?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  experience_level?: string;
  job_type?: string;
  contact_info?: {
    email?: string;
    recruiter_name?: string;
    apply_url?: string;
  };
  description: string;
  summary?: string;
  source: string;
  source_url: string;
  posted_at?: string;
  tags: string[];
}

export interface ScannerResponse {
  jobs: ScannerJob[];
  error?: string;
}

export async function triggerScan(params: ScanParams): Promise<ScannerResponse> {
  const response = await fetch(`${SCANNER_URL}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Scanner returned ${response.status}: ${text}`);
  }

  return response.json() as Promise<ScannerResponse>;
}
```

- [ ] **Step 3: Create server/src/services/job-service.ts**

```typescript
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { jobs, jobTags } from "../db/schema.js";
import type { ScannerJob } from "./scanner-client.js";

export async function persistJobs(scannerJobs: ScannerJob[]): Promise<number> {
  let persisted = 0;

  for (const sj of scannerJobs) {
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
        locationType: sj.location_type as "remote" | "hybrid" | "onsite" | undefined ?? null,
        salaryMin: sj.salary_min ?? null,
        salaryMax: sj.salary_max ?? null,
        salaryCurrency: sj.salary_currency ?? null,
        experienceLevel: sj.experience_level as "junior" | "mid" | "senior" | undefined ?? null,
        jobType: sj.job_type as "full-time" | "contract" | "freelance" | undefined ?? null,
        contactInfo: sj.contact_info
          ? {
              email: sj.contact_info.email,
              recruiterName: sj.contact_info.recruiter_name,
              applyUrl: sj.contact_info.apply_url,
            }
          : null,
        description: sj.description,
        summary: sj.summary ?? null,
        source: sj.source as "linkedin_jobs" | "linkedin_posts",
        sourceUrl: sj.source_url,
        postedAt: sj.posted_at ? new Date(sj.posted_at) : null,
      })
      .returning();

    if (inserted && sj.tags.length > 0) {
      await db.insert(jobTags).values(
        sj.tags.map((tag) => ({
          jobId: inserted.id,
          tagName: tag.toLowerCase(),
        }))
      );
    }

    persisted++;
  }

  return persisted;
}

export async function getAllJobs() {
  const allJobs = await db.query.jobs.findMany({
    orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
  });

  const allTags = await db.select().from(jobTags);

  const tagsByJobId = new Map<string, string[]>();
  for (const tag of allTags) {
    const existing = tagsByJobId.get(tag.jobId) ?? [];
    existing.push(tag.tagName);
    tagsByJobId.set(tag.jobId, existing);
  }

  return allJobs.map((job) => ({
    ...job,
    tags: tagsByJobId.get(job.id) ?? [],
  }));
}

export async function getJobById(id: string) {
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, id),
  });

  if (!job) return null;

  const tags = await db.query.jobTags.findMany({
    where: eq(jobTags.jobId, id),
  });

  return { ...job, tags: tags.map((t) => t.tagName) };
}
```

- [ ] **Step 4: Create server/src/services/scan-service.ts**

```typescript
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { scans, searchProfiles } from "../db/schema.js";
import { triggerScan } from "./scanner-client.js";
import { persistJobs } from "./job-service.js";

export async function startScan(searchProfileId: string): Promise<string> {
  const profile = await db.query.searchProfiles.findFirst({
    where: eq(searchProfiles.id, searchProfileId),
  });

  if (!profile) {
    throw new Error(`Search profile ${searchProfileId} not found`);
  }

  const [scan] = await db
    .insert(scans)
    .values({ searchProfileId, status: "running" })
    .returning();

  // Run scan asynchronously — don't await
  runScan(scan.id, profile.keywords, profile.filters ?? undefined).catch(
    (err) => console.error(`Scan ${scan.id} failed:`, err)
  );

  return scan.id;
}

async function runScan(
  scanId: string,
  keywords: string[],
  filters?: Record<string, unknown>
) {
  try {
    const result = await triggerScan({ keywords, filters: filters ?? {} });

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

    const jobCount = await persistJobs(result.jobs);

    await db
      .update(scans)
      .set({
        status: "completed",
        jobsFound: jobCount,
        completedAt: new Date(),
      })
      .where(eq(scans.id, scanId));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
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

export async function getScanById(id: string) {
  return db.query.scans.findFirst({ where: eq(scans.id, id) });
}

export async function getScans() {
  return db.query.scans.findMany({
    orderBy: (scans, { desc }) => [desc(scans.startedAt)],
  });
}
```

- [ ] **Step 5: Create server/src/routes/profiles.ts**

```typescript
import { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { searchProfiles } from "../db/schema.js";

export async function profileRoutes(app: FastifyInstance) {
  app.get("/api/profiles", async () => {
    return db.query.searchProfiles.findMany({
      orderBy: (p, { desc }) => [desc(p.createdAt)],
    });
  });

  app.post<{
    Body: { name: string; keywords: string[]; filters?: Record<string, unknown> };
  }>("/api/profiles", async (request, reply) => {
    const { name, keywords, filters } = request.body;
    const [profile] = await db
      .insert(searchProfiles)
      .values({ name, keywords, filters: filters ?? null })
      .returning();
    reply.status(201);
    return profile;
  });

  app.put<{
    Params: { id: string };
    Body: { name: string; keywords: string[]; filters?: Record<string, unknown> };
  }>("/api/profiles/:id", async (request, reply) => {
    const { id } = request.params;
    const { name, keywords, filters } = request.body;
    const [updated] = await db
      .update(searchProfiles)
      .set({ name, keywords, filters: filters ?? null, updatedAt: new Date() })
      .where(eq(searchProfiles.id, id))
      .returning();
    if (!updated) {
      reply.status(404);
      return { error: "Profile not found" };
    }
    return updated;
  });

  app.delete<{ Params: { id: string } }>(
    "/api/profiles/:id",
    async (request, reply) => {
      const { id } = request.params;
      const [deleted] = await db
        .delete(searchProfiles)
        .where(eq(searchProfiles.id, id))
        .returning();
      if (!deleted) {
        reply.status(404);
        return { error: "Profile not found" };
      }
      return { success: true };
    }
  );
}
```

- [ ] **Step 6: Create server/src/routes/scans.ts**

```typescript
import { FastifyInstance } from "fastify";
import { startScan, getScanById, getScans } from "../services/scan-service.js";

export async function scanRoutes(app: FastifyInstance) {
  app.post<{ Body: { searchProfileId: string } }>(
    "/api/scans",
    async (request, reply) => {
      const { searchProfileId } = request.body;
      const scanId = await startScan(searchProfileId);
      reply.status(202);
      return { scanId };
    }
  );

  app.get<{ Params: { id: string } }>(
    "/api/scans/:id",
    async (request, reply) => {
      const scan = await getScanById(request.params.id);
      if (!scan) {
        reply.status(404);
        return { error: "Scan not found" };
      }
      return scan;
    }
  );

  app.get("/api/scans", async () => {
    return getScans();
  });
}
```

- [ ] **Step 7: Create server/src/routes/jobs.ts**

```typescript
import { FastifyInstance } from "fastify";
import { getAllJobs, getJobById } from "../services/job-service.js";

export async function jobRoutes(app: FastifyInstance) {
  app.get("/api/jobs", async () => {
    return getAllJobs();
  });

  app.get<{ Params: { id: string } }>(
    "/api/jobs/:id",
    async (request, reply) => {
      const job = await getJobById(request.params.id);
      if (!job) {
        reply.status(404);
        return { error: "Job not found" };
      }
      return job;
    }
  );
}
```

- [ ] **Step 8: Create server/src/routes/settings.ts**

```typescript
import { FastifyInstance } from "fastify";

// Settings are read from environment variables (single-user, no DB persistence needed)
export async function settingsRoutes(app: FastifyInstance) {
  app.get("/api/settings", async () => {
    return {
      linkedinEmail: process.env.LINKEDIN_EMAIL ?? "",
      linkedinConfigured: Boolean(process.env.LINKEDIN_EMAIL && process.env.LINKEDIN_PASSWORD),
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
      ollamaModel: process.env.OLLAMA_MODEL ?? "llama3.1",
    };
  });
}
```

- [ ] **Step 9: Update server/src/index.ts to register all routes**

```typescript
import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { profileRoutes } from "./routes/profiles.js";
import { scanRoutes } from "./routes/scans.js";
import { jobRoutes } from "./routes/jobs.js";
import { settingsRoutes } from "./routes/settings.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: "http://localhost:5173" });

app.get("/api/health", async () => ({ status: "ok" }));

await app.register(profileRoutes);
await app.register(scanRoutes);
await app.register(jobRoutes);
await app.register(settingsRoutes);

const port = Number(process.env.PORT) || 3001;
await app.listen({ port, host: "0.0.0.0" });
console.log(`Server running on http://localhost:${port}`);
```

- [ ] **Step 10: Verify server compiles and starts**

Run: `cd server && npx tsx src/index.ts`
Expected: Server running, all routes registered.

- [ ] **Step 11: Commit**

```bash
git add server/
git commit -m "feat: add API routes for profiles, scans, jobs, and settings"
```

---

## Task 3: Python Scanner Service — LinkedIn Scraping + AI Extraction

**Files:**
- Create: `scanner/pyproject.toml`
- Create: `scanner/requirements.txt`
- Create: `scanner/app/__init__.py`
- Create: `scanner/app/main.py`
- Create: `scanner/app/models.py`
- Create: `scanner/app/linkedin/__init__.py`
- Create: `scanner/app/linkedin/client.py`
- Create: `scanner/app/linkedin/jobs.py`
- Create: `scanner/app/linkedin/posts.py`
- Create: `scanner/app/extraction/__init__.py`
- Create: `scanner/app/extraction/ollama.py`
- Create: `scanner/app/extraction/extractor.py`
- Create: `scanner/tests/__init__.py`
- Create: `scanner/tests/test_models.py`
- Create: `scanner/tests/test_extractor.py`
- Create: `scanner/tests/test_main.py`

- [ ] **Step 1: Create scanner/pyproject.toml**

```toml
[project]
name = "linkedin-lead-scanner"
version = "0.1.0"
requires-python = ">=3.12"

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 2: Create scanner/requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.31.0
linkedin-api==2.2.0
httpx==0.27.0
pydantic==2.9.0
```

- [ ] **Step 3: Create scanner/app/models.py**

```python
from pydantic import BaseModel


class ContactInfo(BaseModel):
    email: str | None = None
    recruiter_name: str | None = None
    apply_url: str | None = None


class ExtractedJob(BaseModel):
    title: str
    company: str
    location: str | None = None
    location_type: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str | None = None
    experience_level: str | None = None
    job_type: str | None = None
    contact_info: ContactInfo | None = None
    description: str
    summary: str | None = None
    source: str
    source_url: str
    posted_at: str | None = None
    tags: list[str] = []


class ScanRequest(BaseModel):
    keywords: list[str]
    filters: dict | None = None


class ScanResponse(BaseModel):
    jobs: list[ExtractedJob]
    error: str | None = None
```

- [ ] **Step 4: Create scanner/app/linkedin/client.py**

```python
import os
import logging
from linkedin_api import Linkedin

logger = logging.getLogger(__name__)

_client: Linkedin | None = None


def get_linkedin_client() -> Linkedin:
    global _client
    if _client is not None:
        return _client

    email = os.environ.get("LINKEDIN_EMAIL")
    password = os.environ.get("LINKEDIN_PASSWORD")

    if not email or not password:
        raise ValueError(
            "LINKEDIN_EMAIL and LINKEDIN_PASSWORD environment variables are required"
        )

    logger.info("Authenticating with LinkedIn as %s", email)
    _client = Linkedin(email, password)
    return _client
```

- [ ] **Step 5: Create scanner/app/linkedin/jobs.py**

```python
import logging
from linkedin_api import Linkedin

logger = logging.getLogger(__name__)


def search_jobs(client: Linkedin, keywords: list[str], limit: int = 25) -> list[dict]:
    """Search LinkedIn Jobs and return raw job data."""
    query = " ".join(keywords)
    logger.info("Searching LinkedIn Jobs for: %s (limit=%d)", query, limit)

    try:
        results = client.search_jobs(
            keywords=query,
            limit=limit,
        )
    except Exception as e:
        logger.error("LinkedIn job search failed: %s", e)
        return []

    jobs = []
    for result in results:
        job_id = result.get("dashEntityUrn", "").split(":")[-1]
        if not job_id:
            continue

        try:
            detail = client.get_job(job_id)
        except Exception as e:
            logger.warning("Failed to fetch job %s: %s", job_id, e)
            continue

        description_raw = detail.get("description", {})
        description = description_raw.get("text", "") if isinstance(description_raw, dict) else str(description_raw)

        company_info = detail.get("companyDetails", {})
        company_name = (
            company_info.get("com.linkedin.voyager.deco.jobs.web.shared.model.JobPostingCompany", {})
            .get("companyResolutionResult", {})
            .get("name", "Unknown")
        )

        jobs.append({
            "job_id": job_id,
            "title": detail.get("title", "Untitled"),
            "company": company_name,
            "description": description,
            "location": detail.get("formattedLocation", ""),
            "listed_at": detail.get("listedAt"),
            "url": f"https://www.linkedin.com/jobs/view/{job_id}/",
        })

    logger.info("Found %d jobs from LinkedIn Jobs", len(jobs))
    return jobs
```

- [ ] **Step 6: Create scanner/app/linkedin/posts.py**

```python
import logging
from linkedin_api import Linkedin

logger = logging.getLogger(__name__)


def search_posts(client: Linkedin, keywords: list[str], limit: int = 25) -> list[dict]:
    """Search LinkedIn Posts for job-related content."""
    query = " ".join(keywords) + " hiring"
    logger.info("Searching LinkedIn Posts for: %s (limit=%d)", query, limit)

    try:
        results = client.search(
            {"keywords": query, "type": "content"},
            limit=limit,
        )
    except Exception as e:
        logger.error("LinkedIn post search failed: %s", e)
        return []

    posts = []
    for result in results:
        entity_urn = result.get("entityUrn", "")
        activity_id = entity_urn.split(":")[-1] if entity_urn else ""

        text_data = result.get("summary", {})
        text = text_data.get("text", "") if isinstance(text_data, dict) else str(text_data)

        if not text or len(text) < 50:
            continue

        actor = result.get("title", {})
        author = actor.get("text", "Unknown") if isinstance(actor, dict) else str(actor)

        posts.append({
            "post_id": activity_id,
            "author": author,
            "text": text,
            "url": f"https://www.linkedin.com/feed/update/urn:li:activity:{activity_id}/",
        })

    logger.info("Found %d relevant posts from LinkedIn", len(posts))
    return posts
```

- [ ] **Step 7: Create scanner/app/extraction/ollama.py**

```python
import os
import logging
import httpx

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1")


async def generate(prompt: str) -> str:
    """Send a prompt to Ollama and return the response text."""
    url = f"{OLLAMA_BASE_URL}/api/generate"
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
        except httpx.HTTPError as e:
            logger.error("Ollama request failed: %s", e)
            return ""
        except Exception as e:
            logger.error("Unexpected error calling Ollama: %s", e)
            return ""
```

- [ ] **Step 8: Create scanner/app/extraction/extractor.py**

```python
import json
import logging
from ..models import ExtractedJob, ContactInfo
from .ollama import generate

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """You are a job listing data extractor. Given a job description, extract structured data as JSON.

Return ONLY valid JSON with these fields:
{{
  "salary_min": <integer or null>,
  "salary_max": <integer or null>,
  "salary_currency": "<3-letter code or null>",
  "required_skills": ["skill1", "skill2"],
  "experience_level": "<junior|mid|senior or null>",
  "job_type": "<full-time|contract|freelance or null>",
  "contact_info": {{"email": "<or null>", "recruiter_name": "<or null>", "apply_url": "<or null>"}},
  "location": "<city/region or null>",
  "location_type": "<remote|hybrid|onsite or null>",
  "summary": "<2-3 sentence summary>"
}}

Job description:
{description}
"""


async def extract_job_data(
    raw_job: dict,
    source: str,
) -> ExtractedJob:
    """Extract structured data from a raw job/post using Ollama."""
    description = raw_job.get("description", "") or raw_job.get("text", "")
    title = raw_job.get("title", "") or "Untitled"
    company = raw_job.get("company", "") or raw_job.get("author", "Unknown")
    url = raw_job.get("url", "")
    location = raw_job.get("location", "")
    posted_at = raw_job.get("listed_at")

    prompt = EXTRACTION_PROMPT.format(description=description[:4000])
    response_text = await generate(prompt)

    extracted = _parse_extraction(response_text)

    return ExtractedJob(
        title=title,
        company=company,
        location=extracted.get("location") or location or None,
        location_type=extracted.get("location_type"),
        salary_min=extracted.get("salary_min"),
        salary_max=extracted.get("salary_max"),
        salary_currency=extracted.get("salary_currency"),
        experience_level=extracted.get("experience_level"),
        job_type=extracted.get("job_type"),
        contact_info=ContactInfo(**extracted["contact_info"]) if extracted.get("contact_info") else None,
        description=description,
        summary=extracted.get("summary"),
        source=source,
        source_url=url,
        posted_at=str(posted_at) if posted_at else None,
        tags=extracted.get("required_skills", []),
    )


def _parse_extraction(text: str) -> dict:
    """Parse JSON from Ollama response, tolerating minor issues."""
    if not text.strip():
        return {}

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object in the response
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass

    logger.warning("Failed to parse Ollama extraction response")
    return {}
```

- [ ] **Step 9: Create scanner/app/main.py**

```python
import asyncio
import logging
from fastapi import FastAPI, HTTPException
from .models import ScanRequest, ScanResponse, ExtractedJob
from .linkedin.client import get_linkedin_client
from .linkedin.jobs import search_jobs
from .linkedin.posts import search_posts
from .extraction.extractor import extract_job_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LinkedIn Lead Scanner")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/scan", response_model=ScanResponse)
async def scan(request: ScanRequest):
    try:
        client = get_linkedin_client()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    all_raw_jobs: list[tuple[dict, str]] = []

    raw_jobs = search_jobs(client, request.keywords)
    for job in raw_jobs:
        all_raw_jobs.append((job, "linkedin_jobs"))

    raw_posts = search_posts(client, request.keywords)
    for post in raw_posts:
        all_raw_jobs.append((post, "linkedin_posts"))

    if not all_raw_jobs:
        return ScanResponse(jobs=[], error=None)

    extracted: list[ExtractedJob] = []
    for raw, source in all_raw_jobs:
        try:
            job = await extract_job_data(raw, source)
            extracted.append(job)
        except Exception as e:
            logger.error("Extraction failed for %s: %s", raw.get("url", "unknown"), e)
            continue

    logger.info("Scan complete: %d jobs extracted from %d raw results", len(extracted), len(all_raw_jobs))
    return ScanResponse(jobs=extracted)
```

- [ ] **Step 10: Create scanner/app/linkedin/__init__.py and scanner/app/extraction/__init__.py and scanner/tests/__init__.py**

All three files should be empty `__init__.py` files.

- [ ] **Step 11: Create scanner/tests/test_models.py**

```python
from app.models import ExtractedJob, ContactInfo, ScanRequest, ScanResponse


def test_extracted_job_minimal():
    job = ExtractedJob(
        title="Software Engineer",
        company="Acme Corp",
        description="Build stuff",
        source="linkedin_jobs",
        source_url="https://linkedin.com/jobs/view/123",
    )
    assert job.title == "Software Engineer"
    assert job.tags == []
    assert job.salary_min is None


def test_extracted_job_full():
    job = ExtractedJob(
        title="Senior React Dev",
        company="Tech Co",
        location="Remote",
        location_type="remote",
        salary_min=120000,
        salary_max=180000,
        salary_currency="USD",
        experience_level="senior",
        job_type="full-time",
        contact_info=ContactInfo(email="hr@tech.co", recruiter_name="Jane"),
        description="Full description here",
        summary="Senior React position at Tech Co",
        source="linkedin_jobs",
        source_url="https://linkedin.com/jobs/view/456",
        posted_at="2026-04-01",
        tags=["react", "typescript", "node"],
    )
    assert job.salary_min == 120000
    assert len(job.tags) == 3
    assert job.contact_info.email == "hr@tech.co"


def test_scan_request():
    req = ScanRequest(keywords=["react", "remote", "senior"])
    assert len(req.keywords) == 3


def test_scan_response():
    resp = ScanResponse(jobs=[], error=None)
    assert resp.jobs == []
```

- [ ] **Step 12: Create scanner/tests/test_extractor.py**

```python
from app.extraction.extractor import _parse_extraction


def test_parse_valid_json():
    raw = '{"salary_min": 100000, "required_skills": ["Python", "React"]}'
    result = _parse_extraction(raw)
    assert result["salary_min"] == 100000
    assert "Python" in result["required_skills"]


def test_parse_json_with_surrounding_text():
    raw = 'Here is the data: {"salary_min": 80000, "summary": "A great job"} end'
    result = _parse_extraction(raw)
    assert result["salary_min"] == 80000


def test_parse_empty_string():
    result = _parse_extraction("")
    assert result == {}


def test_parse_invalid_json():
    result = _parse_extraction("this is not json at all")
    assert result == {}
```

- [ ] **Step 13: Create scanner/tests/test_main.py**

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 14: Install Python dependencies and run tests**

Run:
```bash
cd scanner && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && pip install pytest
pytest tests/ -v
```

Expected: All tests pass.

- [ ] **Step 15: Commit**

```bash
git add scanner/
git commit -m "feat: add Python scanner service with LinkedIn scraping and Ollama extraction"
```

---

## Task 4: React Frontend — Project Setup + API Client

**Files:**
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/vite.config.ts`
- Create: `client/index.html`
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/src/types/index.ts`
- Create: `client/src/api/client.ts`

- [ ] **Step 1: Create client/package.json**

```json
{
  "name": "@lead-finder/client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create client/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create client/vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 4: Create client/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LinkedIn Lead Finder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create client/src/types/index.ts**

```typescript
export interface ContactInfo {
  email?: string;
  recruiterName?: string;
  applyUrl?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  locationType: "remote" | "hybrid" | "onsite" | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  experienceLevel: "junior" | "mid" | "senior" | null;
  jobType: "full-time" | "contract" | "freelance" | null;
  contactInfo: ContactInfo | null;
  description: string;
  summary: string | null;
  source: "linkedin_jobs" | "linkedin_posts";
  sourceUrl: string;
  postedAt: string | null;
  scrapedAt: string;
  createdAt: string;
  tags: string[];
}

export interface SearchProfile {
  id: string;
  name: string;
  keywords: string[];
  filters: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Scan {
  id: string;
  searchProfileId: string;
  status: "running" | "completed" | "failed";
  jobsFound: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface Settings {
  linkedinEmail: string;
  linkedinConfigured: boolean;
  ollamaBaseUrl: string;
  ollamaModel: string;
}
```

- [ ] **Step 6: Create client/src/api/client.ts**

```typescript
import type { Job, SearchProfile, Scan, Settings } from "../types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }

  return response.json();
}

// Jobs
export const getJobs = () => request<Job[]>("/jobs");
export const getJob = (id: string) => request<Job>(`/jobs/${id}`);

// Profiles
export const getProfiles = () => request<SearchProfile[]>("/profiles");
export const createProfile = (data: {
  name: string;
  keywords: string[];
}) => request<SearchProfile>("/profiles", {
  method: "POST",
  body: JSON.stringify(data),
});
export const updateProfile = (id: string, data: {
  name: string;
  keywords: string[];
}) => request<SearchProfile>(`/profiles/${id}`, {
  method: "PUT",
  body: JSON.stringify(data),
});
export const deleteProfile = (id: string) =>
  request<{ success: boolean }>(`/profiles/${id}`, { method: "DELETE" });

// Scans
export const startScan = (searchProfileId: string) =>
  request<{ scanId: string }>("/scans", {
    method: "POST",
    body: JSON.stringify({ searchProfileId }),
  });
export const getScan = (id: string) => request<Scan>(`/scans/${id}`);
export const getScans = () => request<Scan[]>("/scans");

// Settings
export const getSettings = () => request<Settings>("/settings");
```

- [ ] **Step 7: Create client/src/main.tsx**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

- [ ] **Step 8: Create client/src/App.tsx (minimal shell)**

```tsx
import { Routes, Route, Link } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";

export function App() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 1200, margin: "0 auto", padding: "1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", borderBottom: "1px solid #e5e7eb", paddingBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>LinkedIn Lead Finder</h1>
        <nav style={{ display: "flex", gap: "1rem" }}>
          <Link to="/">Dashboard</Link>
          <Link to="/settings">Settings</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}
```

- [ ] **Step 9: Create placeholder pages**

Create `client/src/pages/Dashboard.tsx`:
```tsx
export function Dashboard() {
  return <div>Dashboard — coming next task</div>;
}
```

Create `client/src/pages/Settings.tsx`:
```tsx
export function Settings() {
  return <div>Settings — coming next task</div>;
}
```

- [ ] **Step 10: Install dependencies and verify dev server starts**

Run:
```bash
cd client && npm install && npm run dev
```
Expected: Vite dev server at http://localhost:5173, app shell renders with nav links.

- [ ] **Step 11: Commit**

```bash
git add client/
git commit -m "feat: scaffold React frontend with Vite, types, and API client"
```

---

## Task 5: Frontend — Hooks (useProfiles, useScan, useJobs)

**Files:**
- Create: `client/src/hooks/useProfiles.ts`
- Create: `client/src/hooks/useScan.ts`
- Create: `client/src/hooks/useJobs.ts`

- [ ] **Step 1: Create client/src/hooks/useProfiles.ts**

```typescript
import { useState, useEffect, useCallback } from "react";
import type { SearchProfile } from "../types";
import * as api from "../api/client";

export function useProfiles() {
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getProfiles();
      setProfiles(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profiles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const create = useCallback(
    async (name: string, keywords: string[]) => {
      const profile = await api.createProfile({ name, keywords });
      setProfiles((prev) => [profile, ...prev]);
      return profile;
    },
    []
  );

  const update = useCallback(
    async (id: string, name: string, keywords: string[]) => {
      const profile = await api.updateProfile(id, { name, keywords });
      setProfiles((prev) => prev.map((p) => (p.id === id ? profile : p)));
      return profile;
    },
    []
  );

  const remove = useCallback(async (id: string) => {
    await api.deleteProfile(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { profiles, loading, error, create, update, remove, refetch: fetchProfiles };
}
```

- [ ] **Step 2: Create client/src/hooks/useScan.ts**

```typescript
import { useState, useRef, useCallback } from "react";
import type { Scan } from "../types";
import * as api from "../api/client";

export function useScan() {
  const [scan, setScan] = useState<Scan | null>(null);
  const [scanning, setScanning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startScan = useCallback(
    async (searchProfileId: string, onComplete?: () => void) => {
      stopPolling();
      setScanning(true);

      const { scanId } = await api.startScan(searchProfileId);

      intervalRef.current = setInterval(async () => {
        try {
          const updated = await api.getScan(scanId);
          setScan(updated);

          if (updated.status === "completed" || updated.status === "failed") {
            stopPolling();
            setScanning(false);
            onComplete?.();
          }
        } catch {
          stopPolling();
          setScanning(false);
        }
      }, 2000);
    },
    [stopPolling]
  );

  return { scan, scanning, startScan, stopPolling };
}
```

- [ ] **Step 3: Create client/src/hooks/useJobs.ts**

```typescript
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Job } from "../types";
import * as api from "../api/client";

export interface JobFilters {
  search: string;
  tags: string[];
  experienceLevel: string | null;
  jobType: string | null;
  locationType: string | null;
}

const DEFAULT_FILTERS: JobFilters = {
  search: "",
  tags: [],
  experienceLevel: null,
  jobType: null,
  locationType: null,
};

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getJobs();
      setJobs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesSearch =
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          (job.description?.toLowerCase().includes(q) ?? false);
        if (!matchesSearch) return false;
      }

      if (filters.tags.length > 0) {
        const hasTag = filters.tags.some((tag) =>
          job.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
        );
        if (!hasTag) return false;
      }

      if (filters.experienceLevel && job.experienceLevel !== filters.experienceLevel) {
        return false;
      }

      if (filters.jobType && job.jobType !== filters.jobType) {
        return false;
      }

      if (filters.locationType && job.locationType !== filters.locationType) {
        return false;
      }

      return true;
    });
  }, [jobs, filters]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    jobs.forEach((job) => job.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [jobs]);

  return {
    jobs: filteredJobs,
    allJobs: jobs,
    allTags,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchJobs,
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/hooks/
git commit -m "feat: add React hooks for profiles, scans, and job filtering"
```

---

## Task 6: Frontend — Components (JobCard, JobTable, FilterBar, ScanButton, ProfileSelector, ProfileForm)

**Files:**
- Create: `client/src/components/JobCard.tsx`
- Create: `client/src/components/JobTable.tsx`
- Create: `client/src/components/FilterBar.tsx`
- Create: `client/src/components/ScanButton.tsx`
- Create: `client/src/components/ProfileSelector.tsx`
- Create: `client/src/components/ProfileForm.tsx`

- [ ] **Step 1: Create client/src/components/JobCard.tsx**

```tsx
import { useState } from "react";
import type { Job } from "../types";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  const salary =
    job.salaryMin || job.salaryMax
      ? `${job.salaryCurrency ?? "$"}${job.salaryMin?.toLocaleString() ?? "?"} - ${job.salaryMax?.toLocaleString() ?? "?"}`
      : null;

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "1rem",
        marginBottom: "0.75rem",
        cursor: "pointer",
        background: expanded ? "#f9fafb" : "#fff",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{job.title}</h3>
          <p style={{ margin: "0.25rem 0", color: "#6b7280" }}>
            {job.company} {job.location ? `\u2022 ${job.location}` : ""}
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {salary && <div style={{ fontWeight: 600, color: "#059669" }}>{salary}</div>}
          {job.locationType && (
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: "0.75rem",
                background: job.locationType === "remote" ? "#d1fae5" : "#e0e7ff",
                color: job.locationType === "remote" ? "#065f46" : "#3730a3",
              }}
            >
              {job.locationType}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        {job.tags.map((tag) => (
          <span
            key={tag}
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: "0.75rem",
              background: "#f3f4f6",
              color: "#374151",
            }}
          >
            {tag}
          </span>
        ))}
        {job.experienceLevel && (
          <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", background: "#fef3c7", color: "#92400e" }}>
            {job.experienceLevel}
          </span>
        )}
        {job.jobType && (
          <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", background: "#ede9fe", color: "#5b21b6" }}>
            {job.jobType}
          </span>
        )}
      </div>

      {expanded && (
        <div style={{ marginTop: "1rem", borderTop: "1px solid #e5e7eb", paddingTop: "1rem" }}>
          {job.summary && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>Summary:</strong>
              <p style={{ margin: "0.25rem 0", color: "#374151" }}>{job.summary}</p>
            </div>
          )}

          {job.contactInfo && (
            <div style={{ marginBottom: "1rem" }}>
              <strong>Contact:</strong>
              <ul style={{ margin: "0.25rem 0", paddingLeft: "1.25rem" }}>
                {job.contactInfo.recruiterName && <li>Recruiter: {job.contactInfo.recruiterName}</li>}
                {job.contactInfo.email && <li>Email: {job.contactInfo.email}</li>}
                {job.contactInfo.applyUrl && (
                  <li>
                    <a href={job.contactInfo.applyUrl} target="_blank" rel="noopener noreferrer">
                      Apply Link
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <strong>Full Description:</strong>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.875rem", color: "#4b5563", marginTop: "0.25rem" }}>
              {job.description}
            </pre>
          </div>

          <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "#9ca3af" }}>
            <span>Source: {job.source}</span>
            <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">View on LinkedIn</a>
            {job.postedAt && <span>Posted: {new Date(job.postedAt).toLocaleDateString()}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create client/src/components/JobTable.tsx**

```tsx
import type { Job } from "../types";
import { JobCard } from "./JobCard";

interface JobTableProps {
  jobs: Job[];
  loading: boolean;
}

export function JobTable({ jobs, loading }: JobTableProps) {
  if (loading) {
    return <p style={{ color: "#6b7280" }}>Loading jobs...</p>;
  }

  if (jobs.length === 0) {
    return (
      <p style={{ color: "#6b7280", textAlign: "center", padding: "3rem 0" }}>
        No jobs found. Create a search profile and run a scan.
      </p>
    );
  }

  return (
    <div>
      <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
        {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
      </p>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create client/src/components/FilterBar.tsx**

```tsx
import type { JobFilters } from "../hooks/useJobs";

interface FilterBarProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  allTags: string[];
}

export function FilterBar({ filters, onFiltersChange, allTags }: FilterBarProps) {
  const inputStyle = {
    padding: "0.5rem",
    borderRadius: 4,
    border: "1px solid #d1d5db",
    fontSize: "0.875rem",
  };

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
      <input
        type="text"
        placeholder="Search jobs..."
        value={filters.search}
        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        style={{ ...inputStyle, minWidth: 200, flex: 1 }}
      />

      <select
        value={filters.experienceLevel ?? ""}
        onChange={(e) =>
          onFiltersChange({ ...filters, experienceLevel: e.target.value || null })
        }
        style={inputStyle}
      >
        <option value="">All Levels</option>
        <option value="junior">Junior</option>
        <option value="mid">Mid</option>
        <option value="senior">Senior</option>
      </select>

      <select
        value={filters.jobType ?? ""}
        onChange={(e) =>
          onFiltersChange({ ...filters, jobType: e.target.value || null })
        }
        style={inputStyle}
      >
        <option value="">All Types</option>
        <option value="full-time">Full-time</option>
        <option value="contract">Contract</option>
        <option value="freelance">Freelance</option>
      </select>

      <select
        value={filters.locationType ?? ""}
        onChange={(e) =>
          onFiltersChange({ ...filters, locationType: e.target.value || null })
        }
        style={inputStyle}
      >
        <option value="">All Locations</option>
        <option value="remote">Remote</option>
        <option value="hybrid">Hybrid</option>
        <option value="onsite">Onsite</option>
      </select>

      {allTags.length > 0 && (
        <select
          value=""
          onChange={(e) => {
            const tag = e.target.value;
            if (tag && !filters.tags.includes(tag)) {
              onFiltersChange({ ...filters, tags: [...filters.tags, tag] });
            }
          }}
          style={inputStyle}
        >
          <option value="">+ Add tag filter</option>
          {allTags
            .filter((t) => !filters.tags.includes(t))
            .map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
        </select>
      )}

      {filters.tags.length > 0 && (
        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", alignItems: "center" }}>
          {filters.tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "4px 8px",
                borderRadius: 4,
                background: "#dbeafe",
                color: "#1e40af",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
              onClick={() =>
                onFiltersChange({ ...filters, tags: filters.tags.filter((t) => t !== tag) })
              }
            >
              {tag} &times;
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create client/src/components/ScanButton.tsx**

```tsx
import type { Scan } from "../types";

interface ScanButtonProps {
  scanning: boolean;
  scan: Scan | null;
  disabled: boolean;
  onScan: () => void;
}

export function ScanButton({ scanning, scan, disabled, onScan }: ScanButtonProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <button
        onClick={onScan}
        disabled={disabled || scanning}
        style={{
          padding: "0.5rem 1.5rem",
          borderRadius: 6,
          border: "none",
          background: scanning ? "#9ca3af" : "#2563eb",
          color: "#fff",
          fontWeight: 600,
          cursor: disabled || scanning ? "not-allowed" : "pointer",
          fontSize: "0.875rem",
        }}
      >
        {scanning ? "Scanning..." : "Scan Now"}
      </button>

      {scan && (
        <span
          style={{
            fontSize: "0.8rem",
            color:
              scan.status === "completed"
                ? "#059669"
                : scan.status === "failed"
                  ? "#dc2626"
                  : "#d97706",
          }}
        >
          {scan.status === "running" && "Scanning LinkedIn..."}
          {scan.status === "completed" && `Found ${scan.jobsFound} jobs`}
          {scan.status === "failed" && `Error: ${scan.errorMessage}`}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create client/src/components/ProfileSelector.tsx**

```tsx
import type { SearchProfile } from "../types";

interface ProfileSelectorProps {
  profiles: SearchProfile[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function ProfileSelector({ profiles, selectedId, onSelect }: ProfileSelectorProps) {
  return (
    <select
      value={selectedId ?? ""}
      onChange={(e) => onSelect(e.target.value || null)}
      style={{
        padding: "0.5rem",
        borderRadius: 4,
        border: "1px solid #d1d5db",
        fontSize: "0.875rem",
        minWidth: 180,
      }}
    >
      <option value="">Select profile...</option>
      {profiles.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} ({p.keywords.join(", ")})
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 6: Create client/src/components/ProfileForm.tsx**

```tsx
import { useState } from "react";

interface ProfileFormProps {
  onSubmit: (name: string, keywords: string[]) => Promise<void>;
}

export function ProfileForm({ onSubmit }: ProfileFormProps) {
  const [name, setName] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !keywordsText.trim()) return;

    setSubmitting(true);
    try {
      const keywords = keywordsText
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      await onSubmit(name.trim(), keywords);
      setName("");
      setKeywordsText("");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    padding: "0.5rem",
    borderRadius: 4,
    border: "1px solid #d1d5db",
    fontSize: "0.875rem",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <input
        type="text"
        placeholder="Profile name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />
      <input
        type="text"
        placeholder="Keywords (comma-separated)"
        value={keywordsText}
        onChange={(e) => setKeywordsText(e.target.value)}
        style={{ ...inputStyle, minWidth: 250, flex: 1 }}
      />
      <button
        type="submit"
        disabled={submitting || !name.trim() || !keywordsText.trim()}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: 4,
          border: "none",
          background: "#2563eb",
          color: "#fff",
          cursor: "pointer",
          fontSize: "0.875rem",
        }}
      >
        {submitting ? "Adding..." : "Add Profile"}
      </button>
    </form>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add client/src/components/
git commit -m "feat: add job card, table, filter bar, scan, and profile components"
```

---

## Task 7: Frontend — Dashboard + Settings Pages

**Files:**
- Modify: `client/src/pages/Dashboard.tsx`
- Modify: `client/src/pages/Settings.tsx`
- Create: `client/src/components/SettingsForm.tsx`

- [ ] **Step 1: Implement client/src/pages/Dashboard.tsx**

Replace the placeholder with:

```tsx
import { useState } from "react";
import { useJobs } from "../hooks/useJobs";
import { useProfiles } from "../hooks/useProfiles";
import { useScan } from "../hooks/useScan";
import { JobTable } from "../components/JobTable";
import { FilterBar } from "../components/FilterBar";
import { ScanButton } from "../components/ScanButton";
import { ProfileSelector } from "../components/ProfileSelector";
import { ProfileForm } from "../components/ProfileForm";

export function Dashboard() {
  const { jobs, allTags, loading, filters, setFilters, refetch } = useJobs();
  const { profiles, create } = useProfiles();
  const { scan, scanning, startScan } = useScan();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const handleScan = () => {
    if (!selectedProfileId) return;
    startScan(selectedProfileId, () => {
      refetch();
    });
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <ProfileSelector
            profiles={profiles}
            selectedId={selectedProfileId}
            onSelect={setSelectedProfileId}
          />
          <ScanButton
            scanning={scanning}
            scan={scan}
            disabled={!selectedProfileId}
            onScan={handleScan}
          />
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f9fafb", borderRadius: 8 }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", color: "#374151" }}>Quick Add Profile</h3>
        <ProfileForm onSubmit={create} />
      </div>

      <FilterBar filters={filters} onFiltersChange={setFilters} allTags={allTags} />
      <JobTable jobs={jobs} loading={loading} />
    </div>
  );
}
```

- [ ] **Step 2: Create client/src/components/SettingsForm.tsx**

```tsx
import { useState, useEffect } from "react";
import type { Settings } from "../types";
import * as api from "../api/client";

export function SettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  if (loading || !settings) {
    return <p>Loading settings...</p>;
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>LinkedIn Configuration</h3>
        <div
          style={{
            padding: "1rem",
            background: settings.linkedinConfigured ? "#d1fae5" : "#fef3c7",
            borderRadius: 8,
            marginBottom: "0.5rem",
          }}
        >
          <strong>Status:</strong>{" "}
          {settings.linkedinConfigured
            ? `Configured (${settings.linkedinEmail})`
            : "Not configured"}
        </div>
        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
          Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD in your .env file to configure LinkedIn access.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Ollama Configuration</h3>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <div>
            <label style={{ fontSize: "0.875rem", color: "#374151" }}>Base URL</label>
            <input
              type="text"
              value={settings.ollamaBaseUrl}
              readOnly
              style={{
                display: "block",
                width: "100%",
                padding: "0.5rem",
                borderRadius: 4,
                border: "1px solid #d1d5db",
                background: "#f9fafb",
                fontSize: "0.875rem",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.875rem", color: "#374151" }}>Model</label>
            <input
              type="text"
              value={settings.ollamaModel}
              readOnly
              style={{
                display: "block",
                width: "100%",
                padding: "0.5rem",
                borderRadius: 4,
                border: "1px solid #d1d5db",
                background: "#f9fafb",
                fontSize: "0.875rem",
              }}
            />
          </div>
        </div>
        <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          Set OLLAMA_BASE_URL and OLLAMA_MODEL in your .env file to configure Ollama.
        </p>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Implement client/src/pages/Settings.tsx**

Replace the placeholder with:

```tsx
import { useProfiles } from "../hooks/useProfiles";
import { ProfileForm } from "../components/ProfileForm";
import { SettingsForm } from "../components/SettingsForm";

export function Settings() {
  const { profiles, create, remove, loading } = useProfiles();

  return (
    <div>
      <h2 style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>Settings</h2>

      <section style={{ marginBottom: "2.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Search Profiles</h3>
        <ProfileForm onSubmit={create} />

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ marginTop: "1rem" }}>
            {profiles.length === 0 && <p style={{ color: "#6b7280" }}>No profiles yet.</p>}
            {profiles.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  marginBottom: "0.5rem",
                }}
              >
                <div>
                  <strong>{p.name}</strong>
                  <span style={{ color: "#6b7280", marginLeft: "0.75rem", fontSize: "0.875rem" }}>
                    {p.keywords.join(", ")}
                  </span>
                </div>
                <button
                  onClick={() => remove(p.id)}
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: 4,
                    border: "1px solid #fca5a5",
                    background: "#fff",
                    color: "#dc2626",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <SettingsForm />
    </div>
  );
}
```

- [ ] **Step 4: Verify frontend renders end-to-end**

Run: `cd client && npm run dev`
Expected: Dashboard with profile selector, scan button, filter bar, and empty job table. Settings page shows profile management and config status.

- [ ] **Step 5: Commit**

```bash
git add client/src/
git commit -m "feat: implement Dashboard and Settings pages with all components"
```

---

## Task 8: Integration — Docker Compose, Root Scripts, Final Wiring

**Files:**
- Modify: `docker-compose.yml` (add scanner service)
- Modify: `package.json` (root scripts)
- Create: `.env.example` (already exists, verify complete)

- [ ] **Step 1: Update docker-compose.yml to optionally include scanner**

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: lead_finder
      POSTGRES_USER: lead_finder
      POSTGRES_PASSWORD: lead_finder_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Keep it simple — Postgres in Docker, server/client/scanner run locally for development.

- [ ] **Step 2: Update root package.json with complete dev scripts**

```json
{
  "name": "linkedin-lead-finder",
  "private": true,
  "scripts": {
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "dev:scanner": "cd scanner && source .venv/bin/activate && uvicorn app.main:app --reload --port 8001",
    "db:generate": "cd server && npx drizzle-kit generate",
    "db:migrate": "cd server && npx tsx src/db/migrate.ts",
    "db:studio": "cd server && npx drizzle-kit studio",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down"
  }
}
```

- [ ] **Step 3: Verify full stack starts**

Run (in separate terminals):
```bash
docker compose up -d
npm run dev:server
npm run dev:client
npm run dev:scanner
```

Expected: PostgreSQL on 5432, Fastify API on 3001, Vite on 5173, Scanner on 8001. Frontend loads, API health check returns ok, scanner health check returns ok.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml package.json .env.example
git commit -m "feat: finalize docker-compose and root dev scripts"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] LinkedIn Jobs scanning — Task 3 (jobs.py)
- [x] LinkedIn Posts scanning — Task 3 (posts.py)
- [x] AI extraction via Ollama — Task 3 (extractor.py, ollama.py)
- [x] PostgreSQL schema with all 4 tables — Task 1 (schema.ts)
- [x] Job CRUD endpoints — Task 2 (jobs.ts route)
- [x] Scan trigger + async execution — Task 2 (scan-service.ts)
- [x] Search profiles CRUD — Task 2 (profiles.ts route)
- [x] Settings endpoint — Task 2 (settings.ts route)
- [x] Frontend dashboard with job table — Tasks 6-7
- [x] Client-side filtering — Task 5 (useJobs hook) + Task 6 (FilterBar)
- [x] Scan polling (2s interval) — Task 5 (useScan hook)
- [x] Expandable job detail view — Task 6 (JobCard)
- [x] Settings page — Task 7
- [x] Dedup by source_url — Task 2 (job-service.ts)
- [x] Error handling for scan failures — Task 2 (scan-service.ts)
- [x] Docker Compose for PostgreSQL — Task 1 + 8
- [x] No mock data — confirmed, no seed data anywhere

**Placeholder scan:** No TBD, TODO, or incomplete sections found.

**Type consistency:** Verified — `ScannerJob` fields match Python `ExtractedJob` model snake_case. Frontend `Job` type matches Drizzle schema camelCase output. `ContactInfo` consistent across all three layers.
