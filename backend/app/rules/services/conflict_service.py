from typing import List
from app.rules.dtos import SchedulingContext, ConflictReport, RuleViolation
from app.rules.enums import RuleCategory, ConflictSeverity
from app.rules.services.evaluation_service import RuleEvaluationService

class RuleConflictService:
    """
    Scans full scheduling context or current assignments to detect conflicts.
    """

    def __init__(self, eval_service: RuleEvaluationService = None):
        self.eval_service = eval_service or RuleEvaluationService()

    def detect_schedule_conflicts(self, context: SchedulingContext) -> ConflictReport:
        """
        Analyzes all existing assignments in the context against rule constraints.
        Returns structured ConflictReport.
        """
        all_conflicts: List[RuleViolation] = []

        for assignment in context.existing_assignments:
            eval_res = self.eval_service.evaluate_worker_assignment(
                context=context,
                worker_id=assignment.worker_id,
                target_date=assignment.date,
                shift_type_id=assignment.shift_type_id
            )
            if eval_res.violations:
                all_conflicts.extend(eval_res.violations)

        hard_count = sum(1 for c in all_conflicts if c.category == RuleCategory.HARD)
        soft_count = sum(1 for c in all_conflicts if c.category == RuleCategory.SOFT)
        total_penalty = sum(c.penalty_score for c in all_conflicts)
        is_feasible = (hard_count == 0)

        msg = (
            "Schedule is fully feasible with zero hard conflicts."
            if is_feasible
            else f"Schedule has {hard_count} HARD constraint violations and is infeasible."
        )

        return ConflictReport(
            is_feasible=is_feasible,
            hard_conflicts_count=hard_count,
            soft_violations_count=soft_count,
            total_penalty_score=total_penalty,
            conflicts=all_conflicts,
            summary_message=msg
        )
