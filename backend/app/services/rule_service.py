import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import WorkerConstraint
from app.schemas.rule import ConstraintCreate

class RuleService:
    @staticmethod
    def get_constraints(db: Session, worker_id: Optional[uuid.UUID] = None) -> List[WorkerConstraint]:
        query = db.query(WorkerConstraint)
        if worker_id:
            query = query.filter(WorkerConstraint.worker_id == worker_id)
        return query.all()

    @staticmethod
    def create_constraint(db: Session, constraint_in: ConstraintCreate) -> WorkerConstraint:
        constraint = WorkerConstraint(
            worker_id=constraint_in.worker_id,
            constraint_type=constraint_in.constraint_type,
            start_date=constraint_in.start_date,
            end_date=constraint_in.end_date,
            priority=constraint_in.priority,
            enabled=constraint_in.enabled,
            metadata_json=constraint_in.metadata_json
        )
        db.add(constraint)
        db.commit()
        db.refresh(constraint)
        return constraint
