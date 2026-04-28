"""Ollama local LLM integration for structured data extraction."""

from __future__ import annotations

import logging
import os

import httpx

logger = logging.getLogger(__name__)

_DEFAULT_BASE_URL = "http://localhost:11434"
_DEFAULT_MODEL = "llama3"
_REQUEST_TIMEOUT_SECONDS = 120.0


async def generate(prompt: str) -> str:
    """Send a prompt to the Ollama API and return the generated text.

    Uses the ``OLLAMA_BASE_URL`` environment variable (defaults to
    ``http://localhost:11434``) and ``OLLAMA_MODEL`` (defaults to
    ``llama3``).

    Returns an empty string if the request fails for any reason so that
    callers can degrade gracefully.
    """
    base_url = os.environ.get("OLLAMA_BASE_URL", _DEFAULT_BASE_URL)
    model = os.environ.get("OLLAMA_MODEL", _DEFAULT_MODEL)
    url = f"{base_url}/api/generate"

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Ollama returned HTTP %d: %s",
            exc.response.status_code,
            exc.response.text[:200],
        )
    except httpx.RequestError as exc:
        logger.error("Ollama request failed: %s", exc)
    except Exception:
        logger.exception("Unexpected error calling Ollama")

    return ""
