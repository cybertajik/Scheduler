# Troubleshooting & Diagnostics

## Common Issues & Solutions

### 1. Database Migration Error / Connection Refused
* **Symptom**: `sqlalchemy.exc.OperationalError: Could not connect to server`.
* **Fix**: Ensure `scheduler_postgres` container is healthy (`docker-compose ps`). Verify `POSTGRES_HOST=postgres` in `.env`.

### 2. Celery Worker Fails to Pick Up Tasks
* **Symptom**: Jobs submitted via `/jobs/generate` remain in `PENDING` state indefinitely.
* **Fix**: Check `scheduler_celery_worker` container logs:
  ```bash
  docker-compose logs -f celery_worker
  ```
  Ensure Redis container `scheduler_redis` is running on port 6379.

### 3. OR-Tools Solver Returns `INFEASIBLE`
* **Symptom**: Schedule generation returns score message `Schedule infeasible: Not enough employees available`.
* **Fix**: Navigate to **Employees Management** page and verify active headcount $\ge$ sum of required employees per shift. Inspect active employee vacations on **Rules & Constraints** page.
