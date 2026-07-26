from datetime import date
from typing import List, Optional
from app.rules.evaluators.base import BaseRuleEvaluator
from app.rules.dtos import SchedulingContext, RuleViolation
from app.rules.enums import RuleType, RuleCategory, ConflictSeverity

class VacationEvaluator(BaseRuleEvaluator):
    """
    Evaluates VACATION, UNAVAILABLE_DATE, and UNAVAILABLE_RANGE constraints.
    """

    def evaluate(
        self,
        context: SchedulingContext,
        worker_id: str,
        target_date: date,
        shift_type_id: Optional[str] = None
    ) -> List[RuleViolation]:
        violations = []
        worker = context.workers.get(worker_id)
        worker_name = f"{worker.first_name} {worker.last_name}" if worker else worker_id

        for c in context.worker_constraints:
            if c.worker_id != worker_id or not c.enabled:
                continue

            if c.rule_type in [RuleType.VACATION, RuleType.UNAVAILABLE_DATE, RuleType.UNAVAILABLE_RANGE]:
                if c.start_date <= target_date <= c.end_date:
                    severity = ConflictSeverity.CRITICAL if c.category == RuleCategory.HARD else ConflictSeverity.WARNING
                    violations.append(RuleViolation(
                        rule_type=c.rule_type,
                        category=c.category,
                        severity=severity,
                        worker_id=worker_id,
                        worker_name=worker_name,
                        affected_date=target_date,
                        affected_shift_type_id=shift_type_id,
                        code=f"ERR_{c.rule_type.value}",
                        reason=f"Worker {worker_name} is blocked on {target_date} due to {c.rule_type.value} ({c.start_date} to {c.end_date})",
                        penalty_score=100 if c.category == RuleCategory.HARD else 20
                    ))

        return violations
