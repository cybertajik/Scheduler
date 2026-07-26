import os
import time
from celery import Celery

REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="process_background_job")
def process_background_job(job_name: str, duration_seconds: int = 3):
    time.sleep(duration_seconds)
    return {
        "status": "COMPLETED",
        "job_name": job_name,
        "processed_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "message": f"Job '{job_name}' processed successfully by Celery worker!"
    }
