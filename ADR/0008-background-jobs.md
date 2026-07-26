# 8. Asynchronous Task Queue with Celery & Redis

* **Status**: Accepted
* **Date**: 2026-07-26

## Context
Running OR-Tools CP-SAT optimizations inside synchronous HTTP request handlers causes request timeouts.

## Decision
Offload long-running solver execution and coverage recalculations to Celery workers using Redis as the message broker.

## Consequences
Prevents HTTP connection timeouts and enables frontend progress polling via `/api/v1/jobs/{job_id}/progress`.
