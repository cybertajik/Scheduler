# Changelog

All notable changes to the Staff Scheduler project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] - 2026-07-26

### Added
- **Complete Project Documentation**: Created comprehensive `docs/`, `ADR/`, `.github/`, and root Markdown manuals.
- **Git Branching & Release Pipeline**: Established `main` and `develop` branching model with semantic milestone tags (`v1.0-scaffold` through `v1.5.0`).

---

## [1.4.0] - 2026-07-26

### Added
- **Asynchronous Job Processing**: Integrated Celery 5.3 and Redis 7 broker for background schedule optimization and rebalancing.
- **Jobs API Endpoints**: Added `/api/v1/jobs/generate`, `/api/v1/jobs/rebalance`, `/api/v1/jobs/{job_id}/progress`, `/api/v1/jobs/{job_id}/logs`, and `DELETE /api/v1/jobs/{job_id}`.
- **Job Test Suite**: Added Pytest integration test suite covering job submission, progress polling, and authorization.

---

## [1.3.0] - 2026-07-26

### Added
- **Advanced Interactive Schedule Editor**: Built drag-and-drop FullCalendar integration with `editable={true}`.
- **Undo / Redo System**: Implemented `useScheduleHistory` hook tracking schedule edit operations (`Ctrl+Z` / `Ctrl+Y`).
- **Live Conflict Inspector**: Added `ConflictSidePanel.tsx` and `WorkerDetailDrawer.tsx` sidebars for real-time diagnostic evaluation.
- **Shift Assignment Context Menu**: Popover menu supporting locking, unlocking, swapping, and removing shift assignments.

---

## [1.2.0] - 2026-07-26

### Added
- **React 18 + TypeScript Frontend SPA**: Built complete single-page application scaffold using Vite, Tailwind CSS, and Axios.
- **Page Modules**: Dashboard, Workers Directory, Worker Detail, Shift Definitions, Rules Matrix, Schedules Overview, Audit Log, User Management, and Profile.
- **Session Management**: AuthContext with automatic JWT persistence, refresh token rotation, and route protection.

---

## [1.1.0] - 2026-07-26

### Added
- **Google OR-Tools CP-SAT Solver Integration**: Solves integer programming models maximizing shift coverage, weekend limits, night shift rest, and fairness.
- **Rules Evaluation Engine**: Hard constraint evaluators (Vacation, Rest Days, Skill Match) and soft constraint scoring.
- **FastAPI REST API Layer**: Full CRUD endpoints for workers, departments, shift types, rules, and schedules.

---

## [1.0.0] - 2026-07-26

### Added
- **Database & Architecture Scaffold**: Initialized PostgreSQL 16 schema with Alembic migrations.
- **Authentication & RBAC**: Password hashing via Passlib (Bcrypt), JWT access & refresh token issuance, and role definitions (`ADMIN`, `SCHEDULER`, `EMPLOYEE`).
