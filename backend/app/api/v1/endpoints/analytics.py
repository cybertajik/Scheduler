import uuid
import logging
from typing import List, Optional
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.schedule import Schedule, Assignment
from app.models.shift import ShiftInstance, ShiftType
from app.models.worker import Worker
from app.models.department import Department
from app.models.enums import ScheduleStatus

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Helper ──

def _get_schedule_or_404(db: Session, schedule_id: uuid.UUID) -> Schedule:
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule


# ── Overview KPIs ──

@router.get("/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return top-level workforce KPIs across all schedules in the system."""
    total_workers = db.query(func.count(Worker.id)).filter(Worker.active == True).scalar() or 0
    total_schedules = db.query(func.count(Schedule.id)).scalar() or 0
    published_schedules = db.query(func.count(Schedule.id)).filter(
        Schedule.status == ScheduleStatus.PUBLISHED
    ).scalar() or 0
    draft_schedules = db.query(func.count(Schedule.id)).filter(
        Schedule.status == ScheduleStatus.DRAFT
    ).scalar() or 0
    total_assignments = db.query(func.count(Assignment.id)).scalar() or 0

    # Overall coverage across all published schedules
    published_ids = (
        db.query(Schedule.id).filter(Schedule.status == ScheduleStatus.PUBLISHED).all()
    )
    published_ids = [r[0] for r in published_ids]

    total_required = 0
    total_assigned = 0
    if published_ids:
        instances = (
            db.query(ShiftInstance)
            .filter(ShiftInstance.schedule_id.in_(published_ids))
            .all()
        )
        total_required = sum(i.required_workers for i in instances)
        total_assigned = sum(len(i.assignments) for i in instances)

    coverage_pct = round((total_assigned / total_required * 100), 1) if total_required > 0 else 100.0

    return {
        "total_active_workers": total_workers,
        "total_schedules": total_schedules,
        "published_schedules": published_schedules,
        "draft_schedules": draft_schedules,
        "total_assignments": total_assignments,
        "overall_coverage_pct": coverage_pct,
        "total_required_slots": total_required,
        "total_filled_slots": total_assigned,
    }


# ── Per-schedule: Daily Coverage ──

@router.get("/{schedule_id}/coverage")
def get_daily_coverage(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return per-day required vs assigned worker counts for bar chart rendering."""
    schedule = _get_schedule_or_404(db, schedule_id)

    by_date: dict = defaultdict(lambda: {"required": 0, "assigned": 0})
    for instance in schedule.shift_instances:
        d = instance.date.isoformat()
        by_date[d]["required"] += instance.required_workers
        by_date[d]["assigned"] += len(instance.assignments)

    days = sorted(by_date.keys())
    result = []
    for d in days:
        required = by_date[d]["required"]
        assigned = by_date[d]["assigned"]
        pct = round((assigned / required * 100), 1) if required > 0 else 100.0
        result.append({
            "date": d,
            "required": required,
            "assigned": assigned,
            "coverage_pct": pct,
        })

    return {
        "schedule_id": str(schedule_id),
        "schedule_label": f"{schedule.month:02d}/{schedule.year}",
        "days": result,
    }


# ── Per-schedule: Worker Load ──

@router.get("/{schedule_id}/worker-load")
def get_worker_load(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return shift count per active worker for workload distribution analysis."""
    schedule = _get_schedule_or_404(db, schedule_id)

    worker_shifts: dict = defaultdict(int)
    worker_names: dict = {}

    for instance in schedule.shift_instances:
        for assignment in instance.assignments:
            wid = str(assignment.worker_id)
            worker_shifts[wid] += 1
            if wid not in worker_names:
                w = assignment.worker
                worker_names[wid] = f"{w.first_name} {w.last_name}" if w else wid

    # Include workers with 0 shifts
    all_workers = db.query(Worker).filter(Worker.active == True).all()
    for w in all_workers:
        wid = str(w.id)
        if wid not in worker_shifts:
            worker_shifts[wid] = 0
            worker_names[wid] = f"{w.first_name} {w.last_name}"

    total_days = len(set(i.date for i in schedule.shift_instances))

    data = sorted(
        [{"worker_id": wid, "name": worker_names[wid], "shifts": cnt}
         for wid, cnt in worker_shifts.items()],
        key=lambda x: x["shifts"],
        reverse=True,
    )

    # Compute average for reference line
    avg = round(sum(d["shifts"] for d in data) / len(data), 1) if data else 0

    return {
        "schedule_id": str(schedule_id),
        "average_shifts": avg,
        "total_days": total_days,
        "workers": data,
    }


# ── Per-schedule: Department Load ──

@router.get("/{schedule_id}/department-load")
def get_department_load(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return total assignments grouped by department for donut chart rendering."""
    schedule = _get_schedule_or_404(db, schedule_id)

    # Build a worker → department map
    workers = db.query(Worker).all()
    dept_names: dict = {}
    worker_dept: dict = {}
    for w in workers:
        worker_dept[str(w.id)] = str(w.department_id)

    depts = db.query(Department).all()
    for d in depts:
        dept_names[str(d.id)] = d.name

    dept_required: dict = defaultdict(int)
    dept_assigned: dict = defaultdict(int)

    # Required: attribute each shift instance slot to department(s) of assigned workers,
    # or just count total required slots per schedule (not dept-specific since
    # shift instances don't have a department FK directly). Use worker assignments.
    # Assigned: count assignments per department of the worker.
    for instance in schedule.shift_instances:
        for assignment in instance.assignments:
            dept_id = worker_dept.get(str(assignment.worker_id))
            if dept_id:
                dept_assigned[dept_id] += 1

    # For required we sum all required_workers per instance (schedule-wide, not dept-specific)
    total_required = sum(i.required_workers for i in schedule.shift_instances)

    result = []
    for dept_id, name in dept_names.items():
        assigned = dept_assigned.get(dept_id, 0)
        result.append({
            "department_id": dept_id,
            "department": name,
            "assigned": assigned,
        })

    result.sort(key=lambda x: x["assigned"], reverse=True)

    return {
        "schedule_id": str(schedule_id),
        "total_required": total_required,
        "total_assigned": sum(r["assigned"] for r in result),
        "departments": result,
    }


# ── Per-schedule: Shift Type Distribution ──

@router.get("/{schedule_id}/shift-distribution")
def get_shift_distribution(
    schedule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return instance and assignment counts per shift type for distribution charts."""
    schedule = _get_schedule_or_404(db, schedule_id)

    type_count: dict = defaultdict(lambda: {"instances": 0, "assigned": 0, "color": "#3B82F6"})
    type_names: dict = {}

    for instance in schedule.shift_instances:
        tid = str(instance.shift_type_id)
        type_count[tid]["instances"] += 1
        type_count[tid]["assigned"] += len(instance.assignments)
        if instance.shift_type:
            type_names[tid] = instance.shift_type.name
            type_count[tid]["color"] = instance.shift_type.color

    result = sorted(
        [
            {
                "shift_type_id": tid,
                "name": type_names.get(tid, tid),
                "instances": data["instances"],
                "assigned": data["assigned"],
                "color": data["color"],
            }
            for tid, data in type_count.items()
        ],
        key=lambda x: x["instances"],
        reverse=True,
    )

    return {"schedule_id": str(schedule_id), "shift_types": result}


# ── Cross-schedule summary table ──

@router.get("/schedules-summary")
def get_schedules_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all schedules with coverage statistics for the comparison table."""
    schedules = db.query(Schedule).order_by(Schedule.year.desc(), Schedule.month.desc()).all()

    result = []
    for s in schedules:
        total_required = sum(i.required_workers for i in s.shift_instances)
        total_assigned = sum(len(i.assignments) for i in s.shift_instances)
        coverage = round((total_assigned / total_required * 100), 1) if total_required > 0 else 100.0
        result.append({
            "id": str(s.id),
            "month": s.month,
            "year": s.year,
            "status": s.status.value,
            "total_instances": len(s.shift_instances),
            "total_required": total_required,
            "total_assigned": total_assigned,
            "coverage_pct": coverage,
            "solver_score": s.solver_score,
            "generated_at": s.generated_at.isoformat() if s.generated_at else None,
        })

    return {"schedules": result}
