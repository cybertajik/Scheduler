import logging
from typing import Set

logger = logging.getLogger(__name__)

# Simple in-memory token blacklist for revoked JWTs (can be backed by Redis in prod)
_blacklisted_tokens: Set[str] = set()

def add_token_to_blacklist(token: str) -> None:
    """Revokes a JWT token by adding it to the blacklist."""
    _blacklisted_tokens.add(token)
    logger.info("JWT token successfully added to revocation blacklist")

def is_token_blacklisted(token: str) -> bool:
    """Checks if a JWT token has been revoked."""
    return token in _blacklisted_tokens
