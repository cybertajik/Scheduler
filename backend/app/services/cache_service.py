"""
Redis Caching Service
======================
Provides cached read access for static/infrequently-changing reference data
(departments, skills, shift types, analytics overview) with TTL & invalidation.
"""
import json
import logging
from typing import Optional, Any
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Lazy singleton redis client connection
_redis_client: Optional[redis.Redis] = None

def get_redis_client() -> Optional[redis.Redis]:
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.Redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=2.0
            )
            _redis_client.ping()
        except Exception as e:
            logger.warning(f"Redis cache connection failed: {e}. Falling back to direct database reads.")
            _redis_client = None
    return _redis_client


class CacheService:
    @staticmethod
    def get(key: str) -> Optional[Any]:
        """Fetch cached data by key, returning parsed JSON or None."""
        client = get_redis_client()
        if not client:
            return None
        try:
            val = client.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.warning(f"Redis cache get error for key '{key}': {e}")
        return None

    @staticmethod
    def set(key: str, value: Any, ttl_seconds: int = 300) -> bool:
        """Store value in cache as JSON string with specified TTL (default 5 min)."""
        client = get_redis_client()
        if not client:
            return False
        try:
            serialized = json.dumps(value, default=str)
            client.setex(name=key, time=ttl_seconds, value=serialized)
            return True
        except Exception as e:
            logger.warning(f"Redis cache set error for key '{key}': {e}")
            return False

    @staticmethod
    def delete(key: str) -> bool:
        """Invalidate single cache key."""
        client = get_redis_client()
        if not client:
            return False
        try:
            client.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Redis cache delete error for key '{key}': {e}")
            return False

    @staticmethod
    def delete_pattern(pattern: str) -> bool:
        """Invalidate all cache keys matching glob pattern (e.g. 'analytics:*')."""
        client = get_redis_client()
        if not client:
            return False
        try:
            keys = client.keys(pattern)
            if keys:
                client.delete(*keys)
            return True
        except Exception as e:
            logger.warning(f"Redis cache delete pattern error for '{pattern}': {e}")
            return False
