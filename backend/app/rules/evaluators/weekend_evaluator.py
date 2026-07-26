from datetime import date
from typing import List, Optional
from app.rules.evaluators.base import BaseRuleEvaluator
from app.rules.dtos import SchedulingContext, RuleViolation
from app.rules.enums import RuleType, RuleCategory, ConflictSeverity

class WeekendEvaluator(BaseRuleEvaluator):
    """
    Evaluates NO_WEEKENDS constraint (Saturday = 5, Sunday = 6).
    """

    def evaluate(
        self,
        context: SchedulingContext,
        worker_id: str,
        target_date: date,
        shift_type_id: Optional[str] = None
    ) -> List[RuleViolation]:
        violations = []
        # Saturday is 5, Sunday is 6
        if target_date.weekday() < 5:
            return violations

        worker = context.workers.get(worker_id)
        worker_name = f"{worker.first_name} {worker.last_name}" if worker else worker_id

        for c in context.worker_constraints:
            if c.worker_id != worker_id or not c.enabled:
                continue

            if c.rule_type == RuleType.NO_WEEKENDS:
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
                        code="ERR_NO_WEEKENDS",
                        reason=f"Worker {worker_name} cannot work on weekends (Date: {target_date}, {target_date.strftime('%A')})",
                        penalty_score=100 if c.category == RuleCategory.HARD else 30
                    ))

        return violations
