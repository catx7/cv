"""Unit tests for the JSON extraction parser."""

from app.extraction.extractor import _parse_extraction


class TestParseExtraction:
    """_parse_extraction should robustly handle varied LLM output."""

    def test_parse_valid_json(self) -> None:
        text = '{"salary_min": 120000, "skills": ["python", "aws"]}'
        result = _parse_extraction(text)

        assert result["salary_min"] == 120_000
        assert result["skills"] == ["python", "aws"]

    def test_parse_json_with_surrounding_text(self) -> None:
        text = (
            "Here is the extracted data:\n"
            '{"experience_level": "senior", "job_type": "full-time"}\n'
            "Let me know if you need more."
        )
        result = _parse_extraction(text)

        assert result["experience_level"] == "senior"
        assert result["job_type"] == "full-time"

    def test_parse_empty_string(self) -> None:
        assert _parse_extraction("") == {}

    def test_parse_invalid_json(self) -> None:
        assert _parse_extraction("this is not json at all") == {}

    def test_parse_none_like_input(self) -> None:
        # Exercises the early-return guard.
        assert _parse_extraction("") == {}

    def test_parse_json_in_markdown_fences(self) -> None:
        text = '```json\n{"summary": "A great role"}\n```'
        result = _parse_extraction(text)

        assert result["summary"] == "A great role"
