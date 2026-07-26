import unittest
import uuid
from fastapi.testclient import TestClient
from app.main import app

class TestHealthEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check_returns_200(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["database"])
        self.assertEqual(data["version"], "1.0.0")

    def test_readiness_returns_200(self):
        response = self.client.get("/api/v1/ready")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ready")

    def test_root_returns_project_info(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("name", data)
        self.assertIn("docs", data)
        self.assertIn("api_v1", data)

class TestAuthFlow(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def _get_admin_token(self):
        response = self.client.post("/api/v1/auth/login", data={
            "username": "admin@admin.com",
            "password": "!23QWEasd"
        })
        self.assertEqual(response.status_code, 200)
        return response.json()["access_token"]

    def test_login_with_valid_credentials(self):
        token = self._get_admin_token()
        self.assertIsNotNone(token)

    def test_login_with_invalid_credentials(self):
        response = self.client.post("/api/v1/auth/login", data={
            "username": "admin@admin.com",
            "password": "WrongPassword"
        })
        self.assertEqual(response.status_code, 401)

    def test_get_me_with_valid_token(self):
        token = self._get_admin_token()
        response = self.client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["username"], "admin")
        self.assertEqual(data["role"], "ADMIN")

    def test_protected_route_without_token(self):
        response = self.client.get("/api/v1/workers")
        self.assertEqual(response.status_code, 401)

class TestWorkerCRUD(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.token = self._get_admin_token()
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def _get_admin_token(self):
        response = self.client.post("/api/v1/auth/login", data={
            "username": "admin@admin.com",
            "password": "!23QWEasd"
        })
        return response.json()["access_token"]

    def test_create_and_get_worker(self):
        emp_num = f"TEST-{uuid.uuid4().hex[:6].upper()}"
        response = self.client.post("/api/v1/workers", json={
            "employee_number": emp_num,
            "first_name": "Test",
            "last_name": "Worker",
            "email": f"{emp_num.lower()}@test.com",
            "weekly_contract_hours": 40.0
        }, headers=self.headers)
        self.assertEqual(response.status_code, 201)
        worker_id = response.json()["id"]

        # GET
        get_resp = self.client.get(f"/api/v1/workers/{worker_id}", headers=self.headers)
        self.assertEqual(get_resp.status_code, 200)
        self.assertEqual(get_resp.json()["employee_number"], emp_num)

    def test_list_workers(self):
        response = self.client.get("/api/v1/workers", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_update_worker(self):
        emp_num = f"UPD-{uuid.uuid4().hex[:6].upper()}"
        create_resp = self.client.post("/api/v1/workers", json={
            "employee_number": emp_num,
            "first_name": "Original",
            "last_name": "Name"
        }, headers=self.headers)
        worker_id = create_resp.json()["id"]

        patch_resp = self.client.patch(f"/api/v1/workers/{worker_id}", json={
            "first_name": "Updated"
        }, headers=self.headers)
        self.assertEqual(patch_resp.status_code, 200)
        self.assertEqual(patch_resp.json()["first_name"], "Updated")

    def test_create_worker_duplicate_emp_number(self):
        emp_num = f"DUP-{uuid.uuid4().hex[:6].upper()}"
        self.client.post("/api/v1/workers", json={
            "employee_number": emp_num, "first_name": "A", "last_name": "B"
        }, headers=self.headers)
        dup_resp = self.client.post("/api/v1/workers", json={
            "employee_number": emp_num, "first_name": "C", "last_name": "D"
        }, headers=self.headers)
        self.assertEqual(dup_resp.status_code, 400)

    def test_get_nonexistent_worker(self):
        fake_id = str(uuid.uuid4())
        response = self.client.get(f"/api/v1/workers/{fake_id}", headers=self.headers)
        self.assertEqual(response.status_code, 404)

class TestShiftTypeCRUD(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        resp = self.client.post("/api/v1/auth/login", data={
            "username": "admin@admin.com", "password": "!23QWEasd"
        })
        self.headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}

    def test_create_and_list_shift_types(self):
        name = f"Morning-{uuid.uuid4().hex[:4]}"
        create_resp = self.client.post("/api/v1/shift-types", json={
            "name": name,
            "start_time": "08:00:00",
            "end_time": "16:00:00",
            "duration": 8.0,
            "is_night_shift": False
        }, headers=self.headers)
        self.assertEqual(create_resp.status_code, 201)

        list_resp = self.client.get("/api/v1/shift-types", headers=self.headers)
        self.assertEqual(list_resp.status_code, 200)
        names = [s["name"] for s in list_resp.json()]
        self.assertIn(name, names)

class TestRuleCRUD(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        resp = self.client.post("/api/v1/auth/login", data={
            "username": "admin@admin.com", "password": "!23QWEasd"
        })
        self.headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}

    def _create_worker(self):
        emp = f"RUL-{uuid.uuid4().hex[:6].upper()}"
        resp = self.client.post("/api/v1/workers", json={
            "employee_number": emp, "first_name": "Rule", "last_name": "Test"
        }, headers=self.headers)
        return resp.json()["id"]

    def test_create_and_list_worker_rules(self):
        worker_id = self._create_worker()
        create_resp = self.client.post(f"/api/v1/workers/{worker_id}/rules", json={
            "constraint_type": "VACATION",
            "start_date": "2026-08-01",
            "end_date": "2026-08-10",
            "priority": 1
        }, headers=self.headers)
        self.assertEqual(create_resp.status_code, 201)

        list_resp = self.client.get(f"/api/v1/workers/{worker_id}/rules", headers=self.headers)
        self.assertEqual(list_resp.status_code, 200)
        self.assertEqual(len(list_resp.json()), 1)

    def test_create_rule_invalid_dates(self):
        worker_id = self._create_worker()
        resp = self.client.post(f"/api/v1/workers/{worker_id}/rules", json={
            "constraint_type": "VACATION",
            "start_date": "2026-08-15",
            "end_date": "2026-08-01"
        }, headers=self.headers)
        self.assertEqual(resp.status_code, 400)

    def test_update_and_delete_rule(self):
        worker_id = self._create_worker()
        create_resp = self.client.post(f"/api/v1/workers/{worker_id}/rules", json={
            "constraint_type": "NO_WEEKENDS",
            "start_date": "2026-08-01",
            "end_date": "2026-08-31"
        }, headers=self.headers)
        rule_id = create_resp.json()["id"]

        patch_resp = self.client.patch(f"/api/v1/rules/{rule_id}", json={
            "enabled": False
        }, headers=self.headers)
        self.assertEqual(patch_resp.status_code, 200)
        self.assertFalse(patch_resp.json()["enabled"])

        del_resp = self.client.delete(f"/api/v1/rules/{rule_id}", headers=self.headers)
        self.assertEqual(del_resp.status_code, 200)

class TestScheduleCRUD(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        resp = self.client.post("/api/v1/auth/login", data={
            "username": "admin@admin.com", "password": "!23QWEasd"
        })
        self.headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}

    def test_create_schedule(self):
        resp = self.client.post("/api/v1/schedules", json={
            "month": 8,
            "year": 2026,
            "shift_instances": []
        }, headers=self.headers)
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()["month"], 8)
        self.assertEqual(resp.json()["status"], "DRAFT")

    def test_get_schedule_details(self):
        create_resp = self.client.post("/api/v1/schedules", json={
            "month": 9, "year": 2026
        }, headers=self.headers)
        schedule_id = create_resp.json()["id"]

        detail_resp = self.client.get(f"/api/v1/schedules/{schedule_id}", headers=self.headers)
        self.assertEqual(detail_resp.status_code, 200)
        self.assertIn("shift_instances", detail_resp.json())

    def test_update_schedule_status(self):
        create_resp = self.client.post("/api/v1/schedules", json={
            "month": 10, "year": 2026
        }, headers=self.headers)
        schedule_id = create_resp.json()["id"]

        patch_resp = self.client.patch(f"/api/v1/schedules/{schedule_id}", json={
            "status": "PUBLISHED"
        }, headers=self.headers)
        self.assertEqual(patch_resp.status_code, 200)
        self.assertEqual(patch_resp.json()["status"], "PUBLISHED")

    def test_get_nonexistent_schedule(self):
        fake_id = str(uuid.uuid4())
        resp = self.client.get(f"/api/v1/schedules/{fake_id}", headers=self.headers)
        self.assertEqual(resp.status_code, 404)

class TestScheduleDiagnostics(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        resp = self.client.post("/api/v1/auth/login", data={
            "username": "admin@admin.com", "password": "!23QWEasd"
        })
        self.headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}

    def test_coverage_endpoint(self):
        create_resp = self.client.post("/api/v1/schedules", json={
            "month": 11, "year": 2026
        }, headers=self.headers)
        schedule_id = create_resp.json()["id"]

        cov_resp = self.client.get(f"/api/v1/schedules/{schedule_id}/coverage", headers=self.headers)
        self.assertEqual(cov_resp.status_code, 200)
        data = cov_resp.json()
        self.assertIn("coverage_percentage", data)
        self.assertEqual(data["total_required_workers"], 0)

    def test_conflicts_endpoint(self):
        create_resp = self.client.post("/api/v1/schedules", json={
            "month": 12, "year": 2026
        }, headers=self.headers)
        schedule_id = create_resp.json()["id"]

        conf_resp = self.client.get(f"/api/v1/schedules/{schedule_id}/conflicts", headers=self.headers)
        self.assertEqual(conf_resp.status_code, 200)
        data = conf_resp.json()
        self.assertTrue(data["is_feasible"])

if __name__ == "__main__":
    unittest.main()
