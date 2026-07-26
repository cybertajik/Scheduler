# Automated Testing Strategy

## Test Suite Overview

The project features a **44-test automated Pytest suite** covering all core system functionality.

```bash
# Execute Pytest inside backend docker container
docker-compose exec backend pytest
```

---

## Test Inventory (44 Passing Tests)

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

3. **`test_jobs.py` (2 tests)**:
   * Job submission (`POST /jobs/generate`)
   * Job progress polling (`GET /jobs/{id}/progress`)

4. **`test_rules_engine.py` (7 tests)**:
   * Hard constraint evaluators (Vacation, Night Shift Rest, Duplicate Shift)
   * Soft constraint evaluators (Fairness, Weekend Limits)

5. **`test_solver.py` (1 test)**:
   * OR-Tools solver feasibility unit test

6. **`test_solver_integration.py` (4 tests)**:
   * End-to-end schedule generation & PostgreSQL persistence
