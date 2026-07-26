import os
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from redis import Redis
from celery.result import AsyncResult
from tasks import celery_app, process_background_job

app = FastAPI(title="Scheduler Dev Server API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://appuser:appsecret@db:5432/appdb")
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

class TaskRequest(BaseModel):
    job_name: str
    duration_seconds: int = 3

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "FastAPI Backend",
        "version": "1.0.0"
    }

@app.get("/api/health")
def check_health():
    db_status = False
    redis_status = False
    db_version = ""
    redis_ping = ""

    # Test PostgreSQL
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            db_version = result.scalar()
            db_status = True
    except Exception as e:
        db_version = str(e)

    # Test Redis
    try:
        r = Redis.from_url(REDIS_URL, socket_timeout=2)
        if r.ping():
            redis_status = True
            redis_ping = "PONG"
    except Exception as e:
        redis_ping = str(e)

    return {
        "status": "healthy" if (db_status and redis_status) else "degraded",
        "postgresql": {
            "connected": db_status,
            "info": db_version
        },
        "redis": {
            "connected": redis_status,
            "response": redis_ping
        },
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    }

@app.post("/api/tasks")
def trigger_task(req: TaskRequest):
    task = process_background_job.delay(req.job_name, req.duration_seconds)
    return {
        "task_id": task.id,
        "status": "PENDING",
        "job_name": req.job_name
    }

@app.get("/api/tasks/{task_id}")
def get_task_status(task_id: str):
    res = AsyncResult(task_id, app=celery_app)
    if res.ready():
        return {
            "task_id": task_id,
            "status": res.status,
            "result": res.result
        }
    return {
        "task_id": task_id,
        "status": res.status,
        "result": None
    }
