import uuid
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import Assignment, ShiftInstance, Worker, AssignmentSource

class AssignmentService:
    @staticmethod
    def create_assignment(
        db: Session,
        shift_instance_id: uuid.UUID,
        worker_id: uuid.UUID,
        assigned_by: Optional[uuid.UUID] = None,
        notes: Optional[str] = None,
        locked: bool = False
    ) -> Assignment:
        # Check instance & worker exist
        instance = db.query(ShiftInstance).filter(ShiftInstance.id == shift_instance_id).first()
        if not instance:
            raise HTTPException(status_code=404, detail="Shift instance not found")

        worker = db.query(Worker).filter(Worker.id == worker_id).first()
        if not worker:
            raise HTTPException(status_code=404, detail="Worker not found")

        # Check existing assignment
        existing = db.query(Assignment).filter(
            Assignment.shift_instance_id == shift_instance_id,
            Assignment.worker_id == worker_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Worker is already assigned to this shift instance")

        assignment = Assignment(
            shift_instance_id=shift_instance_id,
            worker_id=worker_id,
            assigned_by=assigned_by,
            assignment_source=AssignmentSource.MANUAL,
            locked=locked,
            notes=notes
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return assignment

    @staticmethod
    def update_assignment(
        db: Session,
        assignment_id: uuid.UUID,
        worker_id: Optional[uuid.UUID] = None,
        locked: Optional[bool] = None,
        notes: Optional[str] = None
    ) -> Assignment:
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        if worker_id is not None:
            assignment.worker_id = worker_id
            assignment.assignment_source = AssignmentSource.MANUAL
        if locked is not None:
            assignment.locked = locked
        if notes is not None:
            assignment.notes = notes

        db.commit()
        db.refresh(assignment)
        return assignment

    @staticmethod
    def delete_assignment(db: Session, assignment_id: uuid.UUID) -> bool:
        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        db.delete(assignment)
        db.commit()
        return True
