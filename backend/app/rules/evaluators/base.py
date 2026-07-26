from abc import ABC, abstractmethod
from datetime import date
from typing import List, Optional
from app.rules.dtos import SchedulingContext, RuleViolation

class BaseRuleEvaluator(ABC):
    """
    Abstract base class for all scheduling rule evaluators.
    """

    @abstractmethod
    def evaluate(
        self,
        context: SchedulingContext,
        worker_id: str,
        target_date: date,
        shift_type_id: Optional[str] = None
    ) -> List[RuleViolation]:
        """
        Evaluates rules for a given worker, date, and optional shift type against the context.
        Returns a list of RuleViolation objects (empty if no violations).
        """
        pass
