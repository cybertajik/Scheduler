# 2. Relational Database Design with PostgreSQL

* **Status**: Accepted
* **Date**: 2026-07-26

## Context
Scheduling requires strict transactional consistency for workers, departments, shift instances, worker constraints, and manual shift assignments.

## Decision
Use PostgreSQL 16 managed via SQLAlchemy 2.0 ORM and Alembic migrations. UUID primary keys are used across all core entities (`User`, `Worker`, `Department`, `ShiftType`, `Schedule`, `ShiftInstance`, `Assignment`, `WorkerConstraint`).

## Alternatives Considered
* **Document Store (MongoDB)**: Rejected because schedule optimization requires relational queries across workers, shift demands, and rules.

## Consequences
Ensures strong ACID compliance and foreign key integrity.
