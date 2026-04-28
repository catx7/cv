DO $$ BEGIN
 CREATE TYPE "public"."experience_level" AS ENUM('junior', 'mid', 'senior');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."job_type" AS ENUM('full-time', 'contract', 'freelance');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."location_type" AS ENUM('remote', 'hybrid', 'onsite');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."scan_status" AS ENUM('running', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."source" AS ENUM('linkedin_jobs', 'linkedin_posts');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"tag_name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"company" varchar(300) NOT NULL,
	"location" varchar(300),
	"location_type" "location_type",
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" varchar(3),
	"experience_level" "experience_level",
	"job_type" "job_type",
	"contact_info" jsonb,
	"description" text NOT NULL,
	"summary" text,
	"source" "source" NOT NULL,
	"source_url" varchar(2000) NOT NULL,
	"posted_at" timestamp with time zone,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"search_profile_id" uuid NOT NULL,
	"status" "scan_status" DEFAULT 'running' NOT NULL,
	"jobs_found" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"keywords" text[] NOT NULL,
	"filters" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job_tags" ADD CONSTRAINT "job_tags_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scans" ADD CONSTRAINT "scans_search_profile_id_search_profiles_id_fk" FOREIGN KEY ("search_profile_id") REFERENCES "public"."search_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "job_tags_job_id_tag_name_idx" ON "job_tags" USING btree ("job_id","tag_name");