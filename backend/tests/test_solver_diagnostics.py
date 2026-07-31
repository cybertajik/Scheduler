import unittest
from datetime import date
from app.solver.dtos import (
    SolverInputDTO,
    ShiftInstanceRequirementDTO,
    SolverResultDTO,
    SolverAssignmentDTO
)
from app.rules.dtos import WorkerDTO, ShiftTypeDTO, ConstraintDTO
from app.solver.diagnostics.decision_diagnostics_engine import DecisionDiagnosticsEngine
from app.solver.services.schedule_solver_service import ScheduleSolverService


class TestSolverDiagnosticsEngine(unittest.TestCase):
    def setUp(self):
        self.worker1 = WorkerDTO(id="w1", first_name="Alice", last_name="Smith", name="Alice Smith", weekly_contract_hours=40.0)
        self.worker2 = WorkerDTO(id="w2", first_name="Bob", last_name="Jones", name="Bob Jones", weekly_contract_hours=40.0)
        self.shift_morning = ShiftTypeDTO(id="s1", name="Morning", code="MOR", is_night_shift=False)
        self.shift_night = ShiftTypeDTO(id="s2", name="Night", code="NIG", is_night_shift=True)

        self.input_data = SolverInputDTO(
            schedule_id="test-sched-123",
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 2),
            workers={"w1": self.worker1, "w2": self.worker2},
            shift_types={"s1": self.shift_morning, "s2": self.shift_night},
            shift_requirements=[
                ShiftInstanceRequirementDTO(id="req1", date=date(2026, 8, 1), shift_type_id="s1", required_workers=1),
                ShiftInstanceRequirementDTO(id="req2", date=date(2026, 8, 1), shift_type_id="s2", required_workers=1),
            ],
            worker_constraints=[
                ConstraintDTO(
                    id="c1",
                    worker_id="w1",
                    rule_type="VACATION",
                    category="HARD",
                    start_date=date(2026, 8, 1),
                    end_date=date(2026, 8, 1),
                    enabled=True
                )
            ]
        )

    def test_evaluate_successful_diagnostics(self):
        result_dto = SolverResultDTO(
            schedule_id="test-sched-123",
            status="OPTIMAL",
            is_solved=True,
            objective_score=100.0,
            solver_runtime_seconds=0.15,
            total_shifts_required=2,
            total_shifts_assigned=2,
            assignments=[
                SolverAssignmentDTO(shift_instance_id="req1", worker_id="w2", worker_name="Bob Jones", date=date(2026, 8, 1), shift_type_id="s1", shift_name="Morning"),
                SolverAssignmentDTO(shift_instance_id="req2", worker_id="w2", worker_name="Bob Jones", date=date(2026, 8, 1), shift_type_id="s2", shift_name="Night")
            ]
        )

        diag = DecisionDiagnosticsEngine.evaluate(self.input_data, result_dto)
        self.assertEqual(diag.status, "OPTIMAL")
        self.assertIsNotNone(diag.solver_statistics)
        self.assertEqual(diag.solver_statistics.variables_created, 2 * 2 * 2)
        self.assertIsNotNone(diag.successful_diagnostics)
        self.assertEqual(diag.successful_diagnostics.coverage_percentage, 100.0)
        self.assertEqual(diag.successful_diagnostics.total_assigned_shifts, 2)
        self.assertGreater(len(diag.constraint_diagnostics), 0)
        self.assertGreater(len(diag.suggested_fixes), 0)

    def test_evaluate_failed_diagnostics(self):
        result_dto = SolverResultDTO(
            schedule_id="test-sched-123",
            status="INFEASIBLE",
            is_solved=False,
            objective_score=0.0,
            solver_runtime_seconds=0.05,
            total_shifts_required=2,
            total_shifts_assigned=0
        )

        diag = DecisionDiagnosticsEngine.evaluate(self.input_data, result_dto)
        self.assertEqual(diag.status, "INFEASIBLE")
        self.assertIsNotNone(diag.failed_diagnostics)
        self.assertTrue(diag.failed_diagnostics.is_infeasible)
        self.assertGreater(len(diag.failed_diagnostics.ranked_reasons), 0)

    def test_schedule_solver_service_returns_diagnostics(self):
        service = ScheduleSolverService()
        result = service.solve(self.input_data)
        self.assertIsNotNone(result.comprehensive_diagnostics)
        self.assertIn("solver_statistics", result.comprehensive_diagnostics)
        self.assertIn("suggested_fixes", result.comprehensive_diagnostics)


if __name__ == "__main__":
    unittest.main()
