# 5. JWT Authentication and Token Revocation

* **Status**: Accepted
* **Date**: 2026-07-26

## Context
Secure access control is required to protect employee PII and scheduling workflows across three user roles (`ADMIN`, `SCHEDULER`, `EMPLOYEE`).

## Decision
Implement OAuth2 password bearer flow with short-lived JWT access tokens (30 minutes) and long-lived refresh tokens (7 days). Store token revocation JTI IDs in Redis (`TokenBlacklistService`).

## Consequences
Provides stateless API authentication with immediate token invalidation on logout.
