"""LLM-powered extraction of structured job data from raw descriptions."""

from __future__ import annotations

import json
import logging
from typing import Any

from app.extraction.ollama import generate
from app.models import ContactInfo, ExtractedJob

logger = logging.getLogger(__name__)

_MAX_DESCRIPTION_LENGTH = 4000

EXTRACTION_PROMPT = """\
You are a data extraction assistant. Analyse the following job description and \
return a single JSON object with these fields. Use null for any field you cannot \
determine.

Fields:
- salary_min (integer or null): minimum annual salary
- salary_max (integer or null): maximum annual salary
- salary_currency (string or null): ISO 4217 currency code, e.g. "USD"
- experience_level (string or null): one of "entry", "mid", "senior", "lead", "executive"
- job_type (string or null): one of "full-time", "part-time", "contract", "internship"
- location_type (string or null): one of "remote", "hybrid", "onsite"
- location (string or null): city/region if mentioned
- contact_email (string or null): recruiter or application email
- recruiter_name (string or null): name of the recruiter or hiring manager
- summary (string): a 1-2 sentence summary of the role
- skills (list of strings): key technical skills and technologies mentioned

---
JOB DESCRIPTION:
{description}
---

Respond with ONLY the JSON object, no additional text.
"""


def _parse_extraction(text: str) -> dict[str, Any]:
    """Best-effort parse of JSON from LLM output.

    Tries ``json.loads`` directly first. If that fails (e.g. the model
    wrapped the JSON in markdown fences or explanatory text), finds the
    first ``{`` and last ``}`` and attempts to parse that substring.

    Returns an empty dict on any failure.
    """
    if not text:
        return {}

    # Attempt 1: direct parse.
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except (json.JSONDecodeError, TypeError):
        pass

    # Attempt 2: locate the outermost braces.
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        parsed = json.loads(text[start:end])
        if isinstance(parsed, dict):
            return parsed
    except (ValueError, json.JSONDecodeError, TypeError):
        pass

    logger.warning("Failed to parse extraction JSON from text: %.120s", text)
    return {}


async def extract_job_data(raw_job: dict[str, Any], source: str) -> ExtractedJob:
    """Run LLM extraction on a raw job/post dict and return an ExtractedJob.

    The *source* parameter should be ``"linkedin_jobs"`` or
    ``"linkedin_posts"`` to indicate provenance.
    """
    description = raw_job.get("description") or raw_job.get("text") or ""
    title = raw_job.get("title") or raw_job.get("author") or "Unknown"
    company = raw_job.get("company") or raw_job.get("author") or "Unknown"
    url = raw_job.get("url") or ""
    location = raw_job.get("location")
    posted_at = raw_job.get("posted_at")

    # Truncate to keep the prompt within reasonable token limits.
    truncated_desc = description[:_MAX_DESCRIPTION_LENGTH]

    prompt = EXTRACTION_PROMPT.format(description=truncated_desc)
    raw_response = await generate(prompt)
    extracted = _parse_extraction(raw_response)

    # Build contact info if any relevant field was extracted.
    contact_info: ContactInfo | None = None
    if extracted.get("contact_email") or extracted.get("recruiter_name"):
        contact_info = ContactInfo(
            email=extracted.get("contact_email"),
            recruiter_name=extracted.get("recruiter_name"),
        )

    # Merge LLM-extracted tags/skills.
    tags: list[str] = extracted.get("skills", [])
    if not isinstance(tags, list):
        tags = []

    return ExtractedJob(
        title=title,
        company=company,
        location=extracted.get("location") or location,
        location_type=extracted.get("location_type"),
        salary_min=_safe_int(extracted.get("salary_min")),
        salary_max=_safe_int(extracted.get("salary_max")),
        salary_currency=extracted.get("salary_currency"),
        experience_level=extracted.get("experience_level"),
        job_type=extracted.get("job_type"),
        contact_info=contact_info,
        description=description,
        summary=extracted.get("summary"),
        source=source,
        source_url=url,
        posted_at=posted_at,
        tags=tags,
    )


def _safe_int(value: Any) -> int | None:
    """Coerce a value to int, returning None on failure."""
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
