from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Worker, ShiftType, WorkerConstraint, Schedule, ShiftInstance, Assignment
from app.rules.dtos import SchedulingContext, WorkerDTO, ShiftTypeDTO, AssignmentDTO, ConstraintDTO
from app.rules.enums import RuleType, RuleCategory

class ScheduleRuleService:
    """
    Orchestrates building a SchedulingContext from the PostgreSQL database.
    """

    @staticmethod
    def build_context_from_db(
        db: Session,
        start_date: date,
        end_date: date,
        schedule_id: Optional[str] = None
    ) -> SchedulingContext:
        # 1. Load Workers
        db_workers = db.query(Worker).filter(Worker.active == True).all()
        workers_dict = {}
        for w in db_workers:
            skill_ids = {str(s.id) for s in w.skills} if hasattr(w, 'skills') and w.skills else set()
            workers_dict[str(w.id)] = WorkerDTO(
                id=str(w.id),
                employee_number=w.employee_number,
                first_name=w.first_name,
                last_name=w.last_name,
                department_id=str(w.department_id),
                skill_ids=skill_ids,
                weekly_contract_hours=w.weekly_contract_hours,
                active=w.active
            )

        # 2. Load Shift Types
        db_shift_types = db.query(ShiftType).all()
        shift_types_dict = {}
        for st in db_shift_types:
            shift_types_dict[str(st.id)] = ShiftTypeDTO(
                id=str(st.id),
                name=st.name,
                color=st.color,
                start_time=st.start_time,
                end_time=st.end_time,
                duration=st.duration,
                is_night_shift=st.is_night_shift,
                requires_rest_day=st.requires_rest_day
            )

        # 3. Load Constraints
        db_constraints = db.query(WorkerConstraint).filter(
            WorkerConstraint.enabled == True,
            WorkerConstraint.end_date >= start_date,
            WorkerConstraint.start_date <= end_date
        ).all()
        constraints_list = []
        for c in db_constraints:
            try:
                r_type = RuleType(c.constraint_type.value if hasattr(c.constraint_type, 'value') else str(c.constraint_type))
            except ValueError:
                r_type = RuleType.VACATION

            constraints_list.append(ConstraintDTO(
                id=str(c.id),
                worker_id=str(c.worker_id),
                rule_type=r_type,
                category=RuleCategory.HARD,
                start_date=c.start_date,
                end_date=c.end_date,
                priority=c.priority,
                enabled=c.enabled,
                metadata_json=c.metadata_json
            ))

        # 4. Load Existing Assignments
        assignments_list = []
        if schedule_id:
            db_instances = db.query(ShiftInstance).filter(ShiftInstance.schedule_id == schedule_id).all()
            for inst in db_instances:
                for a in inst.assignments:
                    assignments_list.append(AssignmentDTO(
                        id=str(a.id),
                        shift_instance_id=str(inst.id),
                        worker_id=str(a.worker_id),
                        date=inst.date,
                        shift_type_id=str(inst.shift_type_id),
                        locked=a.locked
                    ))

        return SchedulingContext(
            start_date=start_date,
            end_date=end_date,
            workers=workers_dict,
            shift_types=shift_types_dict,
            existing_assignments=assignments_list,
            worker_constraints=constraints_list
        )
