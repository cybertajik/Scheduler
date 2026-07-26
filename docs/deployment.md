# Deployment & Container Orchestration

## Docker Compose Topology

The production environment consists of 5 containers defined in `docker-compose.yml`:

```text
                                [ Internet / Admin Browser ]
                                             │
                                             ▼
                                  [ scheduler_frontend ]
                                     (Nginx - Port 80)
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │ /api/ proxy                               │ Static HTML/JS
                       ▼                                           ▼
             [ scheduler_backend ]                        [ React Single Page App ]
              (FastAPI - Port 8000)
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
[ scheduler_postgres ]     [ scheduler_redis ]
  (PostgreSQL 16)            (Redis Broker)
                                     ▲
                                     │ Dequeue
                           [ scheduler_celery_worker ]
                            (Celery OR-Tools Worker)
```

---

## Deployment Commands

### Build & Deploy
```bash
docker-compose up -d --build
```

### Check Container Status
```bash
docker-compose ps
```

### View Service Logs
```bash
docker-compose logs -f backend celery_worker
```
