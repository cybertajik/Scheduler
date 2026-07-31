import unittest
import uuid
from datetime import datetime, timedelta, date, time

from app.core.security import (
    get_password_hash,
    verify_password,
    validate_password_complexity,
    create_access_token,
    decode_token,
)
from app.models import User, Organization, Worker, Department, UserRole
from app.rules import (
    WorkerDTO,
    ShiftTypeDTO,
    AssignmentDTO,
    SchedulingContext,
    RuleValidationService,
    RuleEvaluationService,
)

class TestSecurityUtilsUnit(unittest.TestCase):
    def test_password_hashing_and_verification(self):
        pwd = "SecureP@ssword123"
        hashed = get_password_hash(pwd)
        self.assertNotEqual(pwd, hashed)
        self.assertTrue(verify_password(pwd, hashed))
        self.assertFalse(verify_password("WrongPassword!", hashed))

    def test_password_complexity_validation(self):
        # Valid password
        self.assertIsNone(validate_password_complexity("Valid123!Pass"))

        # Fails
        with self.assertRaises(ValueError):
            validate_password_complexity("short1!")
        with self.assertRaises(ValueError):
            validate_password_complexity("no_uppercase_1!")
        with self.assertRaises(ValueError):
            validate_password_complexity("NO_LOWERCASE_1!")
        with self.assertRaises(ValueError):
            validate_password_complexity("NoDigitsHere!")
        with self.assertRaises(ValueError):
            validate_password_complexity("NoSpecialChar123")

    def test_jwt_token_encode_decode(self):
        user_id = uuid.uuid4()
        token = create_access_token(subject=user_id, role="ORG_ADMIN")
        payload = decode_token(token)
        self.assertEqual(payload["sub"], str(user_id))
        self.assertEqual(payload["role"], "ORG_ADMIN")
        self.assertEqual(payload["type"], "access")


class TestRulesEngineUnit(unittest.TestCase):
    def test_rules_validation_service_instantiation(self):
        service = RuleValidationService()
        self.assertIsNotNone(service)

    def test_scheduling_context_creation(self):
        ctx = SchedulingContext(
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 31)
        )
        self.assertEqual(ctx.start_date, date(2026, 8, 1))
        self.assertEqual(ctx.end_date, date(2026, 8, 31))

    def test_assignment_dto_creation(self):
        assignment = AssignmentDTO(
            id=str(uuid.uuid4()),
            worker_id=str(uuid.uuid4()),
            shift_instance_id=str(uuid.uuid4()),
            shift_type_id=str(uuid.uuid4()),
            date=date(2026, 8, 15),
            locked=False
        )
        self.assertEqual(assignment.date, date(2026, 8, 15))
        self.assertFalse(assignment.locked)


class TestModelsUnit(unittest.TestCase):
    def test_user_model_instantiation(self):
        user = User(
            username="unit_user",
            email="unit@example.com",
            first_name="Unit",
            last_name="Test",
            role=UserRole.ORG_ADMIN,
            active=True
        )
        self.assertEqual(user.username, "unit_user")
        self.assertEqual(user.email, "unit@example.com")
        self.assertTrue(user.active)

    def test_organization_model_instantiation(self):
        org = Organization(
            name="Unit Healthcare",
            slug="unit-healthcare",
            billing_cycle="MONTHLY",
            subscription_status="ACTIVE",
            require_employee_id=True,
            active=True
        )
        self.assertEqual(org.slug, "unit-healthcare")
        self.assertEqual(org.billing_cycle, "MONTHLY")


if __name__ == "__main__":
    unittest.main()
