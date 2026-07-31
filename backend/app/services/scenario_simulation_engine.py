import uuid
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models import Worker, ShiftType
from app.models.sandbox import SandboxSchedule, SandboxShiftInstance, SandboxAssignment, SandboxVersion
from app.schemas.sandbox import SandboxSimulationRequest

class ScenarioSimulationEngine:
    """
    Engine for simulating scenario planning events inside isolated sandbox schedules.
    """

    @staticmethod
    def run_simulation(
        db: Session,
        sandbox_id: uuid.UUID,
        req: SandboxSimulationRequest,
        author_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        sandbox = db.query(SandboxSchedule).filter(SandboxSchedule.id == sandbox_id).first()
        if not sandbox:
            raise ValueError("Sandbox schedule not found.")

        scenario = req.scenario_type.upper()
        affected_count = 0
        details = ""

        if scenario == "SICK_CALL":
            affected_count, details = ScenarioSimulationEngine._simulate_sick_call(db, sandbox, req)
        elif scenario in ["VACATION", "VACATION_REQUEST"]:
            affected_count, details = ScenarioSimulationEngine._simulate_vacation(db, sandbox, req)
        elif scenario == "STAFF_SHORTAGE":
            affected_count, details = ScenarioSimulationEngine._simulate_staff_shortage(db, sandbox, req)
        elif scenario == "EXTRA_STAFF":
            affected_count, details = ScenarioSimulationEngine._simulate_extra_staff(db, sandbox, req)
        else:
            affected_count = 1
            details = f"Custom scenario '{scenario}' applied to sandbox schedule."

        # Update Sandbox Status & Params
        sandbox.status = "SIMULATED"
        sandbox.scenario_type = scenario
        sandbox.scenario_params = {
            "employee_id": req.employee_id,
            "dates": req.dates,
            "rule_type": req.rule_type,
            "notes": req.notes
        }
        sandbox.version += 1

        # Create Version History Record
        version_rec = SandboxVersion(
            sandbox_id=sandbox.id,
            version_number=sandbox.version,
            change_description=f"Simulation '{scenario}': {details}",
            author_id=author_id
        )
        db.add(version_rec)
        db.commit()
        db.refresh(sandbox)

        return {
            "sandbox_id": str(sandbox.id),
            "status": sandbox.status,
            "version": sandbox.version,
            "scenario_type": scenario,
            "affected_assignments_count": affected_count,
            "details": details
        }

    @staticmethod
    def _simulate_sick_call(
        db: Session,
        sandbox: SandboxSchedule,
        req: SandboxSimulationRequest
    ) -> (int, str):
        if not req.employee_id or not req.dates:
            return 0, "Missing employee_id or dates for sick call simulation."

        worker = db.query(Worker).filter(Worker.id == req.employee_id).first()
        worker_name = f"{worker.first_name} {worker.last_name}" if worker else req.employee_id

        # Find and remove assignments for worker on target dates
        removed_count = 0
        target_dates = set(req.dates)

        for inst in sandbox.shift_instances:
            d_str = str(inst.date).split(' ')[0]
            if d_str in target_dates:
                asgns = db.query(SandboxAssignment).filter(
                    SandboxAssignment.sandbox_shift_instance_id == inst.id,
                    SandboxAssignment.worker_id == req.employee_id
                ).all()

                for a in asgns:
                    db.delete(a)
                    removed_count += 1

        db.commit()
        return removed_count, f"Removed {removed_count} shift assignment(s) for sick call by {worker_name} on {', '.join(req.dates)}."

    @staticmethod
    def _simulate_vacation(
        db: Session,
        sandbox: SandboxSchedule,
        req: SandboxSimulationRequest
    ) -> (int, str):
        if not req.employee_id or not req.dates:
            return 0, "Missing employee_id or dates for vacation simulation."

        worker = db.query(Worker).filter(Worker.id == req.employee_id).first()
        worker_name = f"{worker.first_name} {worker.last_name}" if worker else req.employee_id

        removed_count = 0
        vac_dates = set(req.dates)

        for inst in sandbox.shift_instances:
            d_str = str(inst.date).split(' ')[0]
            if d_str in vac_dates:
                asgns = db.query(SandboxAssignment).filter(
                    SandboxAssignment.sandbox_shift_instance_id == inst.id,
                    SandboxAssignment.worker_id == req.employee_id
                ).all()

                for a in asgns:
                    db.delete(a)
                    removed_count += 1

        db.commit()
        return removed_count, f"Cleared {removed_count} shift assignment(s) for approved vacation of {worker_name} across {len(req.dates)} date(s)."

    @staticmethod
    def _simulate_staff_shortage(
        db: Session,
        sandbox: SandboxSchedule,
        req: SandboxSimulationRequest
    ) -> (int, str):
        # Reduce required workers by 1 on target dates or all dates
        reduced_count = 0
        target_dates = set(req.dates) if req.dates else None

        for inst in sandbox.shift_instances:
            d_str = str(inst.date).split(' ')[0]
            if target_dates is None or d_str in target_dates:
                if inst.required_workers > 1:
                    inst.required_workers -= 1
                    reduced_count += 1

        db.commit()
        return reduced_count, f"Simulated staff shortage by reducing required headcount on {reduced_count} shift instance(s)."

    @staticmethod
    def _simulate_extra_staff(
        db: Session,
        sandbox: SandboxSchedule,
        req: SandboxSimulationRequest
    ) -> (int, str):
        increased_count = 0
        target_dates = set(req.dates) if req.dates else None

        for inst in sandbox.shift_instances:
            d_str = str(inst.date).split(' ')[0]
            if target_dates is None or d_str in target_dates:
                inst.required_workers += 1
                increased_count += 1

        db.commit()
        return increased_count, f"Simulated additional staff capacity by increasing headcount demand on {increased_count} shift instance(s)."
