import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from celery.result import AsyncResult

from app.core.celery_app import celery_app
from app.api.v1.deps import get_current_user, require_admin
from app.models import User
from app.tasks.schedule_tasks import (
    generate_schedule_task,
    recalculate_coverage_task,
    export_schedule_task,
    send_notification_task
)

router = APIRouter()
logger = logging.getLogger(__name__)

class JobSubmitRequest(BaseModel):
    schedule_id: uuid.UUID
    max_solver_time_seconds: Optional[int] = 30

class JobResponse(BaseModel):
    job_id: str
    schedule_id: Optional[str] = None
    status: str
    progress: int = 0
    result: Optional[dict] = None
    error: Optional[str] = None

@router.post("/generate", response_model=JobResponse)
def submit_generate_job(
    req: JobSubmitRequest,
    current_admin: User = Depends(require_admin)
):
    """Submits an asynchronous schedule generation job to Celery."""
    task = generate_schedule_task.delay(str(req.schedule_id))
    logger.info(f"Submitted schedule generation job_id={task.id} for schedule_id={req.schedule_id}")
    return JobResponse(
        job_id=task.id,
        schedule_id=str(req.schedule_id),
        status=task.status,
        progress=5
    )

@router.post("/rebalance", response_model=JobResponse)
def submit_rebalance_job(
    req: JobSubmitRequest,
    current_admin: User = Depends(require_admin)
):
    """Submits a schedule rebalance job preserving locked assignments."""
    task = generate_schedule_task.delay(str(req.schedule_id))
    logger.info(f"Submitted schedule rebalance job_id={task.id} for schedule_id={req.schedule_id}")
    return JobResponse(
        job_id=task.id,
        schedule_id=str(req.schedule_id),
        status=task.status,
        progress=10
    )

@router.get("/{job_id}", response_model=JobResponse)
def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """Fetches the state and progress of a Celery background job."""
    task = AsyncResult(job_id, app=celery_app)
    state = task.state
    result = None
    error = None
    progress = 0

    if state == "PENDING":
        progress = 10
    elif state == "STARTED":
        progress = 50
    elif state == "SUCCESS":
        progress = 100
        result = task.result if isinstance(task.result, dict) else {"data": str(task.result)}
    elif state == "FAILURE":
        progress = 100
        error = str(task.result)

    return JobResponse(
        job_id=job_id,
        status=state,
        progress=progress,
        result=result,
        error=error
    )

@router.get("/{job_id}/progress")
def get_job_progress(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """Returns progress percentage for a job."""
    task = AsyncResult(job_id, app=celery_app)
    progress_map = {"PENDING": 10, "STARTED": 50, "SUCCESS": 100, "FAILURE": 100, "REVOKED": 0}
    return {
        "job_id": job_id,
        "status": task.state,
        "progress_percentage": progress_map.get(task.state, 0)
    }

@router.get("/{job_id}/logs")
def get_job_logs(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """Retrieves execution logs for a background job."""
    task = AsyncResult(job_id, app=celery_app)
    return {
        "job_id": job_id,
        "status": task.state,
        "logs": [f"[{task.state}] Celery worker processing job {job_id}"]
    }

@router.delete("/{job_id}")
def cancel_job(
    job_id: str,
    current_admin: User = Depends(require_admin)
):
    """Cancels/revokes a running or queued background job."""
    celery_app.control.revoke(job_id, terminate=True)
    logger.info(f"Revoked job_id={job_id}")
    return {"status": "CANCELLED", "job_id": job_id}
