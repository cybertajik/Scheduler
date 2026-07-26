from datetime import date
from typing import List, Optional
from app.rules.evaluators.base import BaseRuleEvaluator
from app.rules.dtos import SchedulingContext, RuleViolation
from app.rules.enums import RuleType, RuleCategory, ConflictSeverity

class ShiftRestrictionEvaluator(BaseRuleEvaluator):
    """
    Evaluates NO_SHIFT_TYPE (e.g. Cannot work Shift 2, Cannot work Shift 3).
    """

    def evaluate(
        self,
        context: SchedulingContext,
        worker_id: str,
        target_date: date,
        shift_type_id: Optional[str] = None
    ) -> List[RuleViolation]:
        violations = []
        if not shift_type_id:
            return violations

        worker = context.workers.get(worker_id)
        worker_name = f"{worker.first_name} {worker.last_name}" if worker else worker_id
        target_shift = context.shift_types.get(shift_type_id)

        for c in context.worker_constraints:
            if c.worker_id != worker_id or not c.enabled:
                continue

            if c.rule_type == RuleType.NO_SHIFT_TYPE:
                if c.start_date <= target_date <= c.end_date:
                    restricted_shift_id = c.metadata_json.get("shift_type_id") if c.metadata_json else None
                    restricted_shift_name = c.metadata_json.get("shift_name") if c.metadata_json else None

                    match = False
                    if restricted_shift_id and restricted_shift_id == shift_type_id:
                        match = True
                    elif restricted_shift_name and target_shift and target_shift.name.lower() == restricted_shift_name.lower():
                        match = True

                    if match:
                        severity = ConflictSeverity.CRITICAL if c.category == RuleCategory.HARD else ConflictSeverity.WARNING
                        shift_display = target_shift.name if target_shift else shift_type_id
                        violations.append(RuleViolation(
                            rule_type=c.rule_type,
                            category=c.category,
                            severity=severity,
                            worker_id=worker_id,
                            worker_name=worker_name,
                            affected_date=target_date,
                            affected_shift_type_id=shift_type_id,
                            code="ERR_RESTRICTED_SHIFT_TYPE",
                            reason=f"Worker {worker_name} cannot be assigned to shift {shift_display} on {target_date}",
                            penalty_score=100 if c.category == RuleCategory.HARD else 20
                        ))

        return violations
