"""LinkedIn Posts search for hiring-related content."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from linkedin_api import Linkedin

logger = logging.getLogger(__name__)

_MIN_TEXT_LENGTH = 50
_LINKEDIN_POST_BASE_URL = "https://www.linkedin.com/feed/update"


def _extract_post_id(result: dict[str, Any]) -> str | None:
    """Extract the post ID from an entityUrn."""
    urn: str | None = result.get("entityUrn")
    if not urn:
        return None
    return urn.rsplit(":", maxsplit=1)[-1]


def search_posts(
    client: Linkedin,
    keywords: list[str],
    limit: int = 25,
) -> list[dict[str, Any]]:
    """Search LinkedIn posts for hiring-related content matching *keywords*.

    Appends ``"hiring"`` to the query to focus on recruitment posts.
    Posts with fewer than 50 characters of text are discarded.
    """
    query = " ".join([*keywords, "hiring"])
    logger.info("Searching LinkedIn posts: query=%r, limit=%d", query, limit)

    try:
        search_results = client.search(
            {"keywords": query, "limit": limit},
            type="content",
        )
    except Exception:
        logger.exception("Failed to search LinkedIn posts for query %r", query)
        return []

    if not isinstance(search_results, list):
        logger.warning("Unexpected search result type: %s", type(search_results))
        return []

    posts: list[dict[str, Any]] = []

    for result in search_results:
        post_id = _extract_post_id(result)
        if not post_id:
            logger.warning("Skipping post result with no extractable post ID")
            continue

        text = result.get("summary", "") or ""
        author = result.get("title", "") or ""

        if len(text) < _MIN_TEXT_LENGTH:
            logger.debug("Skipping short post %s (%d chars)", post_id, len(text))
            continue

        url = f"{_LINKEDIN_POST_BASE_URL}/{post_id}"

        posts.append(
            {
                "post_id": post_id,
                "author": author,
                "text": text,
                "url": url,
            }
        )

    logger.info("Retrieved %d posts out of %d search results", len(posts), len(search_results))
    return posts
