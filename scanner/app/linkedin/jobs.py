"""LinkedIn Jobs search and detail retrieval."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from linkedin_api import Linkedin

logger = logging.getLogger(__name__)

_LINKEDIN_JOB_BASE_URL = "https://www.linkedin.com/jobs/view"


def _extract_job_id(result: dict[str, Any]) -> str | None:
    """Extract the numeric job ID from a search result's dashEntityUrn.

    The URN typically looks like ``urn:li:fsd_jobPosting:1234567890``.
    """
    urn: str | None = result.get("dashEntityUrn") or result.get("entityUrn")
    if not urn:
        return None
    # The numeric ID is the final colon-separated segment.
    return urn.rsplit(":", maxsplit=1)[-1]


def _extract_company_name(job_detail: dict[str, Any]) -> str:
    """Navigate the nested companyDetails structure to find the company name."""
    # The linkedin-api library returns varying shapes depending on version.
    # We try several known paths defensively.
    company_details = job_detail.get("companyDetails", {})

    # Path 1: companyDetails -> com.linkedin.voyager.deco.jobs.web.shared.WebCompactJobPostingCompany -> companyResolutionResult -> name
    for _key, value in company_details.items():
        if isinstance(value, dict):
            resolution = value.get("companyResolutionResult") or value.get("company")
            if isinstance(resolution, dict) and resolution.get("name"):
                return resolution["name"]

    # Path 2: top-level companyDetails with a direct name
    if isinstance(company_details, dict) and company_details.get("name"):
        return company_details["name"]

    # Path 3: fallback to companyName at top level
    return job_detail.get("companyName", "Unknown")


def _extract_description(job_detail: dict[str, Any]) -> str:
    """Extract plain-text description from a job detail payload."""
    desc = job_detail.get("description", {})
    if isinstance(desc, dict):
        return desc.get("text", "")
    if isinstance(desc, str):
        return desc
    return ""


def search_jobs(
    client: Linkedin,
    keywords: list[str],
    limit: int = 25,
) -> list[dict[str, Any]]:
    """Search LinkedIn for jobs matching *keywords* and return enriched results.

    Each result is a flat dictionary suitable for downstream extraction.
    Individual job failures are logged and skipped so the overall search
    never crashes.
    """
    query = " ".join(keywords)
    logger.info("Searching LinkedIn jobs: query=%r, limit=%d", query, limit)

    try:
        search_results = client.search_jobs(keywords=query, limit=limit)
    except Exception:
        logger.exception("Failed to search LinkedIn jobs for query %r", query)
        return []

    jobs: list[dict[str, Any]] = []

    for result in search_results:
        job_id = _extract_job_id(result)
        if not job_id:
            logger.warning("Skipping search result with no extractable job ID")
            continue

        try:
            detail = client.get_job(job_id)
        except Exception:
            logger.exception("Failed to fetch job detail for job_id=%s", job_id)
            continue

        title = detail.get("title", "")
        company = _extract_company_name(detail)
        description = _extract_description(detail)
        location = detail.get("formattedLocation", "")
        listed_at = detail.get("listedAt")
        url = f"{_LINKEDIN_JOB_BASE_URL}/{job_id}"

        # Convert listedAt epoch-ms to ISO string when present.
        posted_at: str | None = None
        if listed_at is not None:
            try:
                from datetime import datetime, timezone

                posted_at = (
                    datetime.fromtimestamp(listed_at / 1000, tz=timezone.utc)
                    .isoformat()
                )
            except (TypeError, ValueError, OSError):
                logger.warning("Could not parse listedAt=%r for job %s", listed_at, job_id)

        jobs.append(
            {
                "title": title,
                "company": company,
                "description": description,
                "location": location,
                "url": url,
                "posted_at": posted_at,
            }
        )

    logger.info("Retrieved %d jobs out of %d search results", len(jobs), len(search_results))
    return jobs
