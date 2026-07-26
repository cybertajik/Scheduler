from datetime import date, timedelta
from typing import List, Optional
from app.rules.evaluators.base import BaseRuleEvaluator
from app.rules.dtos import SchedulingContext, RuleViolation
from app.rules.enums import RuleType, RuleCategory, ConflictSeverity

class NightShiftEvaluator(BaseRuleEvaluator):
    """
    Evaluates NO_NIGHTS and NO_POST_NIGHT_SHIFT rest rules.
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

        target_shift = context.shift_types.get(shift_type_id) if shift_type_id else None

        # 1. Check NO_NIGHTS constraint for current shift
        if target_shift and target_shift.is_night_shift:
            for c in context.worker_constraints:
                if c.worker_id != worker_id or not c.enabled:
                    continue

                if c.rule_type == RuleType.NO_NIGHTS:
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
                            code="ERR_NO_NIGHTS",
                            reason=f"Worker {worker_name} is restricted from working night shifts on {target_date}",
                            penalty_score=100 if c.category == RuleCategory.HARD else 25
                        ))

        # 2. Check Post-Night Shift Rest Rule (worked night shift yesterday)
        yesterday = target_date - timedelta(days=1)
        worked_night_yesterday = False
        for a in context.existing_assignments:
            if a.worker_id == worker_id and a.date == yesterday:
                past_shift = context.shift_types.get(a.shift_type_id)
                if past_shift and past_shift.is_night_shift:
                    worked_night_yesterday = True
                    break

        if worked_night_yesterday:
            violations.append(RuleViolation(
                rule_type=RuleType.NO_POST_NIGHT_SHIFT,
                category=RuleCategory.HARD,
                severity=ConflictSeverity.CRITICAL,
                worker_id=worker_id,
                worker_name=worker_name,
                affected_date=target_date,
                affected_shift_type_id=shift_type_id,
                code="ERR_POST_NIGHT_REST",
                reason=f"Worker {worker_name} worked a night shift on {yesterday} and must rest on {target_date}",
                penalty_score=100
            ))

        return violations
