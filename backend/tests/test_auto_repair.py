import unittest
import uuid
from app.schemas.auto_repair import (
    ConflictDiagnosticItem,
    RepairActionItem,
    ExplainabilityReport,
    RepairPlanOut
)
from app.services.auto_repair_engine import AutoRepairEngine


class TestAutoRepairEngine(unittest.TestCase):
    def test_conflict_diagnostic_item_structure(self):
        item = ConflictDiagnosticItem(
            id="c-1",
            category="VACATION",
            severity="HARD",
            worker_id="w-1",
            worker_name="Alice Smith",
            date="2026-08-01",
            details="Vacation conflict detected for Alice Smith"
        )
        self.assertEqual(item.category, "VACATION")
        self.assertEqual(item.severity, "HARD")

    def test_repair_action_item_structure(self):
        action = RepairActionItem(
            action_type="SWAP",
            date="2026-08-01",
            shift_instance_id="inst-1",
            shift_name="Morning",
            original_worker_id="w-1",
            original_worker_name="Alice Smith",
            target_worker_id="w-2",
            target_worker_name="Bob Jones",
            notes="Substituted Alice Smith with Bob Jones"
        )
        self.assertEqual(action.action_type, "SWAP")
        self.assertEqual(action.target_worker_name, "Bob Jones")

    def test_explainability_report_structure(self):
        report = ExplainabilityReport(
            conflict_detected="Vacation conflict on 2026-08-01",
            root_cause="Scheduled during approved leave",
            repair_performed="Reassigned to Bob Jones",
            employees_affected=["Alice Smith", "Bob Jones"],
            reason_chosen="Lowest disruption to schedule",
            alternatives_considered=["Overtime authorization"],
            expected_impact="Restores coverage with 0 overtime cost"
        )
        self.assertEqual(len(report.employees_affected), 2)
        self.assertEqual(report.reason_chosen, "Lowest disruption to schedule")


if __name__ == "__main__":
    unittest.main()
