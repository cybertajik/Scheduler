from datetime import date, timedelta
from typing import List, Dict, Set
from app.solver.dtos import SolverInputDTO, InfeasibilityDiagnosticDTO
from app.rules.enums import RuleType, RuleCategory

class InfeasibilityExplainer:
    """
    Analyzes scheduling inputs when solver returns INFEASIBLE to pinpoint exact root causes.
    """

    @staticmethod
    def diagnose(input_data: SolverInputDTO) -> InfeasibilityDiagnosticDTO:
        root_causes = []
        affected_workers = set()
        affected_dates = set()
        remediations = []

        dates = [input_data.start_date + timedelta(days=i) for i in range((input_data.end_date - input_data.start_date).days + 1)]
        num_workers = len(input_data.workers)

        if num_workers == 0:
            return InfeasibilityDiagnosticDTO(
                is_infeasible=True,
                summary="No active workers available in solver input.",
                root_causes=["Worker pool is empty."],
                suggested_remediations=["Add active workers to department."]
            )

        # 1. Daily Capacity Analysis
        daily_reqs: Dict[date, int] = {}
        for r in input_data.shift_requirements:
            daily_reqs[r.date] = daily_reqs.get(r.date, 0) + r.required_workers

        for d, total_req in daily_reqs.items():
            if total_req > num_workers:
                root_causes.append(f"On {d}, required headcount ({total_req}) exceeds total available workers ({num_workers}).")
                affected_dates.add(d)
                remediations.append(f"Reduce shift demand on {d} or hire/borrow additional workers.")

        # 2. Vacation & Unavailability Overlap Analysis
        for d in dates:
            blocked_workers = set()
            for c in input_data.worker_constraints:
                if c.enabled and c.category == RuleCategory.HARD and c.rule_type in [RuleType.VACATION, RuleType.UNAVAILABLE_DATE, RuleType.UNAVAILABLE_RANGE]:
                    if c.start_date <= d <= c.end_date:
                        blocked_workers.add(c.worker_id)
                        affected_workers.add(c.worker_id)

            avail_count = num_workers - len(blocked_workers)
            req_count = daily_reqs.get(d, 0)
            if req_count > avail_count:
                root_causes.append(
                    f"On {d}, {len(blocked_workers)} workers are on vacation/unavailable. "
                    f"Only {avail_count} workers available for {req_count} required shifts."
                )
                affected_dates.add(d)
                remediations.append(f"Approve fewer overlapping vacations for {d}.")

        # 3. Night Shift Constraint Bottlenecks
        night_shift_ids = {s_id for s_id, s in input_data.shift_types.items() if s.is_night_shift}
        if night_shift_ids:
            no_night_workers = set()
            for c in input_data.worker_constraints:
                if c.enabled and c.category == RuleCategory.HARD and c.rule_type == RuleType.NO_NIGHTS:
                    no_night_workers.add(c.worker_id)

            eligible_night_workers = num_workers - len(no_night_workers)
            for r in input_data.shift_requirements:
                if r.shift_type_id in night_shift_ids and r.required_workers > eligible_night_workers:
                    root_causes.append(
                        f"Night shift requirement on {r.date} requires {r.required_workers} workers, "
                        f"but only {eligible_night_workers} workers are permitted to work night shifts."
                    )
                    affected_dates.add(r.date)
                    remediations.append("Remove NO_NIGHTS constraint from some workers or reduce night shift headcount demand.")

        summary = (
            f"Schedule is INFEASIBLE. Identified {len(root_causes)} conflicting constraint bottleneck(s)."
            if root_causes
            else "Schedule is INFEASIBLE due to combined constraint interaction."
        )

        return InfeasibilityDiagnosticDTO(
            is_infeasible=True,
            summary=summary,
            root_causes=root_causes,
            affected_workers=list(affected_workers),
            affected_dates=sorted(list(affected_dates)),
            suggested_remediations=list(set(remediations))
        )
