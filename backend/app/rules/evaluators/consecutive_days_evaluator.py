from datetime import date, timedelta
from typing import List, Optional
from app.rules.evaluators.base import BaseRuleEvaluator
from app.rules.dtos import SchedulingContext, RuleViolation
from app.rules.enums import RuleType, RuleCategory, ConflictSeverity

class ConsecutiveDaysEvaluator(BaseRuleEvaluator):
    """
    Evaluates MAX_CONSECUTIVE_DAYS rule.
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

        # Find max consecutive days limit from worker constraints or default 6
        max_days = 6
        rule_category = RuleCategory.HARD
        for c in context.worker_constraints:
            if c.worker_id == worker_id and c.enabled and c.rule_type == RuleType.MAX_CONSECUTIVE_DAYS:
                if c.start_date <= target_date <= c.end_date:
                    if c.metadata_json and "max_days" in c.metadata_json:
                        max_days = int(c.metadata_json["max_days"])
                        rule_category = c.category
                        break

        # Count consecutive prior working days
        consecutive_prior = 0
        curr_date = target_date - timedelta(days=1)
        assigned_dates = {a.date for a in context.existing_assignments if a.worker_id == worker_id}

        while curr_date in assigned_dates:
            consecutive_prior += 1
            curr_date -= timedelta(days=1)

        # If adding today exceeds max_days
        if consecutive_prior >= max_days:
            severity = ConflictSeverity.CRITICAL if rule_category == RuleCategory.HARD else ConflictSeverity.WARNING
            violations.append(RuleViolation(
                rule_type=RuleType.MAX_CONSECUTIVE_DAYS,
                category=rule_category,
                severity=severity,
                worker_id=worker_id,
                worker_name=worker_name,
                affected_date=target_date,
                affected_shift_type_id=shift_type_id,
                code="ERR_MAX_CONSECUTIVE_DAYS",
                reason=f"Assigning {worker_name} on {target_date} exceeds maximum of {max_days} consecutive days (already worked {consecutive_prior} days)",
                penalty_score=100 if rule_category == RuleCategory.HARD else 30
            ))

        return violations
