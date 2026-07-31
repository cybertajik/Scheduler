import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response, HTMLResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.schemas.employee_portal import (
    EmployeeDashboardOut,
    MyScheduleShiftOut,
    VacationRequestCreate,
    VacationRequestOut,
    ShiftSwapCreate,
    ShiftSwapOut,
    AvailabilitySubmissionCreate,
    AvailabilitySubmissionOut,
    EmployeeProfileUpdate,
    EmployeeProfileOut
)
from app.services.employee_portal_service import EmployeePortalService

router = APIRouter()

@router.get("/dashboard", response_model=EmployeeDashboardOut)
def get_employee_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return EmployeePortalService.get_employee_dashboard(db, current_user)

@router.get("/my-schedule", response_model=List[MyScheduleShiftOut])
def get_my_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return EmployeePortalService.get_my_schedule(db, current_user)

@router.post("/vacations", response_model=VacationRequestOut, status_code=status.HTTP_201_CREATED)
def submit_vacation_request(
    data: VacationRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return EmployeePortalService.submit_vacation_request(db, current_user, data)

@router.get("/vacations", response_model=List[VacationRequestOut])
def get_vacation_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return EmployeePortalService.get_vacation_requests(db, current_user)

@router.post("/swaps", response_model=ShiftSwapOut, status_code=status.HTTP_201_CREATED)
def submit_shift_swap(
    data: ShiftSwapCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return EmployeePortalService.submit_shift_swap(db, current_user, data)

@router.get("/swaps", response_model=List[ShiftSwapOut])
def get_shift_swaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return EmployeePortalService.get_shift_swaps(db, current_user)

@router.post("/availability", response_model=AvailabilitySubmissionOut, status_code=status.HTTP_201_CREATED)
def submit_availability(
    data: AvailabilitySubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return EmployeePortalService.submit_availability(db, current_user, data)

@router.get("/availability", response_model=List[AvailabilitySubmissionOut])
def get_availability(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return EmployeePortalService.get_availability(db, current_user)

@router.patch("/profile", response_model=EmployeeProfileOut)
def update_profile(
    data: EmployeeProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return EmployeePortalService.update_profile(db, current_user, data)

@router.get("/download-document")
def download_personal_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    csv_str = EmployeePortalService.export_personal_schedule_csv(db, current_user)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="my_schedule_report.csv"'}
    )
