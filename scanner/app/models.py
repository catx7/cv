"""Pydantic models for the LinkedIn Lead Scanner API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ContactInfo(BaseModel):
    """Contact information extracted from a job posting."""

    email: str | None = None
    recruiter_name: str | None = None
    apply_url: str | None = None


class ExtractedJob(BaseModel):
    """A fully extracted and structured job posting."""

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
    tags: list[str] = Field(default_factory=list)


class ScanRequest(BaseModel):
    """Incoming request to scan LinkedIn for job leads."""

    keywords: list[str]
    filters: dict | None = None


class ScanResponse(BaseModel):
    """Response containing extracted job leads."""

    jobs: list[ExtractedJob] = Field(default_factory=list)
    error: str | None = None
