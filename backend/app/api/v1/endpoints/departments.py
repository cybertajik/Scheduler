import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from app.core.database import get_db
from app.api.v1.deps import get_current_user, require_admin
from app.models import User, Department

router = APIRouter()

class DepartmentCreate(BaseModel):
    name: str
    description: str = ""

class DepartmentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None = None

@router.get("", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Department).all()

@router.post("", response_model=DepartmentResponse)
def create_department(dept_in: DepartmentCreate, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    existing = db.query(Department).filter(Department.name == dept_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department name already exists")
    dept = Department(name=dept_in.name, description=dept_in.description)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.get("/{dept_id}", response_model=DepartmentResponse)
def get_department(dept_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept

@router.patch("/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: uuid.UUID, update: DepartmentUpdate, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    if update.name is not None:
        dept.name = update.name
    if update.description is not None:
        dept.description = update.description
    db.commit()
    db.refresh(dept)
    return dept

@router.delete("/{dept_id}")
def delete_department(dept_id: uuid.UUID, db: Session = Depends(get_db), current_admin: User = Depends(require_admin)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted successfully"}
