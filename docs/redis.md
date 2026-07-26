# Redis Data Store Integration

## Overview
Redis 7 is used as both an asynchronous message broker for **Celery** and an in-memory cache for **JWT Token Blacklisting**.

## Key Namespaces
* **`celery`**: Task queues and task result payloads.
* **`token_blacklist:{jti}`**: Revoked JWT access token identifiers set during user logout (TTL matching token expiration).
