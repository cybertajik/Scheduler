import unittest
import uuid
from datetime import date, datetime
from app.models import Schedule, ScheduleStatus, ShiftInstance, Assignment, Worker, ShiftType, User, UserRole
from app.models.sandbox import SandboxSchedule, SandboxShiftInstance, SandboxAssignment, SandboxVersion
from app.schemas.sandbox import SandboxCreate, SandboxUpdate, SandboxSimulationRequest
from app.services.sandbox_service import SandboxService
from app.services.scenario_simulation_engine import ScenarioSimulationEngine
from app.services.schedule_comparison_engine import ScheduleComparisonEngine


class TestSandboxModule(unittest.TestCase):
    def test_sandbox_create_and_lifecycle_dto(self):
        create_dto = SandboxCreate(
            parent_schedule_id=None,
            name="Test Scenario Sandbox",
            description="Testing sick call simulation",
            year=2026,
            month=8,
            scenario_type="SICK_CALL"
        )
        self.assertEqual(create_dto.name, "Test Scenario Sandbox")
        self.assertEqual(create_dto.scenario_type, "SICK_CALL")

    def test_sandbox_simulation_request_dto(self):
        sim_req = SandboxSimulationRequest(
            scenario_type="SICK_CALL",
            employee_id="worker-123",
            dates=["2026-08-01", "2026-08-02"],
            notes="Employee called in sick with flu"
        )
        self.assertEqual(sim_req.scenario_type, "SICK_CALL")
        self.assertEqual(len(sim_req.dates), 2)
        self.assertEqual(sim_req.employee_id, "worker-123")


if __name__ == "__main__":
    unittest.main()
