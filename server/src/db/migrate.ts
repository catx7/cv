import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const DATABASE_URL = process.env["DATABASE_URL"];

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required to run migrations.",
  );
}

async function runMigrations(): Promise<void> {
  // Use a single connection for migrations (not a pool).
  const migrationClient = postgres(DATABASE_URL!, { max: 1 });
  const db = drizzle(migrationClient);

  console.log("Running migrations...");

  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("Migrations completed successfully.");

  await migrationClient.end();
}

runMigrations().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
