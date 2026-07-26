from datetime import date
from typing import List, Optional
from app.rules.dtos import SchedulingContext, EvaluationResult, RuleViolation
from app.rules.enums import RuleCategory
from app.rules.evaluators import (
    BaseRuleEvaluator,
    VacationEvaluator,
    WeekendEvaluator,
    NightShiftEvaluator,
    ShiftRestrictionEvaluator,
    ConsecutiveDaysEvaluator,
    PreferenceEvaluator
)

class RuleEvaluationService:
    """
    Engine service that executes registered rule evaluators.
    """

    def __init__(self, evaluators: Optional[List[BaseRuleEvaluator]] = None):
        if evaluators is not None:
            self.evaluators = evaluators
        else:
            self.evaluators = [
                VacationEvaluator(),
                WeekendEvaluator(),
                NightShiftEvaluator(),
                ShiftRestrictionEvaluator(),
                ConsecutiveDaysEvaluator(),
                PreferenceEvaluator()
            ]

    def evaluate_worker_assignment(
        self,
        context: SchedulingContext,
        worker_id: str,
        target_date: date,
        shift_type_id: Optional[str] = None
    ) -> EvaluationResult:
        """
        Evaluates all rules for a single proposed worker assignment on a specific date.
        """
        all_violations: List[RuleViolation] = []
        for evaluator in self.evaluators:
            res = evaluator.evaluate(context, worker_id, target_date, shift_type_id)
            all_violations.extend(res)

        has_hard = any(v.category == RuleCategory.HARD for v in all_violations)
        total_penalty = sum(v.penalty_score for v in all_violations)

        return EvaluationResult(
            is_eligible=not has_hard,
            has_hard_violations=has_hard,
            total_penalty_score=total_penalty,
            violations=all_violations
        )
