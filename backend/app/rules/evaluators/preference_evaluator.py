from datetime import date
from typing import List, Optional
from app.rules.evaluators.base import BaseRuleEvaluator
from app.rules.dtos import SchedulingContext, RuleViolation
from app.rules.enums import RuleType, RuleCategory, ConflictSeverity

class PreferenceEvaluator(BaseRuleEvaluator):
    """
    Evaluates PREFERRED_DAYS_OFF and PREFERRED_SHIFTS (Soft constraints).
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

            if c.rule_type == RuleType.PREFERRED_DAYS_OFF:
                if c.start_date <= target_date <= c.end_date:
                    violations.append(RuleViolation(
                        rule_type=c.rule_type,
                        category=RuleCategory.SOFT,
                        severity=ConflictSeverity.WARNING,
                        worker_id=worker_id,
                        worker_name=worker_name,
                        affected_date=target_date,
                        affected_shift_type_id=shift_type_id,
                        code="WARN_PREFERRED_DAY_OFF",
                        reason=f"Worker {worker_name} preferred to have {target_date} off",
                        penalty_score=15
                    ))

            elif c.rule_type == RuleType.PREFERRED_SHIFTS and shift_type_id:
                if c.start_date <= target_date <= c.end_date:
                    preferred_shift_id = c.metadata_json.get("shift_type_id") if c.metadata_json else None
                    if preferred_shift_id and preferred_shift_id != shift_type_id:
                        violations.append(RuleViolation(
                            rule_type=c.rule_type,
                            category=RuleCategory.SOFT,
                            severity=ConflictSeverity.INFO,
                            worker_id=worker_id,
                            worker_name=worker_name,
                            affected_date=target_date,
                            affected_shift_type_id=shift_type_id,
                            code="WARN_NON_PREFERRED_SHIFT",
                            reason=f"Worker {worker_name} assigned to shift {shift_type_id} instead of preferred shift {preferred_shift_id} on {target_date}",
                            penalty_score=5
                        ))

        return violations
