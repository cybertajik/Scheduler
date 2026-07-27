import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import Schedule, ScheduleStatus, ShiftInstance, Assignment
from app.schemas.schedule import ScheduleCreate

class ScheduleService:
    @staticmethod
    def get_all_schedules(db: Session) -> List[Schedule]:
        return db.query(Schedule).order_by(Schedule.year.desc(), Schedule.month.desc()).all()

    @staticmethod
    def get_schedule_by_id(db: Session, schedule_id: uuid.UUID) -> Schedule:
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")
        return schedule

    @staticmethod
    def create_schedule(db: Session, schedule_in: ScheduleCreate, generated_by_id: Optional[uuid.UUID] = None) -> Schedule:
        schedule = Schedule(
            month=schedule_in.month,
            year=schedule_in.year,
            status=ScheduleStatus.DRAFT,
            generated_by=generated_by_id
        )
        db.add(schedule)
        db.flush()

        for s in schedule_in.shift_instances:
            instance = ShiftInstance(
                schedule_id=schedule.id,
                date=s.date,
                shift_type_id=s.shift_type_id,
                required_workers=s.required_workers
            )
            db.add(instance)

        db.commit()
        db.refresh(schedule)
        return schedule
