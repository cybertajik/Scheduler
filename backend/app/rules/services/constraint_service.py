import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import WorkerConstraint
from app.rules.dtos import ConstraintDTO
from app.rules.enums import RuleType, RuleCategory
from app.rules.services.validation_service import RuleValidationService

class WorkerConstraintService:
    """
    CRUD operations for Worker Constraints with pre-save validations.
    """

    @staticmethod
    def create_constraint(db: Session, dto: ConstraintDTO) -> WorkerConstraint:
        is_valid, err_msg = RuleValidationService.validate_constraint_data(
            rule_type=dto.rule_type,
            category=dto.category,
            start_date=dto.start_date,
            end_date=dto.end_date,
            priority=dto.priority,
            metadata_json=dto.metadata_json
        )
        if not is_valid:
            raise HTTPException(status_code=400, detail=err_msg)

        constraint = WorkerConstraint(
            worker_id=uuid.UUID(dto.worker_id),
            constraint_type=dto.rule_type.value,
            start_date=dto.start_date,
            end_date=dto.end_date,
            priority=dto.priority,
            enabled=dto.enabled,
            metadata_json=dto.metadata_json
        )
        db.add(constraint)
        db.commit()
        db.refresh(constraint)
        return constraint

    @staticmethod
    def get_constraints_by_worker(db: Session, worker_id: str) -> List[WorkerConstraint]:
        return db.query(WorkerConstraint).filter(
            WorkerConstraint.worker_id == uuid.UUID(worker_id)
        ).all()
