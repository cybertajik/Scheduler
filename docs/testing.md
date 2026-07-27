# Automated Testing Strategy

## Test Suite Overview

The project features a **48-test automated Pytest suite** covering all core system functionality.
All tests pass as of Step 16 (Code Quality Audit).

```bash
# Execute Pytest inside backend docker container
docker-compose exec backend pytest

# Run with verbose output
docker-compose exec backend pytest -v

# Run a specific test file
docker-compose exec backend pytest tests/test_import_export.py -v
```

---

## Fixtures (conftest.py)

Shared pytest fixtures are defined in `backend/tests/conftest.py`:

| Fixture | Scope | Description |
|---|---|---|
| `client` | module | FastAPI `TestClient` bound to the full application |
| `admin_token_headers` | module | `Authorization: Bearer <token>` headers for the admin account |
| `db` | function | SQLAlchemy `Session` for direct ORM assertions |

---

## Test Inventory (48 Passing Tests)

1. **`test_api_layer.py` (22 tests)**:
   * Health endpoints (`/health`, `/ready`)
   * Authentication login, profile `/auth/me`, invalid credentials
   * Workers CRUD & duplicate employee numbers
   * Shift Types CRUD
   * Rules CRUD & date validation
   * Schedule CRUD & status updates
   * Schedule diagnostics (`/conflicts`, `/coverage`)

2. **`test_auth_security.py` (8 tests)**:
   * Access token issuance
   * Refresh token rotation
   * Logout token revocation & blacklisting
   * RBAC role permission enforcement
   * Security headers validation

3. **`test_import_export.py` (4 tests)**:
   * `GET /export/workers` — CSV download with correct headers
   * `GET /export/audit-log` — CSV audit log export
   * `POST /import/validate-workers` — dry-run CSV validation
   * `POST /import/commit-workers` — transactional worker import & DB assertion

4. **`test_jobs.py` (2 tests)**:
   * Job submission (`POST /jobs/generate`)
   * Job progress polling (`GET /jobs/{id}/progress`)

5. **`test_rules_engine.py` (7 tests)**:
   * Hard constraint evaluators (Vacation, Night Shift Rest, Duplicate Shift)
   * Soft constraint evaluators (Fairness, Weekend Limits)
   * Conflict detection service
   * Rule template factory

6. **`test_solver.py` (1 test)**:
   * OR-Tools solver feasibility unit test

7. **`test_solver_integration.py` (4 tests)**:
   * End-to-end schedule generation & PostgreSQL persistence
   * Locked assignment protection
   * Night shift rest enforcement
   * Infeasibility diagnostics

---

## Test Results History

| Date | Tests | Pass | Fail |
|---|---|---|---|
| Step 14 | 44 | 44 | 0 |
| Step 15 | 48 | 44 | 4 (broken fixtures) |
| Step 16 (audit) | 48 | **48** | **0** |
