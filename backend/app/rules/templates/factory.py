from datetime import date
from typing import Dict, List, Optional
from app.rules.dtos import ConstraintDTO, RuleTemplateDTO
from app.rules.enums import RuleType, RuleCategory

class RuleTemplateFactory:
    """
    Factory providing pre-built rule templates for admins.
    """

    TEMPLATES: Dict[str, RuleTemplateDTO] = {
        "VACATION": RuleTemplateDTO(
            template_key="VACATION",
            name="Approved Vacation",
            description="Worker is on approved paid or unpaid leave.",
            rule_type=RuleType.VACATION,
            default_category=RuleCategory.HARD,
            default_priority=1,
            required_metadata_fields=[]
        ),
        "UNAVAILABLE_DATE": RuleTemplateDTO(
            template_key="UNAVAILABLE_DATE",
            name="Single Day Unavailability",
            description="Worker cannot work on a specific single calendar date.",
            rule_type=RuleType.UNAVAILABLE_DATE,
            default_category=RuleCategory.HARD,
            default_priority=1,
            required_metadata_fields=[]
        ),
        "NO_WEEKENDS": RuleTemplateDTO(
            template_key="NO_WEEKENDS",
            name="No Weekend Shift",
            description="Worker is exempt from working on Saturdays and Sundays.",
            rule_type=RuleType.NO_WEEKENDS,
            default_category=RuleCategory.HARD,
            default_priority=1,
            required_metadata_fields=[]
        ),
        "NO_NIGHTS": RuleTemplateDTO(
            template_key="NO_NIGHTS",
            name="No Night Shifts",
            description="Worker cannot be assigned to night shifts.",
            rule_type=RuleType.NO_NIGHTS,
            default_category=RuleCategory.HARD,
            default_priority=1,
            required_metadata_fields=[]
        ),
        "NO_SHIFT_TYPE": RuleTemplateDTO(
            template_key="NO_SHIFT_TYPE",
            name="Specific Shift Type Block",
            description="Blocks worker from a specific shift type (e.g. Shift 2 or Shift 3).",
            rule_type=RuleType.NO_SHIFT_TYPE,
            default_category=RuleCategory.HARD,
            default_priority=1,
            required_metadata_fields=["shift_type_id"]
        ),
        "MAX_CONSECUTIVE_DAYS": RuleTemplateDTO(
            template_key="MAX_CONSECUTIVE_DAYS",
            name="Maximum Consecutive Days Limit",
            description="Limits the maximum number of back-to-back working days.",
            rule_type=RuleType.MAX_CONSECUTIVE_DAYS,
            default_category=RuleCategory.HARD,
            default_priority=1,
            required_metadata_fields=["max_days"]
        ),
        "PREFERRED_DAYS_OFF": RuleTemplateDTO(
            template_key="PREFERRED_DAYS_OFF",
            name="Preferred Day Off",
            description="Soft preference for having a specific day off.",
            rule_type=RuleType.PREFERRED_DAYS_OFF,
            default_category=RuleCategory.SOFT,
            default_priority=3,
            required_metadata_fields=[]
        )
    }

    @classmethod
    def list_templates(cls) -> List[RuleTemplateDTO]:
        return list(cls.TEMPLATES.values())

    @classmethod
    def build_constraint_from_template(
        cls,
        template_key: str,
        worker_id: str,
        start_date: date,
        end_date: date,
        custom_metadata: Optional[dict] = None
    ) -> ConstraintDTO:
        template = cls.TEMPLATES.get(template_key)
        if not template:
            raise ValueError(f"Unknown template key: {template_key}")

        return ConstraintDTO(
            worker_id=worker_id,
            rule_type=template.rule_type,
            category=template.default_category,
            start_date=start_date,
            end_date=end_date,
            priority=template.default_priority,
            enabled=True,
            metadata_json=custom_metadata or {}
        )
