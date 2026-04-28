"""Unit tests for Pydantic models."""

from app.models import ContactInfo, ExtractedJob, ScanRequest, ScanResponse


class TestExtractedJobMinimal:
    """ExtractedJob should accept only required fields and apply defaults."""

    def test_extracted_job_minimal(self) -> None:
        job = ExtractedJob(
            title="Backend Engineer",
            company="Acme Corp",
            description="Build APIs.",
            source="linkedin_jobs",
            source_url="https://linkedin.com/jobs/view/123",
        )

        assert job.title == "Backend Engineer"
        assert job.company == "Acme Corp"
        assert job.description == "Build APIs."
        assert job.source == "linkedin_jobs"
        assert job.source_url == "https://linkedin.com/jobs/view/123"

        # Defaults
        assert job.location is None
        assert job.location_type is None
        assert job.salary_min is None
        assert job.salary_max is None
        assert job.salary_currency is None
        assert job.experience_level is None
        assert job.job_type is None
        assert job.contact_info is None
        assert job.summary is None
        assert job.posted_at is None
        assert job.tags == []


class TestExtractedJobFull:
    """ExtractedJob should faithfully store every field when provided."""

    def test_extracted_job_full(self) -> None:
        contact = ContactInfo(
            email="recruiter@acme.com",
            recruiter_name="Jane Smith",
            apply_url="https://acme.com/apply",
        )

        job = ExtractedJob(
            title="Senior SRE",
            company="MegaCorp",
            location="San Francisco, CA",
            location_type="hybrid",
            salary_min=180_000,
            salary_max=250_000,
            salary_currency="USD",
            experience_level="senior",
            job_type="full-time",
            contact_info=contact,
            description="Operate large-scale distributed systems.",
            summary="Senior SRE role for distributed systems.",
            source="linkedin_posts",
            source_url="https://linkedin.com/feed/update/456",
            posted_at="2026-04-01T00:00:00+00:00",
            tags=["kubernetes", "terraform", "python"],
        )

        assert job.title == "Senior SRE"
        assert job.company == "MegaCorp"
        assert job.location == "San Francisco, CA"
        assert job.location_type == "hybrid"
        assert job.salary_min == 180_000
        assert job.salary_max == 250_000
        assert job.salary_currency == "USD"
        assert job.experience_level == "senior"
        assert job.job_type == "full-time"
        assert job.contact_info is not None
        assert job.contact_info.email == "recruiter@acme.com"
        assert job.contact_info.recruiter_name == "Jane Smith"
        assert job.contact_info.apply_url == "https://acme.com/apply"
        assert job.summary == "Senior SRE role for distributed systems."
        assert job.posted_at == "2026-04-01T00:00:00+00:00"
        assert job.tags == ["kubernetes", "terraform", "python"]


class TestScanRequest:
    """ScanRequest should store keywords and optional filters."""

    def test_scan_request(self) -> None:
        req = ScanRequest(keywords=["python", "backend"])

        assert req.keywords == ["python", "backend"]
        assert req.filters is None

    def test_scan_request_with_filters(self) -> None:
        req = ScanRequest(
            keywords=["devops"],
            filters={"location": "remote"},
        )

        assert req.keywords == ["devops"]
        assert req.filters == {"location": "remote"}


class TestScanResponse:
    """ScanResponse should default to an empty job list."""

    def test_scan_response(self) -> None:
        resp = ScanResponse()

        assert resp.jobs == []
        assert resp.error is None

    def test_scan_response_with_error(self) -> None:
        resp = ScanResponse(error="Something went wrong")

        assert resp.jobs == []
        assert resp.error == "Something went wrong"
