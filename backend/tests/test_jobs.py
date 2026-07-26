import unittest
import uuid
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app

class TestJobsAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        login_resp = self.client.post("/api/v1/auth/login", data={
            "username": "admin@admin.com",
            "password": "!23QWEasd"
        })
        self.assertEqual(login_resp.status_code, 200)
        data = login_resp.json()
        self.admin_token = data["access_token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}

    @patch("app.api.v1.endpoints.jobs.generate_schedule_task.delay")
    def test_submit_generate_job(self, mock_task_delay):
        mock_task = MagicMock()
        mock_task.id = "test-job-uuid-123"
        mock_task.status = "PENDING"
        mock_task_delay.return_value = mock_task

        schedule_id = str(uuid.uuid4())
        response = self.client.post(
            "/api/v1/jobs/generate",
            json={"schedule_id": schedule_id, "max_solver_time_seconds": 30},
            headers=self.admin_headers
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["job_id"], "test-job-uuid-123")
        self.assertEqual(data["schedule_id"], schedule_id)
        self.assertEqual(data["status"], "PENDING")

    @patch("app.api.v1.endpoints.jobs.AsyncResult")
    def test_get_job_progress(self, mock_async_result):
        mock_task = MagicMock()
        mock_task.state = "SUCCESS"
        mock_async_result.return_value = mock_task

        response = self.client.get(
            "/api/v1/jobs/test-job-uuid-123/progress",
            headers=self.admin_headers
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["job_id"], "test-job-uuid-123")
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["progress_percentage"], 100)
