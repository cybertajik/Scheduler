# Docker Specifications & Environments

## Container Specifications

### 1. `scheduler_frontend` (Nginx + React)
* **Base Image**: `nginx:alpine` (Production Stage)
* **Build Stage**: `node:20-alpine` (Vite Build)
* **Exposed Port**: `80`

### 2. `scheduler_backend` (FastAPI API Server)
* **Base Image**: `python:3.12-slim`
* **Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
* **Exposed Port**: `8000`

### 3. `scheduler_celery_worker` (Celery Task Runner)
* **Base Image**: `python:3.12-slim`
* **Command**: `celery -A app.core.celery_app.celery_app worker --loglevel=info`

### 4. `scheduler_postgres` (Relational Database)
* **Base Image**: `postgres:16-alpine`
* **Volume**: `postgres_data:/var/lib/postgresql/data`

### 5. `scheduler_redis` (Broker & Token Blacklist Cache)
* **Base Image**: `redis:7-alpine`
