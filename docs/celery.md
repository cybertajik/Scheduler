# Celery Background Task Processing

## Task Architecture

Long-running constraint solver executions are offloaded to Celery background tasks to prevent HTTP connection timeouts.

```mermaid
sequenceDiagram
    participant API as FastAPI Router
    participant Redis as Redis Broker
    participant Worker as Celery Worker
    participant DB as PostgreSQL

    API->>Redis: task.delay(schedule_id)
    API-->>Client: 200 OK { job_id, status: "PENDING" }
    
    Worker->>Redis: Reserve Task
    Worker->>DB: Read Schedule & Workers
    Worker->>Worker: ORToolsSchedulerSolver.solve()
    Worker->>DB: Save Assignments & Status=GENERATED
    Worker->>Redis: Store Task Result JSON
```

---

## Tasks Inventory

* **`generate_schedule_task(schedule_id: str)`**: Main background optimization task running CP-SAT.
* **`recalculate_coverage_task(schedule_id: str)`**: Computes worker coverage metrics and hours allocations.
* **`export_schedule_task(schedule_id: str, format: str)`**: Placeholder for CSV/PDF report generation.
* **`send_notification_task(schedule_id: str, message: str)`**: Placeholder for email alerts.
