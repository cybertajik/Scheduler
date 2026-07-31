import unittest
import uuid
from app.schemas.employee_portal import (
    VacationRequestCreate,
    VacationRequestOut,
    ShiftSwapCreate,
    ShiftSwapOut,
    AvailabilitySubmissionCreate,
    EmployeeProfileUpdate
)


class TestEmployeePortal(unittest.TestCase):
    def test_vacation_request_dto(self):
        dto = VacationRequestCreate(
            start_date="2026-08-10",
            end_date="2026-08-15",
            reason="Summer family vacation"
        )
        self.assertEqual(dto.start_date, "2026-08-10")
        self.assertEqual(dto.reason, "Summer family vacation")

    def test_shift_swap_dto(self):
        swap_dto = ShiftSwapCreate(
            target_worker_id="w-456",
            requestor_assignment_id="asgn-789",
            notes="Trade morning shift for evening shift"
        )
        self.assertEqual(swap_dto.target_worker_id, "w-456")

    def test_availability_submission_dto(self):
        avail_dto = AvailabilitySubmissionCreate(
            date="2026-08-20",
            availability_type="UNAVAILABLE",
            notes="Medical appointment"
        )
        self.assertEqual(avail_dto.availability_type, "UNAVAILABLE")


if __name__ == "__main__":
    unittest.main()
