"""FastAPI application for the LinkedIn Lead Scanner service."""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

from fastapi import FastAPI, HTTPException

from app.extraction.extractor import extract_job_data
from app.linkedin.client import get_client
from app.linkedin.jobs import search_jobs
from app.linkedin.posts import search_posts
from app.models import ExtractedJob, ScanRequest, ScanResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LinkedIn Lead Scanner",
    version="0.1.0",
    description="Scrapes LinkedIn Jobs and Posts, then uses a local LLM to extract structured data.",
)


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}


@app.post("/scan", response_model=ScanResponse)
async def scan(request: ScanRequest) -> ScanResponse:
    """Run a full scan: search LinkedIn, extract structured data via LLM."""

    # --- 1. Authenticate ---------------------------------------------------
    try:
        client = get_client()
    except ValueError as exc:
        logger.error("LinkedIn authentication failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    # --- 2. Search LinkedIn (run in thread pool - linkedin-api is sync) ----
    loop = asyncio.get_running_loop()

    job_results, post_results = await asyncio.gather(
        loop.run_in_executor(None, search_jobs, client, request.keywords),
        loop.run_in_executor(None, search_posts, client, request.keywords),
    )

    logger.info(
        "Search complete: %d jobs, %d posts",
        len(job_results),
        len(post_results),
    )

    # --- 3. Extract structured data from each result -----------------------
    extracted_jobs: list[ExtractedJob] = []

    async def _extract_and_collect(
        raw: dict,
        source: str,
    ) -> None:
        try:
            job = await extract_job_data(raw, source=source)
            extracted_jobs.append(job)
        except Exception:
            logger.exception(
                "Extraction failed for %s item: %s",
                source,
                raw.get("title") or raw.get("post_id", "unknown"),
            )

    tasks = [
        _extract_and_collect(r, "linkedin_jobs") for r in job_results
    ] + [
        _extract_and_collect(r, "linkedin_posts") for r in post_results
    ]

    await asyncio.gather(*tasks)

    logger.info("Extraction complete: %d jobs extracted", len(extracted_jobs))

    return ScanResponse(jobs=extracted_jobs)
