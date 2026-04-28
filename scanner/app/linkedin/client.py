"""Singleton LinkedIn API client with credential management."""

from __future__ import annotations

import logging
import os
import threading
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from linkedin_api import Linkedin

logger = logging.getLogger(__name__)

_client: Linkedin | None = None
_lock = threading.Lock()


def get_client() -> Linkedin:
    """Return a cached LinkedIn API client, creating one if necessary.

    Uses a thread-safe singleton pattern so the expensive authentication
    handshake only happens once per process lifetime.

    Raises:
        ValueError: If LINKEDIN_EMAIL or LINKEDIN_PASSWORD environment
            variables are not set.
    """
    global _client  # noqa: PLW0603

    if _client is not None:
        return _client

    with _lock:
        # Double-checked locking: another thread may have initialised
        # the client while we waited for the lock.
        if _client is not None:
            return _client

        email = os.environ.get("LINKEDIN_EMAIL")
        password = os.environ.get("LINKEDIN_PASSWORD")

        if not email or not password:
            raise ValueError(
                "LINKEDIN_EMAIL and LINKEDIN_PASSWORD environment variables "
                "must be set to authenticate with LinkedIn."
            )

        from linkedin_api import Linkedin as LinkedInClient

        logger.info("Authenticating with LinkedIn as %s", email)
        _client = LinkedInClient(email, password)
        return _client


def reset_client() -> None:
    """Reset the cached client.  Primarily useful for testing."""
    global _client  # noqa: PLW0603

    with _lock:
        _client = None
