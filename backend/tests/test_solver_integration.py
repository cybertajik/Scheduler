import unittest
from datetime import date, time
from app.rules.dtos import WorkerDTO, ShiftTypeDTO, ConstraintDTO
from app.rules.enums import RuleType, RuleCategory
from app.solver import (
    SolverConfigDTO,
    ShiftInstanceRequirementDTO,
    LockedAssignmentDTO,
    SolverInputDTO,
    ScheduleSolverService
)

class TestSolverIntegration(unittest.TestCase):

    def setUp(self):
        self.worker_1 = WorkerDTO(
            id="w1", employee_number="EMP01", first_name="Alice", last_name="Smith", department_id="d1"
        )
        self.worker_2 = WorkerDTO(
            id="w2", employee_number="EMP02", first_name="Bob", last_name="Jones", department_id="d1"
        )
        self.worker_3 = WorkerDTO(
            id="w3", employee_number="EMP03", first_name="Charlie", last_name="Brown", department_id="d1"
        )

        self.shift_morning = ShiftTypeDTO(
            id="s_morn", name="Morning", start_time=time(8, 0), end_time=time(16, 0), duration=8.0, is_night_shift=False
        )
        self.shift_night = ShiftTypeDTO(
            id="s_night", name="Night", start_time=time(22, 0), end_time=time(6, 0), duration=8.0, is_night_shift=True
        )

        self.solver_service = ScheduleSolverService()

    def test_valid_schedule_generation(self):
        reqs = [
            ShiftInstanceRequirementDTO(id="r1", date=date(2026, 8, 1), shift_type_id="s_morn", required_workers=1),
            ShiftInstanceRequirementDTO(id="r2", date=date(2026, 8, 2), shift_type_id="s_morn", required_workers=1)
        ]

        input_data = SolverInputDTO(
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 2),
            workers={"w1": self.worker_1, "w2": self.worker_2},
            shift_types={"s_morn": self.shift_morning},
            shift_requirements=reqs,
            config=SolverConfigDTO(time_limit_seconds=10)
        )

        result = self.solver_service.solve(input_data)
        self.assertTrue(result.is_solved)
        self.assertEqual(result.total_shifts_assigned, 2)
        self.assertEqual(len(result.assignments), 2)

    def test_night_shift_rest_enforcement(self):
        # Shift reqs: Night on 2026-08-01, Morning on 2026-08-02
        reqs = [
            ShiftInstanceRequirementDTO(id="r1", date=date(2026, 8, 1), shift_type_id="s_night", required_workers=1),
            ShiftInstanceRequirementDTO(id="r2", date=date(2026, 8, 2), shift_type_id="s_morn", required_workers=1)
        ]

        # Only 1 worker in pool (w1)
        input_data = SolverInputDTO(
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 2),
            workers={"w1": self.worker_1},
            shift_types={"s_morn": self.shift_morning, "s_night": self.shift_night},
            shift_requirements=reqs,
            config=SolverConfigDTO(time_limit_seconds=10)
        )

        # Since post-night rest prevents w1 from working on Aug 2, schedule must leave Aug 2 unfilled
        result = self.solver_service.solve(input_data)
        self.assertTrue(result.is_solved)
        self.assertTrue(result.is_partial)
        self.assertEqual(result.total_unfilled_shifts, 1)

    def test_locked_assignment_protection(self):
        reqs = [
            ShiftInstanceRequirementDTO(id="r1", date=date(2026, 8, 1), shift_type_id="s_morn", required_workers=1)
        ]
        locks = [
            LockedAssignmentDTO(shift_instance_id="r1", worker_id="w2", date=date(2026, 8, 1), shift_type_id="s_morn")
        ]

        input_data = SolverInputDTO(
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 1),
            workers={"w1": self.worker_1, "w2": self.worker_2},
            shift_types={"s_morn": self.shift_morning},
            shift_requirements=reqs,
            locked_assignments=locks
        )

        result = self.solver_service.solve(input_data)
        self.assertTrue(result.is_solved)
        self.assertEqual(len(result.assignments), 1)
        self.assertEqual(result.assignments[0].worker_id, "w2")
        self.assertTrue(result.assignments[0].is_locked)

    def test_infeasibility_diagnostics(self):
        # 5 required shifts on 1 day with only 2 workers
        reqs = [
            ShiftInstanceRequirementDTO(id="r1", date=date(2026, 8, 1), shift_type_id="s_morn", required_workers=5)
        ]

        input_data = SolverInputDTO(
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 1),
            workers={"w1": self.worker_1, "w2": self.worker_2},
            shift_types={"s_morn": self.shift_morning},
            shift_requirements=reqs
        )

        diagnostics = self.solver_service.explain_infeasibility(input_data)
        self.assertTrue(diagnostics.is_infeasible)
        self.assertGreater(len(diagnostics.root_causes), 0)
        self.assertIn("exceeds total available workers", diagnostics.root_causes[0])

if __name__ == "__main__":
    unittest.main()
