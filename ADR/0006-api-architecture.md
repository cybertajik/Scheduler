# 6. REST API Design & Versioning

* **Status**: Accepted
* **Date**: 2026-07-26

## Context
The frontend and external integrations require clear, strongly-typed endpoints for managing entities, scheduling jobs, and retrieving diagnostic scores.

## Decision
Design OpenAPI 3.0 REST API prefixed under `/api/v1/`. Use Pydantic schemas for request validation and response serialization.

## Consequences
Generates automatic interactive OpenAPI documentation at `/docs` and ensures client-server schema compliance.
