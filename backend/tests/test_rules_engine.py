import unittest
from datetime import date, time, timedelta
from app.rules import (
    RuleCategory,
    RuleType,
    ConflictSeverity,
    WorkerDTO,
    ShiftTypeDTO,
    AssignmentDTO,
    ConstraintDTO,
    SchedulingContext,
    RuleValidationService,
    RuleEvaluationService,
    RuleConflictService,
    RuleTemplateFactory
)

class TestRulesEngine(unittest.TestCase):

    def setUp(self):
        self.worker_1 = WorkerDTO(
            id="w1",
            employee_number="EMP001",
            first_name="Alice",
            last_name="Smith",
            department_id="dept1",
            weekly_contract_hours=40.0
        )
        self.worker_2 = WorkerDTO(
            id="w2",
            employee_number="EMP002",
            first_name="Bob",
            last_name="Jones",
            department_id="dept1",
            weekly_contract_hours=40.0
        )

        self.shift_morning = ShiftTypeDTO(
            id="s_morning",
            name="Morning",
            start_time=time(8, 0),
            end_time=time(16, 0),
            duration=8.0,
            is_night_shift=False
        )
        self.shift_night = ShiftTypeDTO(
            id="s_night",
            name="Night",
            start_time=time(22, 0),
            end_time=time(6, 0),
            duration=8.0,
            is_night_shift=True
        )

        self.context = SchedulingContext(
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 31),
            workers={"w1": self.worker_1, "w2": self.worker_2},
            shift_types={"s_morning": self.shift_morning, "s_night": self.shift_night}
        )
        self.eval_service = RuleEvaluationService()

    def test_vacation_blocking(self):
        target_date = date(2026, 8, 10)
        self.context.worker_constraints.append(ConstraintDTO(
            worker_id="w1",
            rule_type=RuleType.VACATION,
            category=RuleCategory.HARD,
            start_date=date(2026, 8, 8),
            end_date=date(2026, 8, 15)
        ))

        result = self.eval_service.evaluate_worker_assignment(
            context=self.context,
            worker_id="w1",
            target_date=target_date,
            shift_type_id="s_morning"
        )

        self.assertFalse(result.is_eligible)
        self.assertTrue(result.has_hard_violations)
        self.assertEqual(len(result.violations), 1)
        self.assertEqual(result.violations[0].code, "ERR_VACATION")

    def test_weekend_blocking(self):
        saturday = date(2026, 8, 1)  # Saturday
        self.context.worker_constraints.append(ConstraintDTO(
            worker_id="w1",
            rule_type=RuleType.NO_WEEKENDS,
            category=RuleCategory.HARD,
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 31)
        ))

        result = self.eval_service.evaluate_worker_assignment(
            context=self.context,
            worker_id="w1",
            target_date=saturday,
            shift_type_id="s_morning"
        )

        self.assertFalse(result.is_eligible)
        self.assertEqual(result.violations[0].code, "ERR_NO_WEEKENDS")

    def test_post_night_shift_rest_blocking(self):
        night_date = date(2026, 8, 5)
        next_date = date(2026, 8, 6)

        self.context.existing_assignments.append(AssignmentDTO(
            worker_id="w1",
            date=night_date,
            shift_type_id="s_night"
        ))

        result = self.eval_service.evaluate_worker_assignment(
            context=self.context,
            worker_id="w1",
            target_date=next_date,
            shift_type_id="s_morning"
        )

        self.assertFalse(result.is_eligible)
        self.assertEqual(result.violations[0].code, "ERR_POST_NIGHT_REST")

    def test_shift_type_restriction(self):
        target_date = date(2026, 8, 3)

        self.context.worker_constraints.append(ConstraintDTO(
            worker_id="w1",
            rule_type=RuleType.NO_SHIFT_TYPE,
            category=RuleCategory.HARD,
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 31),
            metadata_json={"shift_type_id": "s_night"}
        ))

        result_night = self.eval_service.evaluate_worker_assignment(
            context=self.context,
            worker_id="w1",
            target_date=target_date,
            shift_type_id="s_night"
        )
        self.assertFalse(result_night.is_eligible)

        result_morning = self.eval_service.evaluate_worker_assignment(
            context=self.context,
            worker_id="w1",
            target_date=target_date,
            shift_type_id="s_morning"
        )
        self.assertTrue(result_morning.is_eligible)

    def test_rule_validation_service(self):
        is_valid, msg = RuleValidationService.validate_constraint_data(
            rule_type=RuleType.VACATION,
            category=RuleCategory.HARD,
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 5),
            priority=1
        )
        self.assertTrue(is_valid)

        is_valid_bad, msg_bad = RuleValidationService.validate_constraint_data(
            rule_type=RuleType.VACATION,
            category=RuleCategory.HARD,
            start_date=date(2026, 8, 10),
            end_date=date(2026, 8, 5),
            priority=1
        )
        self.assertFalse(is_valid_bad)
        self.assertIn("cannot be after", msg_bad)

    def test_conflict_detection_service(self):
        conflict_service = RuleConflictService(self.eval_service)
        vac_date = date(2026, 8, 10)

        self.context.worker_constraints.append(ConstraintDTO(
            worker_id="w1",
            rule_type=RuleType.VACATION,
            category=RuleCategory.HARD,
            start_date=date(2026, 8, 8),
            end_date=date(2026, 8, 12)
        ))

        self.context.existing_assignments.append(AssignmentDTO(
            worker_id="w1",
            date=vac_date,
            shift_type_id="s_morning"
        ))

        report = conflict_service.detect_schedule_conflicts(self.context)
        self.assertFalse(report.is_feasible)
        self.assertEqual(report.hard_conflicts_count, 1)
        self.assertEqual(len(report.conflicts), 1)

    def test_rule_template_factory(self):
        template = RuleTemplateFactory.build_constraint_from_template(
            template_key="NO_WEEKENDS",
            worker_id="w1",
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 31)
        )

        self.assertEqual(template.rule_type, RuleType.NO_WEEKENDS)
        self.assertEqual(template.category, RuleCategory.HARD)
        self.assertTrue(template.enabled)

if __name__ == "__main__":
    unittest.main()
