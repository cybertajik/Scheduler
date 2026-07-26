import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import User, UserRole, Worker, Department
from app.schemas.worker import WorkerCreate, WorkerUpdate
from app.core.security import get_password_hash

class WorkerService:
    @staticmethod
    def get_all_workers(db: Session) -> List[Worker]:
        return db.query(Worker).filter(Worker.active == True).all()

    @staticmethod
    def create_worker(db: Session, worker_in: WorkerCreate) -> Worker:
        # Check existing worker employee number
        existing_emp = db.query(Worker).filter(Worker.employee_number == worker_in.employee_number).first()
        if existing_emp:
            raise HTTPException(status_code=400, detail="Employee number already exists")

        # Get or create default department if not provided
        dept_id = worker_in.department_id
        if not dept_id:
            default_dept = db.query(Department).first()
            if not default_dept:
                default_dept = Department(name="General", description="General Department")
                db.add(default_dept)
                db.flush()
            dept_id = default_dept.id

        worker = Worker(
            employee_number=worker_in.employee_number,
            department_id=dept_id,
            first_name=worker_in.first_name,
            last_name=worker_in.last_name,
            email=worker_in.email,
            phone=worker_in.phone,
            weekly_contract_hours=worker_in.weekly_contract_hours,
            active=True
        )
        db.add(worker)
        db.commit()
        db.refresh(worker)
        return worker

    @staticmethod
    def update_worker(db: Session, worker_id: str, update_data: WorkerUpdate) -> Worker:
        worker = db.query(Worker).filter(Worker.id == worker_id).first()
        if not worker:
            raise HTTPException(status_code=404, detail="Worker not found")
        
        if update_data.first_name is not None:
            worker.first_name = update_data.first_name
        if update_data.last_name is not None:
            worker.last_name = update_data.last_name
        if update_data.weekly_contract_hours is not None:
            worker.weekly_contract_hours = update_data.weekly_contract_hours
        if update_data.active is not None:
            worker.active = update_data.active

        db.commit()
        db.refresh(worker)
        return worker
