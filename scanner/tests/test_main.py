"""Integration tests for the FastAPI application."""

from fastapi.testclient import TestClient

from app.main import app


class TestHealthEndpoint:
    """The /health endpoint should always return a 200 OK."""

    def test_health(self) -> None:
        client = TestClient(app)
        response = client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
