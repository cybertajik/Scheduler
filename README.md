# Staff Scheduler Monorepo Scaffold

A complete, production-ready starter repository for an internal staff scheduling application designed for up to 50 employees using **React + TypeScript**, **FullCalendar**, **Tailwind CSS**, **FastAPI (Python)**, **PostgreSQL**, **Google OR-Tools (CP-SAT)**, **Celery**, **Redis**, and **Docker Compose**.

---

## 🚀 Quick Start (Run Locally with One Command)

### 1. Clone & Setup Environment
```bash
cp .env.example .env
```

### 2. Launch Docker Stack
```bash
docker compose up -d --build
```

That's it! All 5 services will automatically launch and link together:
- **Frontend SPA**: [http://localhost](http://localhost) (or port 80/5173)
- **FastAPI OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Endpoint**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 🔑 Default Admin Credentials

Upon initial container startup, a default administrator account is seeded automatically:

- **Email**: `admin@scheduler.internal`
- **Password**: `Admin123!`

---

## 📁 Repository Structure

```text
.
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                   # FastAPI Application Entry
│   │   ├── core/                     # Config, Security, DB, Celery
│   │   ├── models/                   # SQLAlchemy Models (User, Worker, Shift, Constraint, Schedule)
│   │   ├── schemas/                  # Pydantic Validation Schemas
│   │   ├── api/v1/                   # REST API Routers
│   │   ├── services/                 # Business & OR-Tools Solver Logic
│   │   └── tasks/                    # Celery Background Jobs
│   └── tests/                        # Pytest Test Suite
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── App.tsx                   # Protected Routes & Auth Layout
        ├── api/                      # Axios Client Setup
        ├── context/                  # AuthContext Provider
        ├── components/               # Navbar & Common UI
        └── pages/                    # Dashboard, Schedules, Workers, Rules Pages
```

---

## 🧩 Features Included

- **Authentication & RBAC**: JWT Access Tokens, bcrypt password hashing, and role checks (`ADMIN` vs `WORKER`).
- **Google OR-Tools CP-SAT Solver**: Solves staff scheduling constraints (headcount, max 1 shift/day, unavailabilities, vacations, shift restrictions, no-weekends, post-night-shift rest rule).
- **Celery + Redis Task Queue**: Asynchronous background schedule solver runner.
- **FullCalendar React Grid**: Visualizes assigned shifts on interactive monthly/weekly calendars.
- **PostgreSQL Database**: Relational schema with index optimization and soft delete flags.
