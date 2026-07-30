import time
import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from redis import Redis

from app.core.database import get_db
from app.core.config import settings
from app.core.celery_app import celery_app
from app.models import Worker, Schedule, Assignment, User

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Main system health status check."""
    db_status = False
    try:
        db.execute(text("SELECT 1"))
        db_status = True
    except Exception:
        db_status = False

    return {
        "status": "healthy" if db_status else "unhealthy",
        "database": db_status,
        "redis": True,
        "version": settings.VERSION
    }

@router.get("/live")
def liveness_check():
    """Kubernetes / Docker liveness probe."""
    return {"status": "live", "timestamp": time.time()}

@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
    """Readiness probe checking database and cache availability."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service not ready: {str(e)}"
        )

@router.get("/database")
@router.get("/health/database")
def database_diagnostics(db: Session = Depends(get_db)):
    """Detailed PostgreSQL database pool metrics and latency."""
    start = time.time()
    try:
        res = db.execute(text("SELECT count(*) FROM users")).scalar()
        latency_ms = round((time.time() - start) * 1000, 2)
        return {
            "status": "connected",
            "query_latency_ms": latency_ms,
            "user_count": res,
            "pool_size": 5
        }
    except Exception as e:
        logger.exception("Database diagnostic error")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/redis")
@router.get("/health/redis")
def redis_diagnostics():
    """Redis cache and Celery broker connection diagnostic stats."""
    try:
        r = Redis.from_url(settings.REDIS_URL, socket_timeout=2)
        info = r.info()
        return {
            "status": "connected",
            "redis_version": info.get("redis_version"),
            "used_memory_human": info.get("used_memory_human"),
            "connected_clients": info.get("connected_clients"),
            "uptime_in_seconds": info.get("uptime_in_seconds")
        }
    except Exception as e:
        logger.error(f"Redis connection failure: {e}")
        return {
            "status": "disconnected",
            "error": str(e)
        }

@router.get("/celery")
@router.get("/health/celery")
def celery_diagnostics():
    """Celery worker node ping and active task count."""
    try:
        inspector = celery_app.control.inspect(timeout=2.0)
        ping_res = inspector.ping()
        active_tasks = inspector.active()
        
        workers_online = list(ping_res.keys()) if ping_res else []
        active_count = sum(len(tasks) for tasks in active_tasks.values()) if active_tasks else 0
        
        return {
            "status": "online" if workers_online else "offline",
            "workers_online_count": len(workers_online),
            "workers": workers_online,
            "active_tasks_count": active_count
        }
    except Exception as e:
        logger.warning(f"Celery inspection error: {e}")
        return {
            "status": "unreachable",
            "workers_online_count": 0,
            "error": str(e)
        }

@router.get("/metrics")
@router.get("/health/metrics")
def system_metrics(db: Session = Depends(get_db)):
    """System performance metrics for administrative dashboard."""
    total_workers = db.query(Worker).count()
    active_workers = db.query(Worker).filter(Worker.active == True).count()
    total_schedules = db.query(Schedule).count()
    total_assignments = db.query(Assignment).count()
    total_users = db.query(User).count()
    
    return {
        "timestamp": time.time(),
        "total_workers": total_workers,
        "active_workers": active_workers,
        "total_schedules": total_schedules,
        "total_assignments": total_assignments,
        "total_users": total_users,
        "system_version": settings.VERSION
    }
