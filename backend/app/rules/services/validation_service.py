from datetime import date
from typing import Optional, Dict, Any, Tuple
from app.rules.enums import RuleType, RuleCategory

class RuleValidationService:
    """
    Service responsible for validating constraints prior to saving.
    """

    @staticmethod
    def validate_constraint_data(
        rule_type: RuleType,
        category: RuleCategory,
        start_date: date,
        end_date: date,
        priority: int,
        metadata_json: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Validates date ranges, priorities, and metadata schemas.
        Returns (is_valid, error_message).
        """
        # 1. Date range validation
        if start_date > end_date:
            return False, f"Start date ({start_date}) cannot be after end date ({end_date})"

        # 2. Priority bounds (1=Highest to 10=Lowest)
        if priority < 1 or priority > 10:
            return False, f"Priority ({priority}) must be between 1 and 10"

        # 3. Metadata payload validations based on RuleType
        if rule_type == RuleType.NO_SHIFT_TYPE:
            if not metadata_json or ("shift_type_id" not in metadata_json and "shift_name" not in metadata_json):
                return False, "NO_SHIFT_TYPE rule requires 'shift_type_id' or 'shift_name' in metadata_json"

        elif rule_type == RuleType.MAX_CONSECUTIVE_DAYS:
            if metadata_json and "max_days" in metadata_json:
                try:
                    val = int(metadata_json["max_days"])
                    if val < 1:
                        return False, "metadata_json['max_days'] must be at least 1"
                except ValueError:
                    return False, "metadata_json['max_days'] must be an integer"

        elif rule_type == RuleType.MIN_REST_HOURS:
            if metadata_json and "min_hours" in metadata_json:
                try:
                    val = float(metadata_json["min_hours"])
                    if val < 0:
                        return False, "metadata_json['min_hours'] cannot be negative"
                except ValueError:
                    return False, "metadata_json['min_hours'] must be a valid number"

        return True, None
