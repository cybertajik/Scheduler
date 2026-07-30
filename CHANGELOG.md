# Changelog

All notable changes to the Staff Scheduler project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2026-07-27

### Changed (Code Quality Audit — Step 16)

- **Critical bug fix**: `export_service.py` — corrected all stale model field references (`worker.code` → `employee_number`, `worker.full_name` → `first_name`/`last_name`, `schedule.name` → month/year label, etc.)
- **Critical bug fix**: `import_service.py` — replaced `Worker.code` with `Worker.employee_number` throughout
- **Critical bug fix**: `import_export.py` — replaced non-existent `AuditService.log()` with correct `AuditService.log_action()`
- **Test fix**: Created `backend/tests/conftest.py` with `client`, `admin_token_headers`, and `db` pytest fixtures; fixed broken tests → **48/48 tests pass**
- **Security**: Removed wildcard `"*"` from `CORS_ORIGINS` in `config.py`
- **Quality**: `schedule_service.py` — `get_all_schedules()` now orders by `year DESC, month DESC`
- **Quality**: `analytics.py` — added docstrings to all 6 endpoint functions

---

## [2.0.0] - 2026-07-27

### Added (Analytics Dashboard — Step 16 Bonus)

- **`GET /api/v1/analytics/overview`**: Global workforce KPI summary endpoint
- **`GET /api/v1/analytics/{id}/coverage`**: Per-day required vs assigned worker data
- **`GET /api/v1/analytics/{id}/worker-load`**: Shift count per worker for load analysis
- **`GET /api/v1/analytics/{id}/department-load`**: Assignments grouped by department
- **`GET /api/v1/analytics/{id}/shift-distribution`**: Shift type breakdown
- **`GET /api/v1/analytics/schedules-summary`**: Cross-schedule coverage comparison
- **`AnalyticsDashboardPage.tsx`**: Full analytics UI with pure SVG charts (daily coverage bars, worker load horizontal bars, department donut, shift type distribution, comparison table)

---

## [1.9.0] - 2026-07-27

### Added (Import & Export System — Step 15)

- **Export Service**: Full schedule export in CSV, Excel (`.xlsx`), and JSON formats
- **Import Service**: Worker CSV/XLSX import with dry-run validation, duplicate detection, and transactional commit
- **Audit Integration**: All export and import operations are recorded in the audit log
- **`ImportExportPage.tsx`**: Frontend wizard UI for one-click exports and guided import workflow

---

## [1.8.0] - 2026-07-27

### Added (Backup & Disaster Recovery — Step 14)

- **Automated backup scripts**: `backup_all.sh`, `restore_all.sh` with SHA-256 checksum verification
- **Disaster recovery playbook**: `docs/disaster-recovery.md` with full restore procedures
- **Scheduled backups**: Cron-based daily backup with automated 30-day pruning

---

## [1.7.0] - 2026-07-27

### Added (Monitoring & Observability — Step 13)

- **Structured request logging**: Request ID, method, path, status, latency per request via `RequestLoggingMiddleware`
- **System Status Dashboard**: `SystemStatusPage.tsx` with container health, database connectivity, and Celery worker status
- **Audit log**: Full CRUD action trail with who/when/what/entity metadata

---

## [1.6.0] - 2026-07-26

### Added (Production Infrastructure — Steps 12 & 12B)

- **Docker Compose production stack**: 7-service orchestration (frontend, backend, PostgreSQL, Redis, Celery worker, Celery beat, Nginx)
- **Multi-stage Dockerfiles**: Optimised images for frontend and backend
- **Health checks**: Container-level health probes for all services
- **Nginx reverse proxy**: SSL-ready configuration with security headers and static asset caching
- **Resource limits**: CPU and memory caps per container
- **Named volumes**: Persistent data volumes with backup support
- **Startup, shutdown, update, and rollback scripts**: `scripts/` directory

---

## [1.5.0] - 2026-07-26

### Added (Documentation & Pipeline)

- **Complete Project Documentation**: Created comprehensive `docs/`, `ADR/`, `.github/`, and root Markdown manuals.
- **Git Branching & Release Pipeline**: Established `main` and `develop` branching model with semantic milestone tags (`v1.0-scaffold` through `v1.5.0`).

---

## [1.4.0] - 2026-07-26

### Added (Asynchronous Job Processing)

- **Asynchronous Job Processing**: Integrated Celery 5.3 and Redis 7 broker for background schedule optimization and rebalancing.
- **Jobs API Endpoints**: Added `/api/v1/jobs/generate`, `/api/v1/jobs/rebalance`, `/api/v1/jobs/{job_id}/progress`, `/api/v1/jobs/{job_id}/logs`, and `DELETE /api/v1/jobs/{job_id}`.
- **Job Test Suite**: Added Pytest integration test suite covering job submission, progress polling, and authorization.

---

## [1.3.0] - 2026-07-26

### Added (Interactive Schedule Editor)

- **Advanced Interactive Schedule Editor**: Built drag-and-drop FullCalendar integration with `editable={true}`.
- **Undo / Redo System**: Implemented `useScheduleHistory` hook tracking schedule edit operations (`Ctrl+Z` / `Ctrl+Y`).
- **Live Conflict Inspector**: Added `ConflictSidePanel.tsx` and `WorkerDetailDrawer.tsx` sidebars for real-time diagnostic evaluation.
- **Shift Assignment Context Menu**: Popover menu supporting locking, unlocking, swapping, and removing shift assignments.

---

## [1.2.0] - 2026-07-26

### Added (Frontend SPA)

- **React 18 + TypeScript Frontend SPA**: Built complete single-page application scaffold using Vite, Tailwind CSS, and Axios.
- **Page Modules**: Dashboard, Workers Directory, Worker Detail, Shift Definitions, Rules Matrix, Schedules Overview, Audit Log, User Management, and Profile.
- **Session Management**: AuthContext with automatic JWT persistence, refresh token rotation, and route protection.

---

## [1.1.0] - 2026-07-26

### Added (Solver & API Layer)

- **Google OR-Tools CP-SAT Solver Integration**: Solves integer programming models maximizing shift coverage, weekend limits, night shift rest, and fairness.
- **Rules Evaluation Engine**: Hard constraint evaluators (Vacation, Rest Days, Skill Match) and soft constraint scoring.
- **FastAPI REST API Layer**: Full CRUD endpoints for workers, departments, shift types, rules, and schedules.

---

## [1.0.0] - 2026-07-26

### Added (Initial Scaffold & Auth)

- **Database & Architecture Scaffold**: Initialized PostgreSQL 16 schema with Alembic migrations.
- **Authentication & RBAC**: Password hashing via Passlib (Bcrypt), JWT access & refresh token issuance, and role definitions (`ADMIN`, `SCHEDULER`, `EMPLOYEE`).
