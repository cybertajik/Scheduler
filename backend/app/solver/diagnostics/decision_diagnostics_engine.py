import uuid
import math
from datetime import date, timedelta, datetime
from typing import List, Dict, Set, Optional, Any, Tuple

from app.solver.dtos import SolverInputDTO, SolverResultDTO, SolverAssignmentDTO
from app.schemas.solver_diagnostics import (
    ComprehensiveDiagnosticsDTO,
    SolverStatisticsDTO,
    SuccessfulDiagnosticsDTO,
    FailedDiagnosticsDTO,
    ConstraintDiagnosticDTO,
    SuggestedFixDTO,
    SeverityReasonDTO,
    WorkloadDistributionDTO,
    SoftConstraintViolationDTO,
    OvertimeSummaryDTO,
    SkillCoverageDTO,
)
from app.rules.enums import RuleType, RuleCategory


class DecisionDiagnosticsEngine:
    """
    Engine for evaluating solver decisions, calculating fairness & workload telemetry,
    extracting solver statistics, ranking infeasibility severity, and generating actionable fixes.
    """

    @staticmethod
    def evaluate(
        input_data: SolverInputDTO,
        result: SolverResultDTO,
        solver_obj: Optional[Any] = None,
        model_obj: Optional[Any] = None
    ) -> ComprehensiveDiagnosticsDTO:
        schedule_id = input_data.schedule_id or str(uuid.uuid4())
        
        # 1. Extract Solver Telemetry & Statistics
        stats = DecisionDiagnosticsEngine._extract_solver_stats(
            input_data=input_data,
            result=result,
            solver_obj=solver_obj,
            model_obj=model_obj
        )

        # 2. Evaluate Constraint Breakdown & Conflicts
        constraint_diagnostics = DecisionDiagnosticsEngine._evaluate_constraint_diagnostics(input_data, result)

        # 3. Generate Suggested Fixes
        suggested_fixes = DecisionDiagnosticsEngine._generate_suggested_fixes(input_data, result, constraint_diagnostics)

        # 4. Successful vs Failed Diagnostics
        successful_diag = None
        failed_diag = None

        if result.is_solved and result.status in ["OPTIMAL", "FEASIBLE"]:
            successful_diag = DecisionDiagnosticsEngine._evaluate_successful_diagnostics(input_data, result)
        else:
            failed_diag = DecisionDiagnosticsEngine._evaluate_failed_diagnostics(input_data, result, constraint_diagnostics)

        return ComprehensiveDiagnosticsDTO(
            schedule_id=schedule_id,
            status=result.status,
            timestamp=datetime.utcnow().isoformat(),
            solver_statistics=stats,
            successful_diagnostics=successful_diag,
            failed_diagnostics=failed_diag,
            constraint_diagnostics=constraint_diagnostics,
            suggested_fixes=suggested_fixes
        )

    @staticmethod
    def _extract_solver_stats(
        input_data: SolverInputDTO,
        result: SolverResultDTO,
        solver_obj: Optional[Any],
        model_obj: Optional[Any]
    ) -> SolverStatisticsDTO:
        num_workers = len(input_data.workers)
        num_days = (input_data.end_date - input_data.start_date).days + 1
        num_shifts = len(input_data.shift_types)

        # Estimated variables = workers * days * shift_types
        est_vars = num_workers * num_days * num_shifts
        est_constraints = len(input_data.worker_constraints) + len(input_data.shift_requirements) + num_workers * num_days

        branches = 0
        conflicts = 0
        obj_score = result.objective_score

        if solver_obj is not None:
            try:
                if hasattr(solver_obj, 'NumBranches'):
                    branches = solver_obj.NumBranches()
                if hasattr(solver_obj, 'NumConflicts'):
                    conflicts = solver_obj.NumConflicts()
                if hasattr(solver_obj, 'ObjectiveValue'):
                    obj_score = float(solver_obj.ObjectiveValue())
                if hasattr(solver_obj, 'NumBooleans'):
                    est_vars = solver_obj.NumBooleans()
            except Exception:
                pass

        if model_obj is not None:
            try:
                if hasattr(model_obj, 'Proto') and hasattr(model_obj.Proto(), 'constraints'):
                    est_constraints = len(model_obj.Proto().constraints)
            except Exception:
                pass

        memory_mb = round((est_vars * 0.005) + (est_constraints * 0.01) + 12.5, 2)

        return SolverStatisticsDTO(
            variables_created=est_vars,
            constraints_created=est_constraints,
            solver_runtime_seconds=round(result.solver_runtime_seconds, 3),
            memory_estimate_mb=memory_mb,
            objective_score=obj_score,
            branches_explored=branches,
            conflicts_detected=conflicts,
            solver_status=result.status
        )

    @staticmethod
    def _evaluate_successful_diagnostics(
        input_data: SolverInputDTO,
        result: SolverResultDTO
    ) -> SuccessfulDiagnosticsDTO:
        total_req = result.total_shifts_required
        total_assigned = result.total_shifts_assigned
        unassigned = result.total_unfilled_shifts
        coverage_pct = round((total_assigned / total_req * 100), 2) if total_req > 0 else 100.0

        # Count shifts per employee
        worker_shifts: Dict[str, int] = {w_id: 0 for w_id in input_data.workers.keys()}
        worker_weekend_shifts: Dict[str, int] = {w_id: 0 for w_id in input_data.workers.keys()}
        worker_night_shifts: Dict[str, int] = {w_id: 0 for w_id in input_data.workers.keys()}

        night_shift_ids = {s_id for s_id, s in input_data.shift_types.items() if s.is_night_shift}

        for a in result.assignments:
            if a.worker_id in worker_shifts:
                worker_shifts[a.worker_id] += 1
                if a.date.weekday() in (5, 6):
                    worker_weekend_shifts[a.worker_id] += 1
                if a.shift_type_id in night_shift_ids:
                    worker_night_shifts[a.worker_id] += 1

        # Workload & Fairness Score calculation
        weekend_dist = [
            WorkloadDistributionDTO(
                employee_id=w_id,
                employee_name=input_data.workers[w_id].name,
                count=count,
                target=round(sum(worker_weekend_shifts.values()) / max(1, len(worker_weekend_shifts)), 1)
            )
            for w_id, count in worker_weekend_shifts.items()
        ]

        night_dist = [
            WorkloadDistributionDTO(
                employee_id=w_id,
                employee_name=input_data.workers[w_id].name,
                count=count,
                target=round(sum(worker_night_shifts.values()) / max(1, len(worker_night_shifts)), 1)
            )
            for w_id, count in worker_night_shifts.items()
        ]

        # Calculate standard deviation for fairness score
        shift_counts = list(worker_shifts.values())
        avg_shifts = sum(shift_counts) / max(1, len(shift_counts))
        variance = sum((c - avg_shifts) ** 2 for c in shift_counts) / max(1, len(shift_counts))
        std_dev = math.sqrt(variance)
        fairness_score = max(0.0, round(100.0 - (std_dev * 10), 1))

        # Overtime calculation
        total_ot = 0.0
        ot_employees = []
        max_ot = 0.0

        for w_id, w_dto in input_data.workers.items():
            assigned_hours = worker_shifts[w_id] * 8.0  # Approx 8h per shift
            weekly_target = w_dto.weekly_contract_hours * 4.33  # Monthly target
            if assigned_hours > weekly_target:
                ot_hours = assigned_hours - weekly_target
                total_ot += ot_hours
                ot_employees.append(w_dto.name)
                if ot_hours > max_ot:
                    max_ot = ot_hours

        overtime_summary = OvertimeSummaryDTO(
            total_overtime_hours=round(total_ot, 1),
            employees_with_overtime_count=len(ot_employees),
            max_overtime_hours_employee=round(max_ot, 1),
            affected_employee_names=ot_employees
        )

        # Skill Coverage Summary
        skill_coverage_list = []
        for s_id, s_dto in input_data.shift_types.items():
            req_count = sum(r.required_workers for r in input_data.shift_requirements if r.shift_type_id == s_id)
            asgn_count = sum(1 for a in result.assignments if a.shift_type_id == s_id)
            unmet = max(0, req_count - asgn_count)
            cov_pct = round((asgn_count / req_count * 100), 1) if req_count > 0 else 100.0

            skill_coverage_list.append(SkillCoverageDTO(
                skill_tag=s_dto.name,
                required_shifts=req_count,
                assigned_shifts=asgn_count,
                unmet_shifts=unmet,
                coverage_percentage=cov_pct
            ))

        # Soft Constraint Violations
        soft_violations = []
        if result.soft_penalty_total > 0:
            soft_violations.append(SoftConstraintViolationDTO(
                rule_id="SOFT_PENALTY",
                rule_name="Workload & Preference Optimization",
                rule_category="SOFT",
                penalty_score=result.soft_penalty_total,
                employees_affected=[w.name for w in input_data.workers.values()][:5],
                dates_affected=[],
                description=f"Soft constraint penalty total score: {result.soft_penalty_total}"
            ))

        return SuccessfulDiagnosticsDTO(
            coverage_percentage=coverage_pct,
            fairness_score=fairness_score,
            total_assigned_shifts=total_assigned,
            unassigned_shifts=unassigned,
            soft_constraint_violations=soft_violations,
            overtime_summary=overtime_summary,
            weekend_distribution=weekend_dist,
            night_shift_distribution=night_dist,
            skill_coverage_summary=skill_coverage_list
        )

    @staticmethod
    def _evaluate_failed_diagnostics(
        input_data: SolverInputDTO,
        result: SolverResultDTO,
        constraint_diagnostics: List[ConstraintDiagnosticDTO]
    ) -> FailedDiagnosticsDTO:
        ranked_reasons = []
        num_workers = len(input_data.workers)
        num_days = (input_data.end_date - input_data.start_date).days + 1

        if num_workers == 0:
            ranked_reasons.append(SeverityReasonDTO(
                severity="CRITICAL",
                category="INSUFFICIENT_QUALIFIED_WORKERS",
                reason="No active employees available in organization roster.",
                affected_employees=[],
                affected_dates=[],
                suggested_action="Register active employees in organizational roster."
            ))

        # Check daily capacity shortages
        daily_reqs: Dict[date, int] = {}
        for r in input_data.shift_requirements:
            daily_reqs[r.date] = daily_reqs.get(r.date, 0) + r.required_workers

        shortage_dates = [d_str for d, req in daily_reqs.items() if req > num_workers for d_str in [str(d)]]
        if shortage_dates:
            ranked_reasons.append(SeverityReasonDTO(
                severity="CRITICAL",
                category="TOO_MANY_UNAVAILABLE",
                reason=f"Shift demand exceeds total employee count on {len(shortage_dates)} date(s).",
                affected_employees=[],
                affected_dates=shortage_dates[:7],
                suggested_action="Add additional employees or reduce required headcount per shift."
            ))

        # Check constraint diagnostics conflicts
        for cd in constraint_diagnostics:
            if cd.number_of_conflicts > 0:
                sev = "HIGH" if cd.constraint_type == "HARD" else "MEDIUM"
                ranked_reasons.append(SeverityReasonDTO(
                    severity=sev,
                    category=cd.category,
                    reason=f"Constraint '{cd.constraint_name}' has {cd.number_of_conflicts} conflict(s).",
                    affected_employees=cd.employees_affected[:5],
                    affected_dates=cd.dates_affected[:5],
                    suggested_action=cd.suggested_corrective_actions[0] if cd.suggested_corrective_actions else "Review constraint settings."
                ))

        summary = (
            f"Schedule generation failed due to {len(ranked_reasons)} ranked bottleneck(s)."
            if ranked_reasons
            else "Schedule is infeasible due to conflicting constraint interactions."
        )

        all_affected_workers = list(set([w for r in ranked_reasons for w in r.affected_employees]))
        all_affected_dates = list(set([d for r in ranked_reasons for d in r.affected_dates]))
        all_remediations = list(set([r.suggested_action for r in ranked_reasons]))

        return FailedDiagnosticsDTO(
            is_infeasible=True,
            summary=summary,
            ranked_reasons=ranked_reasons,
            affected_employees=all_affected_workers,
            affected_dates=sorted(all_affected_dates),
            suggested_remediations=all_remediations
        )

    @staticmethod
    def _evaluate_constraint_diagnostics(
        input_data: SolverInputDTO,
        result: SolverResultDTO
    ) -> List[ConstraintDiagnosticDTO]:
        diagnostics_list = []

        # 1. Vacation Overlap Constraint
        vacation_constraints = [c for c in input_data.worker_constraints if c.enabled and c.rule_type == RuleType.VACATION]
        vac_workers = list(set([input_data.workers[c.worker_id].name for c in vacation_constraints if c.worker_id in input_data.workers]))
        vac_dates = list(set([str(c.start_date) for c in vacation_constraints]))

        diagnostics_list.append(ConstraintDiagnosticDTO(
            constraint_name="Vacation & Approved Leave",
            constraint_type="HARD",
            category="VACATION_CONFLICT",
            employees_affected=vac_workers,
            dates_affected=sorted(vac_dates),
            number_of_conflicts=len(vacation_constraints),
            suggested_corrective_actions=["Adjust vacation dates or hire temporary coverage."]
        ))

        # 2. Night Shift Rest Period Constraint
        night_constraints = [c for c in input_data.worker_constraints if c.enabled and c.rule_type == RuleType.NO_NIGHTS]
        night_workers = list(set([input_data.workers[c.worker_id].name for c in night_constraints if c.worker_id in input_data.workers]))

        diagnostics_list.append(ConstraintDiagnosticDTO(
            constraint_name="Night Shift Recovery Rest (11-Hour Window)",
            constraint_type="HARD",
            category="NIGHT_RECOVERY_CONFLICT",
            employees_affected=night_workers,
            dates_affected=[],
            number_of_conflicts=len(night_constraints),
            suggested_corrective_actions=["Remove NO_NIGHTS restriction for eligible employees or reassign night shifts."]
        ))

        # 3. Maximum Weekly Hours Constraint
        diagnostics_list.append(ConstraintDiagnosticDTO(
            constraint_name="Maximum Weekly Contract Hours",
            constraint_type="HARD",
            category="MAX_HOURS_EXCEEDED",
            employees_affected=[],
            dates_affected=[],
            number_of_conflicts=0,
            suggested_corrective_actions=["Increase weekly target contract hours for key employees or authorize overtime."]
        ))

        # 4. Weekend Rotation Fairness
        diagnostics_list.append(ConstraintDiagnosticDTO(
            constraint_name="Weekend Shift Balance",
            constraint_type="SOFT",
            category="WEEKEND_RESTRICTION_CONFLICT",
            employees_affected=[w.name for w in input_data.workers.values()][:3],
            dates_affected=[],
            number_of_conflicts=0,
            suggested_corrective_actions=["Allow weekend shift flexibility across employee roster."]
        ))

        return diagnostics_list

    @staticmethod
    def _generate_suggested_fixes(
        input_data: SolverInputDTO,
        result: SolverResultDTO,
        constraint_diagnostics: List[ConstraintDiagnosticDTO]
    ) -> List[SuggestedFixDTO]:
        fixes = []
        num_workers = len(input_data.workers)

        if num_workers < 5:
            fixes.append(SuggestedFixDTO(
                id="FIX-ADD-WORKER",
                title="Add Qualified Employee",
                description="Staff pool is small. Registering 1 additional employee will reduce shift scheduling bottlenecks.",
                action_type="ADD_WORKER",
                impact_score=9.5
            ))

        if result.total_unfilled_shifts > 0:
            fixes.append(SuggestedFixDTO(
                id="FIX-RELAX-MIN-STAFFING",
                title="Relax Minimum Staffing Requirement",
                description=f"Reduce minimum required headcount by 1 shift on understaffed dates ({result.total_unfilled_shifts} unfilled shifts).",
                action_type="RELAX_MIN_STAFFING",
                impact_score=8.5
            ))

        # Check vacation conflicts
        vac_diag = next((c for c in constraint_diagnostics if c.category == "VACATION_CONFLICT"), None)
        if vac_diag and vac_diag.employees_affected:
            emp_name = vac_diag.employees_affected[0]
            fixes.append(SuggestedFixDTO(
                id="FIX-VACATION-DATES",
                title=f"Adjust Vacation Dates for {emp_name}",
                description=f"Overlapping vacation dates reduce available headcount. Shift vacation window by 2 days.",
                action_type="CHANGE_VACATION_DATES",
                employee_name=emp_name,
                impact_score=8.0
            ))

        fixes.append(SuggestedFixDTO(
            id="FIX-ALLOW-OVERTIME",
            title="Allow Overtime Workload",
            description="Enable soft overtime allowance (+5 hours/week) for experienced employees.",
            action_type="ALLOW_OVERTIME",
            impact_score=7.0
        ))

        fixes.append(SuggestedFixDTO(
            id="FIX-INCREASE-HOURS",
            title="Increase Weekly Target Contract Hours",
            description="Adjust employee contract hours baseline from 35h to 40h per week.",
            action_type="INCREASE_WEEKLY_HOURS",
            impact_score=6.5
        ))

        # Sort fixes by impact score descending
        fixes.sort(key=lambda x: x.impact_score, reverse=True)
        return fixes
