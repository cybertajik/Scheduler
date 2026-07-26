# 9. Docker Containerization & Reverse Proxy Setup

* **Status**: Accepted
* **Date**: 2026-07-26

## Context
Deploying python, node, postgres, redis, and celery components across development and production environments requires uniform container orchestration.

## Decision
Containerize all services using Docker multi-stage builds and orchestrate them with `docker-compose.yml`. Nginx serves as the reverse proxy on port 80.

## Consequences
Single-command deployment (`docker-compose up -d`) across local development and production Linux servers.
