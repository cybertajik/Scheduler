# Project Structure & Architecture Layout

```text
Scheduler/
├── .github/
│   └── pull_request_template.md     # Pull Request checklist & format template
├── ADR/                              # Architecture Decision Records
│   ├── 0001-tech-stack.md
│   ├── 0002-database-design.md
│   ├── 0003-rules-engine.md
│   ├── 0004-solver-design.md
│   ├── 0005-authentication.md
│   ├── 0006-api-architecture.md
│   ├── 0007-frontend-architecture.md
│   ├── 0008-background-jobs.md
│   └── 0009-deployment.md
├── backend/                          # FastAPI Application Service
│   ├── alembic/                      # Alembic schema migrations
│   ├── app/
│   │   ├── api/v1/                   # REST API controllers & auth dependencies
│   │   ├── core/                     # Database, Security, Celery initialization
│   │   ├── models/                   # SQLAlchemy ORM database models
│   │   ├── rules/                    # Hard & soft constraint evaluation framework
│   │   ├── services/                 # Business logic service layer
│   │   ├── solver/                   # Google OR-Tools CP-SAT integration
│   │   └── tasks/                    # Celery task definitions
│   ├── tests/                        # 44 automated Pytest unit/integration tests
│   ├── Dockerfile
│   └── requirements.txt
├── docs/                             # Full technical documentation suite (22 manuals)
├── frontend/                         # React TypeScript Vite Single-Page Application
│   ├── src/
│   │   ├── components/               # UI layout & schedule editor components
│   │   ├── context/                  # AuthContext session state
│   │   ├── hooks/                    # useScheduleHistory hook
│   │   ├── pages/                    # React page views
│   │   ├── services/                 # Typed API client services
│   │   └── types/                    # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
├── .gitignore
├── CHANGELOG.md
├── CONTRIBUTING.md
├── docker-compose.yml
├── LICENSE
├── README.md
└── SECURITY.md
```
