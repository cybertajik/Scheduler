# Backend Architecture

## Overview
The backend is built with **Python 3.12** and **FastAPI**, leveraging **SQLAlchemy 2.0** for asynchronous-capable relational ORM data mapping and **Pydantic v2** for strict data validation.

```text
backend/app/
├── api/v1/
│   ├── deps.py                  # OAuth2 JWT dependencies & RBAC permission guards
│   ├── router.py                # Combined API endpoint router
│   └── endpoints/               # Endpoint controllers (auth, workers, schedules, rules, jobs)
├── core/
│   ├── celery_app.py            # Celery worker initialization & Redis broker configuration
│   ├── config.py                # Pydantic BaseSettings loading environment variables
│   ├── database.py              # SQLAlchemy engine and SessionLocal session factory
│   └── security.py              # Passlib Bcrypt password hashing & PyJWT token utilities
├── models/                      # Declarative SQLAlchemy ORM database models
├── rules/                       # Modular hard & soft rule evaluation framework
├── services/                    # Domain business logic (WorkerService, ScheduleService, etc.)
├── solver/                      # Google OR-Tools CP-SAT solver integration & translators
└── tasks/                       # Celery task definitions (generate_schedule_task)
```

---

## Domain Services Layer

* **`AuthService`**: Handles user authentication, token issuance, refresh token verification, and logout token blacklisting.
* **`WorkerService`**: Manages worker directory CRUD, contract hours, and department associations.
* **`ScheduleService`**: Manages monthly schedule periods, shift instance generation, and assignment persistence.
* **`SolverOrchestrationService`**: Extracts scheduling context from PostgreSQL, constructs solver payloads, and triggers background CP-SAT execution.
* **`AuditService`**: Logs all administrative mutations to the system audit table.
