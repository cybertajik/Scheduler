from datetime import date
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from fastapi import HTTPException
from app.models import Schedule, ScheduleStatus, ShiftInstance, Assignment
from app.schemas.schedule import ScheduleCreate

class ScheduleService:
    @staticmethod
    def get_allowed_periods() -> List[tuple[int, int]]:
        """Returns list of (year, month) tuples for last month, current month, and next 6 months (8 months total)."""
        today = date.today()
        p_month = 12 if today.month == 1 else today.month - 1
        p_year = today.year - 1 if today.month == 1 else today.year

        periods = []
        curr_m, curr_y = p_month, p_year
        for _ in range(8):  # 1 past + 1 current + 6 future
            periods.append((curr_y, curr_m))
            curr_m += 1
            if curr_m > 12:
                curr_m = 1
                curr_y += 1
        return periods

    @staticmethod
    def get_all_schedules(db: Session) -> List[Schedule]:
        """Fetch schedules strictly within allowed window (last month, current month, next 6 months forward).
        Auto-creates missing periods and deduplicates existing ones."""
        periods = ScheduleService.get_allowed_periods()
        allowed_set = set(periods)
        today = date.today()

        # Load all schedules in allowed window
        existing = db.query(Schedule).all()

        # Deduplicate: keep one schedule per (year, month), prefer PUBLISHED over DRAFT
        existing_map: dict[tuple[int, int], Schedule] = {}
        duplicates_to_delete: list[Schedule] = []
        for s in existing:
            key = (s.year, s.month)
            if key in existing_map:
                # Keep the one that has more data (published / has assignments / was generated)
                keeper = existing_map[key]
                if s.status == ScheduleStatus.PUBLISHED and keeper.status != ScheduleStatus.PUBLISHED:
                    duplicates_to_delete.append(keeper)
                    existing_map[key] = s
                elif s.generated_at and not keeper.generated_at:
                    duplicates_to_delete.append(keeper)
                    existing_map[key] = s
                else:
                    duplicates_to_delete.append(s)
            else:
                existing_map[key] = s

        # Delete duplicates
        for dup in duplicates_to_delete:
            db.delete(dup)
        if duplicates_to_delete:
            db.commit()

        # Auto-create missing periods
        created_any = False
        for yr, mo in periods:
            if (yr, mo) not in existing_map:
                is_published = (yr < today.year or (yr == today.year and mo < today.month))
                new_sched = Schedule(
                    id=uuid.uuid4(),
                    year=yr,
                    month=mo,
                    status=ScheduleStatus.PUBLISHED if is_published else ScheduleStatus.DRAFT,
                )
                db.add(new_sched)
                created_any = True

        if created_any:
            db.commit()

        # Query and return only allowed window with eager loading
        query = db.query(Schedule).options(
            selectinload(Schedule.shift_instances).selectinload(ShiftInstance.assignments).selectinload(Assignment.worker),
            selectinload(Schedule.shift_instances).selectinload(ShiftInstance.shift_type)
        )

        schedules = query.all()
        filtered = [s for s in schedules if (s.year, s.month) in allowed_set]
        filtered.sort(key=lambda s: (s.year, s.month), reverse=True)
        return filtered

    @staticmethod
    def get_schedule_by_id(db: Session, schedule_id: uuid.UUID) -> Schedule:
        schedule = db.query(Schedule).options(
            selectinload(Schedule.shift_instances).selectinload(ShiftInstance.assignments).selectinload(Assignment.worker),
            selectinload(Schedule.shift_instances).selectinload(ShiftInstance.shift_type)
        ).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")
        return schedule

    @staticmethod
    def create_schedule(db: Session, schedule_in: ScheduleCreate, generated_by_id: Optional[uuid.UUID] = None) -> Schedule:
        # Check for existing schedule for this month/year
        existing = db.query(Schedule).filter(
            Schedule.year == schedule_in.year,
            Schedule.month == schedule_in.month
        ).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"A schedule for {schedule_in.month}/{schedule_in.year} already exists"
            )

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
