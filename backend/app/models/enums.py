import enum

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"  # Product Owner
    ORG_ADMIN = "ORG_ADMIN"      # Top Manager of Organization
    ADMIN = "ADMIN"              # System / Org Admin legacy
    SCHEDULER = "SCHEDULER"      # Schedule Manager
    MANAGER = "MANAGER"          # Manager
    EMPLOYEE = "EMPLOYEE"        # Employee

class ScheduleStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    GENERATED = "GENERATED"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"

class ConstraintType(str, enum.Enum):
    VACATION = "VACATION"
    UNAVAILABLE_DATE = "UNAVAILABLE_DATE"
    UNAVAILABLE_RANGE = "UNAVAILABLE_RANGE"
    NO_WEEKENDS = "NO_WEEKENDS"
    NO_NIGHTS = "NO_NIGHTS"
    NO_SHIFT_TYPE = "NO_SHIFT_TYPE"
    MAX_CONSECUTIVE_DAYS = "MAX_CONSECUTIVE_DAYS"
    MIN_REST_HOURS = "MIN_REST_HOURS"
    PREFERRED_DAYS_OFF = "PREFERRED_DAYS_OFF"

class AssignmentSource(str, enum.Enum):
    SOLVER = "SOLVER"
    MANUAL = "MANUAL"

class ContractType(str, enum.Enum):
    HOURLY = "HOURLY"
    SALARY = "SALARY"
