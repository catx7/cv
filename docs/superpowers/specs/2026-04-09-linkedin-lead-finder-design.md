# LinkedIn Lead Finder — Design Spec

## Overview

A single-user application that scans LinkedIn Jobs and LinkedIn Posts to find software developer job leads. It extracts structured data (salary, skills, contact info, experience level, etc.) from job descriptions using a local LLM via Ollama, and presents results in a filterable dashboard.

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **API Server:** Node.js + Fastify + TypeScript
- **Scraping/AI Service:** Python (FastAPI)
- **Database:** PostgreSQL
- **AI Extraction:** Ollama (local LLM)

## Architecture

```
┌─────────────────────────────────┐
│   React + Vite Frontend (SPA)   │
│   - Dashboard with job listings │
│   - Tag/keyword configuration   │
│   - Scan trigger button         │
│   - Job detail + summary view   │
└──────────────┬──────────────────┘
               │ REST API
┌──────────────▼──────────────────┐
│   Node.js / Fastify API (TS)    │
│   - Job CRUD endpoints          │
│   - Tag/filter management       │
│   - Triggers Python scanner     │
│   - Stores results in Postgres  │
└──────────┬───────────┬──────────┘
           │           │ HTTP call
    ┌──────▼──────┐ ┌──▼──────────────┐
    │  PostgreSQL  │ │ Python Service  │
    │  - jobs      │ │ - linkedin-api  │
    │  - tags      │ │   (unofficial)  │
    │  - scans     │ │ - LinkedIn API  │
    │  - settings  │ │   (official)    │
    │              │ │ - AI extraction │
    │              │ │   via Ollama    │
    └─────────────┘ └─────────────────┘
```

### Flow

1. User configures a search profile with keywords (e.g. "React", "remote", "senior")
2. User clicks "Scan Now"
3. Node API creates a scan record, calls Python service with search parameters
4. Python service queries LinkedIn (Jobs + Posts) using unofficial `linkedin_api` library + official API where applicable
5. For each result, Python service sends the raw description to Ollama for structured extraction
6. Python service returns extracted job objects to Node API
7. Node API persists jobs to PostgreSQL with tags
8. Frontend polls the scan status endpoint every 2 seconds until status is "completed" or "failed", then fetches and displays results

## Data Model

### jobs

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR | Job title |
| company | VARCHAR | Company name |
| location | VARCHAR | City/region |
| location_type | ENUM | remote / hybrid / onsite |
| salary_min | INTEGER | Minimum salary (nullable) |
| salary_max | INTEGER | Maximum salary (nullable) |
| salary_currency | VARCHAR(3) | Currency code (nullable) |
| experience_level | ENUM | junior / mid / senior (nullable) |
| job_type | ENUM | full-time / contract / freelance |
| contact_info | JSONB | { email, recruiter_name, apply_url } |
| description | TEXT | Raw job description |
| summary | TEXT | AI-generated summary |
| source | ENUM | linkedin_jobs / linkedin_posts |
| source_url | VARCHAR | Original LinkedIn URL |
| posted_at | TIMESTAMP | When the job was posted |
| scraped_at | TIMESTAMP | When we scraped it |
| created_at | TIMESTAMP | Record creation time |

### job_tags

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_id | UUID | FK to jobs |
| tag_name | VARCHAR | e.g. "React", "Python", "AWS" |

Composite unique index on (job_id, tag_name).

### search_profiles

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Profile name (e.g. "React Remote Senior") |
| keywords | TEXT[] | Array of keywords |
| filters | JSONB | Optional structured filters |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### scans

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| search_profile_id | UUID | FK to search_profiles |
| status | ENUM | running / completed / failed |
| jobs_found | INTEGER | Count of jobs found |
| started_at | TIMESTAMP | |
| completed_at | TIMESTAMP | (nullable) |
| error_message | TEXT | (nullable) |

## LinkedIn Data Access

Two-pronged approach:

1. **Official LinkedIn API** — used where available (requires developer app approval). Limited in scope but stable.
2. **Unofficial `linkedin_api` Python library** — reverse-engineers LinkedIn's internal API. Provides access to job search results and post feeds. Risk of breakage and ToS violation, but necessary for full functionality.

The Python service abstracts both behind a unified interface so the Node API doesn't care which source provides the data.

### LinkedIn Credentials

Stored in environment variables (not in the database). The settings page allows the user to configure:
- LinkedIn email/password (for unofficial API)
- LinkedIn API client ID/secret (for official API, if available)

## AI Extraction

Uses Ollama running locally. The Python service sends each job description to Ollama with a structured prompt:

```
Extract the following from this job description as JSON:
- salary_min, salary_max, salary_currency
- required_skills (array of technology/skill names)
- experience_level (junior/mid/senior or null)
- job_type (full-time/contract/freelance or null)
- contact_info (object with email, recruiter_name, apply_method — any found)
- location, location_type (remote/hybrid/onsite)
- summary (2-3 sentence summary of the role)
```

Response is validated and merged with scraped metadata.

### Ollama Configuration

- Model: configurable via settings (default: llama3.1 or mistral)
- Endpoint: configurable (default: http://localhost:11434)

## Frontend

### Dashboard

- **Top bar:** "Scan Now" button, active search profile dropdown, scan status indicator
- **Main area:** Job cards/table with columns: title, company, location, salary, tags, source, posted date
- **Row interaction:** Click to expand and show full detail — AI summary, raw description, contact info, apply link
- **Filter bar:** Filter by tags, experience level, job type, location type, salary range
- **No pagination:** All jobs loaded, filtered client-side (single-user, manageable dataset)

### Settings Page

- **Search profiles:** Create/edit/delete profiles with keyword sets
- **LinkedIn credentials:** Email/password for unofficial API, API keys for official
- **Ollama config:** Model name, endpoint URL

## Project Structure

```
cv/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Dashboard, Settings
│   │   ├── hooks/           # Custom React hooks
│   │   ├── api/             # API client functions
│   │   ├── types/           # Shared TypeScript types
│   │   └── App.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── server/                  # Node.js + Fastify API
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── db/              # Database queries, migrations
│   │   ├── types/           # Shared types
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json
├── scanner/                 # Python scraping + AI service
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── linkedin/        # LinkedIn scraping logic
│   │   ├── extraction/      # AI extraction via Ollama
│   │   └── models.py        # Pydantic models
│   ├── requirements.txt
│   └── pyproject.toml
├── docker-compose.yml       # PostgreSQL + services
├── docs/
│   └── superpowers/specs/
└── package.json             # Root workspace scripts
```

## Error Handling

- **Scan failures:** Python service returns errors to Node API, which updates scan status to "failed" with error message. Frontend shows the error.
- **LinkedIn rate limiting:** Python service implements exponential backoff. If blocked, scan fails with a clear message.
- **Ollama unavailable:** Extraction is skipped, job is saved with raw description only, summary marked as "extraction pending".
- **Duplicate jobs:** Deduplicated by source_url before insertion.

## Non-Goals (v1)

- Multi-user support / authentication
- Scheduled/automatic scanning
- Email/notification alerts
- Mobile-specific responsive design
- Sites other than LinkedIn
- Mock data or seed data
