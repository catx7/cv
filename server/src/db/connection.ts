import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";

const DATABASE_URL = process.env["DATABASE_URL"];

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required. " +
      "Copy .env.example to .env and configure your database connection.",
  );
}

/**
 * postgres.js connection pool used by drizzle-orm.
 * Defaults to a sensible pool size for a single-user app.
 */
const queryClient = postgres(DATABASE_URL, { max: 10 });

/**
 * Drizzle ORM database instance with typed schema.
 * Import this wherever you need to run queries.
 */
export const db = drizzle(queryClient, { schema });
