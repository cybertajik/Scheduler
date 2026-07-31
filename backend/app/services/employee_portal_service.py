import uuid
import io
import csv
from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import User, Worker, Schedule, Assignment, ShiftInstance, ShiftType, Department
from app.models.employee_portal import VacationRequest, ShiftSwapRequest, AvailabilitySubmission, UserNotification
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
    EmployeeProfileOut,
    UserNotificationOut
)
from app.core.security import get_password_hash

class EmployeePortalService:
    """
    Service for Employee Self-Service Portal handling personalized schedules, vacations, swaps, and profile management.
    """

    @staticmethod
    def _get_worker_for_user(db: Session, user: User) -> Worker:
        worker = db.query(Worker).filter(Worker.user_id == user.id).first()
        if not worker:
            # Fallback: Match by email or create matching worker
            worker = db.query(Worker).filter(Worker.email == user.email).first()
        if not worker:
            dept = db.query(Department).first()
            if not dept:
                dept = Department(id=uuid.uuid4(), name="General")
                db.add(dept)
                db.flush()

            worker = Worker(
                id=uuid.uuid4(),
                user_id=user.id,
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                department_id=dept.id,
                employee_number=f"EMP-{str(user.id)[:6].upper()}",
                weekly_contract_hours=40.0
            )
            db.add(worker)
            db.commit()
            db.refresh(worker)

        return worker

    @staticmethod
    def get_employee_dashboard(db: Session, user: User) -> EmployeeDashboardOut:
        worker = EmployeePortalService._get_worker_for_user(db, user)
        dept = db.query(Department).filter(Department.id == worker.department_id).first()
        dept_name = dept.name if dept else "General"

        # Fetch upcoming shifts for this worker
        asgns = worker.assignments
        shifts_out: List[MyScheduleShiftOut] = []
        tot_worked_hours = len(asgns) * 8.0
        night_cnt = 0
        weekend_cnt = 0

        for a in asgns:
            inst = a.shift_instance
            if inst:
                st = inst.shift_type
                st_name = st.name if st else "Shift"
                st_color = st.color if st else "#3B82F6"
                is_night = st.is_night_shift if st else False
                if is_night:
                    night_cnt += 1
                if inst.date and inst.date.weekday() >= 5:
                    weekend_cnt += 1

                shifts_out.append(MyScheduleShiftOut(
                    assignment_id=str(a.id),
                    shift_instance_id=str(inst.id),
                    date=str(inst.date).split(' ')[0],
                    shift_type_id=str(inst.shift_type_id),
                    shift_name=st_name,
                    color=st_color,
                    is_night_shift=is_night,
                    locked=a.locked,
                    notes=a.notes
                ))

        # Recent notifications
        notifs = db.query(UserNotification).filter(UserNotification.user_id == user.id).order_by(UserNotification.created_at.desc()).limit(5).all()
        notif_list = [
            {"id": str(n.id), "title": n.title, "message": n.message, "is_read": n.is_read, "created_at": n.created_at.isoformat()}
            for n in notifs
        ]

        return EmployeeDashboardOut(
            worker_id=str(worker.id),
            worker_name=f"{worker.first_name} {worker.last_name}",
            employee_number=worker.employee_number or "EMP-001",
            department_name=dept_name,
            weekly_contract_hours=worker.weekly_contract_hours,
            worked_hours_this_month=tot_worked_hours,
            overtime_hours_this_month=max(0.0, tot_worked_hours - 160.0),
            night_shifts_this_month=night_cnt,
            weekend_shifts_this_month=weekend_cnt,
            remaining_vacation_days=18,
            upcoming_shifts=shifts_out[:10],
            recent_notifications=notif_list
        )

    @staticmethod
    def get_my_schedule(db: Session, user: User) -> List[MyScheduleShiftOut]:
        worker = EmployeePortalService._get_worker_for_user(db, user)
        asgns = worker.assignments
        results = []

        for a in asgns:
            inst = a.shift_instance
            if inst:
                st = inst.shift_type
                results.append(MyScheduleShiftOut(
                    assignment_id=str(a.id),
                    shift_instance_id=str(inst.id),
                    date=str(inst.date).split(' ')[0],
                    shift_type_id=str(inst.shift_type_id),
                    shift_name=st.name if st else "Shift",
                    color=st.color if st else "#3B82F6",
                    is_night_shift=st.is_night_shift if st else False,
                    locked=a.locked,
                    notes=a.notes
                ))

        return results

    @staticmethod
    def submit_vacation_request(db: Session, user: User, data: VacationRequestCreate) -> VacationRequestOut:
        worker = EmployeePortalService._get_worker_for_user(db, user)
        s_date = datetime.strptime(data.start_date, "%Y-%m-%d").date()
        e_date = datetime.strptime(data.end_date, "%Y-%m-%d").date()
        tot_days = (e_date - s_date).days + 1

        vac = VacationRequest(
            id=uuid.uuid4(),
            worker_id=worker.id,
            start_date=s_date,
            end_date=e_date,
            reason=data.reason,
            status="PENDING"
        )
        db.add(vac)
        db.commit()
        db.refresh(vac)

        return VacationRequestOut(
            id=str(vac.id),
            worker_id=str(worker.id),
            worker_name=f"{worker.first_name} {worker.last_name}",
            start_date=str(vac.start_date),
            end_date=str(vac.end_date),
            total_days=tot_days,
            reason=vac.reason,
            status=vac.status,
            admin_notes=vac.admin_notes,
            created_at=vac.created_at.isoformat() if vac.created_at else ""
        )

    @staticmethod
    def get_vacation_requests(db: Session, user: User) -> List[VacationRequestOut]:
        worker = EmployeePortalService._get_worker_for_user(db, user)
        vacs = db.query(VacationRequest).filter(VacationRequest.worker_id == worker.id).order_by(VacationRequest.created_at.desc()).all()

        return [
            VacationRequestOut(
                id=str(v.id),
                worker_id=str(worker.id),
                worker_name=f"{worker.first_name} {worker.last_name}",
                start_date=str(v.start_date),
                end_date=str(v.end_date),
                total_days=(v.end_date - v.start_date).days + 1,
                reason=v.reason,
                status=v.status,
                admin_notes=v.admin_notes,
                created_at=v.created_at.isoformat() if v.created_at else ""
            )
            for v in vacs
        ]

    @staticmethod
    def submit_shift_swap(db: Session, user: User, data: ShiftSwapCreate) -> ShiftSwapOut:
        worker = EmployeePortalService._get_worker_for_user(db, user)
        target_worker = db.query(Worker).filter(Worker.id == uuid.UUID(data.target_worker_id)).first()
        if not target_worker:
            raise HTTPException(status_code=404, detail="Target colleague not found.")

        req_asgn = db.query(Assignment).filter(Assignment.id == uuid.UUID(data.requestor_assignment_id)).first()
        if not req_asgn:
            raise HTTPException(status_code=404, detail="Assignment not found.")

        swap = ShiftSwapRequest(
            id=uuid.uuid4(),
            requestor_worker_id=worker.id,
            target_worker_id=target_worker.id,
            requestor_assignment_id=req_asgn.id,
            target_assignment_id=uuid.UUID(data.target_assignment_id) if data.target_assignment_id else None,
            status="PROPOSED",
            notes=data.notes
        )
        db.add(swap)
        db.commit()
        db.refresh(swap)

        req_inst = req_asgn.shift_instance
        req_shift_name = req_inst.shift_type.name if req_inst and req_inst.shift_type else "Shift"
        req_date = str(req_inst.date).split(' ')[0] if req_inst else ""

        return ShiftSwapOut(
            id=str(swap.id),
            requestor_worker_id=str(worker.id),
            requestor_worker_name=f"{worker.first_name} {worker.last_name}",
            target_worker_id=str(target_worker.id),
            target_worker_name=f"{target_worker.first_name} {target_worker.last_name}",
            requestor_assignment_id=str(req_asgn.id),
            requestor_shift_date=req_date,
            requestor_shift_name=req_shift_name,
            status=swap.status,
            notes=swap.notes,
            created_at=swap.created_at.isoformat() if swap.created_at else ""
        )

    @staticmethod
    def get_shift_swaps(db: Session, user: User) -> List[ShiftSwapOut]:
        worker = EmployeePortalService._get_worker_for_user(db, user)
        swaps = db.query(ShiftSwapRequest).filter(
            (ShiftSwapRequest.requestor_worker_id == worker.id) | (ShiftSwapRequest.target_worker_id == worker.id)
        ).order_by(ShiftSwapRequest.created_at.desc()).all()

        results = []
        for s in swaps:
            req_w = s.requestor_worker
            tgt_w = s.target_worker
            req_inst = s.requestor_assignment.shift_instance if s.requestor_assignment else None

            results.append(ShiftSwapOut(
                id=str(s.id),
                requestor_worker_id=str(s.requestor_worker_id),
                requestor_worker_name=f"{req_w.first_name} {req_w.last_name}" if req_w else "Requestor",
                target_worker_id=str(s.target_worker_id),
                target_worker_name=f"{tgt_w.first_name} {tgt_w.last_name}" if tgt_w else "Colleague",
                requestor_assignment_id=str(s.requestor_assignment_id),
                requestor_shift_date=str(req_inst.date).split(' ')[0] if req_inst else "",
                requestor_shift_name=req_inst.shift_type.name if req_inst and req_inst.shift_type else "Shift",
                status=s.status,
                notes=s.notes,
                created_at=s.created_at.isoformat() if s.created_at else ""
            ))

        return results

    @staticmethod
    def submit_availability(db: Session, user: User, data: AvailabilitySubmissionCreate) -> AvailabilitySubmissionOut:
        worker = EmployeePortalService._get_worker_for_user(db, user)
        dt = datetime.strptime(data.date, "%Y-%m-%d").date()

        avail = AvailabilitySubmission(
            id=uuid.uuid4(),
            worker_id=worker.id,
            date=dt,
            availability_type=data.availability_type,
            shift_type_id=uuid.UUID(data.shift_type_id) if data.shift_type_id else None,
            notes=data.notes
        )
        db.add(avail)
        db.commit()
        db.refresh(avail)

        st = db.query(ShiftType).filter(ShiftType.id == avail.shift_type_id).first() if avail.shift_type_id else None

        return AvailabilitySubmissionOut(
            id=str(avail.id),
            worker_id=str(worker.id),
            date=str(avail.date),
            availability_type=avail.availability_type,
            shift_name=st.name if st else None,
            notes=avail.notes
        )

    @staticmethod
    def get_availability(db: Session, user: User) -> List[AvailabilitySubmissionOut]:
        worker = EmployeePortalService._get_worker_for_user(db, user)
        items = db.query(AvailabilitySubmission).filter(AvailabilitySubmission.worker_id == worker.id).order_by(AvailabilitySubmission.date.desc()).all()

        results = []
        for item in items:
            st = db.query(ShiftType).filter(ShiftType.id == item.shift_type_id).first() if item.shift_type_id else None
            results.append(AvailabilitySubmissionOut(
                id=str(item.id),
                worker_id=str(worker.id),
                date=str(item.date),
                availability_type=item.availability_type,
                shift_name=st.name if st else None,
                notes=item.notes
            ))

        return results

    @staticmethod
    def update_profile(db: Session, user: User, data: EmployeeProfileUpdate) -> EmployeeProfileOut:
        worker = EmployeePortalService._get_worker_for_user(db, user)
        if data.phone is not None:
            worker.phone = data.phone
        if data.email is not None:
            user.email = data.email
            worker.email = data.email
        if data.new_password:
            user.password_hash = get_password_hash(data.new_password)

        db.commit()
        db.refresh(user)
        db.refresh(worker)

        dept = db.query(Department).filter(Department.id == worker.department_id).first()

        return EmployeeProfileOut(
            user_id=str(user.id),
            worker_id=str(worker.id),
            first_name=user.first_name,
            last_name=user.last_name,
            employee_number=worker.employee_number or "EMP-001",
            email=user.email,
            phone=worker.phone,
            department_name=dept.name if dept else "General",
            hire_date=str(worker.hire_date) if worker.hire_date else None,
            weekly_contract_hours=worker.weekly_contract_hours
        )

    @staticmethod
    def export_personal_schedule_csv(db: Session, user: User) -> str:
        shifts = EmployeePortalService.get_my_schedule(db, user)
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(["Date", "Shift Name", "Start Time", "End Time", "Duration (h)", "Night Shift", "Locked", "Notes"])
        for s in shifts:
            writer.writerow([
                s.date, s.shift_name, s.start_time, s.end_time, s.duration,
                "YES" if s.is_night_shift else "NO", "YES" if s.locked else "NO", s.notes or ""
            ])

        return output.getvalue()
