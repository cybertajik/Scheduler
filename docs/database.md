# Database Documentation & ERD

## Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ AUDIT_LOGS : performs
    WORKERS ||--o{ WORKER_CONSTRAINTS : has
    WORKERS ||--o{ ASSIGNMENTS : assigned_to
    SHIFT_TYPES ||--o{ SHIFT_INSTANCES : instantiates
    SCHEDULES ||--o{ SHIFT_INSTANCES : contains
    SHIFT_INSTANCES ||--o{ ASSIGNMENTS : filled_by
    DEPARTMENTS ||--o{ WORKERS : contains

    USERS {
        uuid id PK
        string username
        string email
        string password_hash
        enum role
        boolean active
    }

    WORKERS {
        uuid id PK
        string employee_number
        string first_name
        string last_name
        float weekly_contract_hours
        boolean active
    }

    SCHEDULES {
        uuid id PK
        int month
        int year
        enum status
        string solver_score
        timestamp generated_at
    }

    SHIFT_INSTANCES {
        uuid id PK
        uuid schedule_id FK
        uuid shift_type_id FK
        date date
        int required_workers
    }

    ASSIGNMENTS {
        uuid id PK
        uuid shift_instance_id FK
        uuid worker_id FK
        boolean locked
        enum assignment_source
    }
```

---

## Tables Summary
* **`users`**: Administrative system accounts with role authorization (`ADMIN`, `SCHEDULER`, `EMPLOYEE`).
* **`workers`**: Employee roster containing contract hours and active status.
* **`schedules`**: Monthly schedule periods with solver score metadata.
* **`shift_instances`**: Daily demand requirements per shift type.
* **`assignments`**: Worker shift assignments with manual locking flags.
* **`worker_constraints`**: Worker availability rules and vacation dates.
* **`audit_logs`**: System audit trails recording user actions.
