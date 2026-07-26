import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import ShiftType
from app.schemas.shift import ShiftTypeCreate

class ShiftTypeService:
    @staticmethod
    def get_all_shift_types(db: Session) -> List[ShiftType]:
        return db.query(ShiftType).all()

    @staticmethod
    def get_shift_type_by_id(db: Session, shift_type_id: uuid.UUID) -> ShiftType:
        shift_type = db.query(ShiftType).filter(ShiftType.id == shift_type_id).first()
        if not shift_type:
            raise HTTPException(status_code=404, detail="Shift type not found")
        return shift_type

    @staticmethod
    def create_shift_type(db: Session, dto: ShiftTypeCreate) -> ShiftType:
        existing = db.query(ShiftType).filter(ShiftType.name == dto.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Shift type name already exists")

        shift_type = ShiftType(
            name=dto.name,
            color=dto.color,
            start_time=dto.start_time,
            end_time=dto.end_time,
            duration=dto.duration,
            is_night_shift=dto.is_night_shift,
            requires_rest_day=dto.requires_rest_day
        )
        db.add(shift_type)
        db.commit()
        db.refresh(shift_type)
        return shift_type

    @staticmethod
    def update_shift_type(db: Session, shift_type_id: uuid.UUID, data: dict) -> ShiftType:
        shift_type = ShiftTypeService.get_shift_type_by_id(db, shift_type_id)
        for key, val in data.items():
            if val is not None and hasattr(shift_type, key):
                setattr(shift_type, key, val)
        db.commit()
        db.refresh(shift_type)
        return shift_type

    @staticmethod
    def delete_shift_type(db: Session, shift_type_id: uuid.UUID) -> bool:
        shift_type = ShiftTypeService.get_shift_type_by_id(db, shift_type_id)
        db.delete(shift_type)
        db.commit()
        return True
