import unittest
import uuid
from fastapi.testclient import TestClient
from app.main import app

class TestAuthAndSecurityLayer(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Login as default seed Admin
        login_resp = self.client.post("/api/v1/auth/login", data={
            "username": "admin@admin.com",
            "password": "!23QWEasd"
        })
        self.assertEqual(login_resp.status_code, 200)
        data = login_resp.json()
        self.admin_token = data["access_token"]
        self.admin_refresh = data["refresh_token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}

    def test_login_returns_tokens_and_metadata(self):
        login_resp = self.client.post("/api/v1/auth/login", data={
            "username": "admin@admin.com",
            "password": "!23QWEasd"
        })
        self.assertEqual(login_resp.status_code, 200)
        data = login_resp.json()
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        self.assertIn(data["user_role"], ["ADMIN", "SUPER_ADMIN"])
        self.assertEqual(data["token_type"], "bearer")

    def test_login_invalid_credentials(self):
        response = self.client.post("/api/v1/auth/login", data={
            "username": "admin@admin.com",
            "password": "WrongPassword!"
        })
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Incorrect email or password")

    def test_refresh_token_issuance(self):
        response = self.client.post("/api/v1/auth/refresh", json={
            "refresh_token": self.admin_refresh
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)

    def test_logout_revokes_token(self):
        # Create a fresh token for a temporary user to logout
        user_suffix = uuid.uuid4().hex[:6]
        create_user_resp = self.client.post("/api/v1/users", json={
            "username": f"logout_user_{user_suffix}",
            "email": f"logout_{user_suffix}@test.com",
            "password": "Password123!",
            "first_name": "Logout",
            "last_name": "Test",
            "role": "EMPLOYEE"
        }, headers=self.admin_headers)
        self.assertEqual(create_user_resp.status_code, 201)

        # Login temporary user
        temp_login = self.client.post("/api/v1/auth/login", data={
            "username": f"logout_{user_suffix}@test.com",
            "password": "Password123!"
        })
        temp_token = temp_login.json()["access_token"]
        temp_headers = {"Authorization": f"Bearer {temp_token}"}

        # Request /auth/me before logout -> 200 OK
        me_resp = self.client.get("/api/v1/auth/me", headers=temp_headers)
        self.assertEqual(me_resp.status_code, 200)

        # Logout
        logout_resp = self.client.post("/api/v1/auth/logout", headers=temp_headers)
        self.assertEqual(logout_resp.status_code, 200)

        # Request /auth/me after logout -> 401 Unauthorized (revoked)
        me_resp_after = self.client.get("/api/v1/auth/me", headers=temp_headers)
        self.assertEqual(me_resp_after.status_code, 401)

    def test_password_complexity_enforcement(self):
        user_suffix = uuid.uuid4().hex[:6]
        # Attempt to create user with weak password (missing digit and special char)
        resp = self.client.post("/api/v1/users", json={
            "username": f"weak_{user_suffix}",
            "email": f"weak_{user_suffix}@test.com",
            "password": "weakpassword",
            "first_name": "Weak",
            "last_name": "Pass",
            "role": "EMPLOYEE"
        }, headers=self.admin_headers)
        self.assertEqual(resp.status_code, 400)

    def test_admin_user_management_crud(self):
        user_suffix = uuid.uuid4().hex[:6]
        # 1. Create User
        create_resp = self.client.post("/api/v1/users", json={
            "username": f"user_{user_suffix}",
            "email": f"user_{user_suffix}@test.com",
            "password": "SecurePass123!",
            "first_name": "Jane",
            "last_name": "Doe",
            "role": "SCHEDULER"
        }, headers=self.admin_headers)
        self.assertEqual(create_resp.status_code, 201)
        user_id = create_resp.json()["id"]

        # 2. List Users
        list_resp = self.client.get("/api/v1/users", headers=self.admin_headers)
        self.assertEqual(list_resp.status_code, 200)
        user_emails = [u["email"] for u in list_resp.json()]
        self.assertIn(f"user_{user_suffix}@test.com", user_emails)

        # 3. Update User Role & Name
        patch_resp = self.client.patch(f"/api/v1/users/{user_id}", json={
            "role": "MANAGER",
            "first_name": "Janet"
        }, headers=self.admin_headers)
        self.assertEqual(patch_resp.status_code, 200)
        self.assertEqual(patch_resp.json()["role"], "MANAGER")
        self.assertEqual(patch_resp.json()["first_name"], "Janet")

        # 4. Deactivate User via POST deactivate endpoint
        deact_resp = self.client.post(f"/api/v1/users/{user_id}/deactivate", headers=self.admin_headers)
        self.assertEqual(deact_resp.status_code, 200)

        # 5. Inactive User cannot login
        login_disabled = self.client.post("/api/v1/auth/login", data={
            "username": f"user_{user_suffix}@test.com",
            "password": "SecurePass123!"
        })
        self.assertIn(login_disabled.status_code, [401, 403])

        # 6. Activate User via POST activate endpoint
        act_resp = self.client.post(f"/api/v1/users/{user_id}/activate", headers=self.admin_headers)
        self.assertEqual(act_resp.status_code, 200)

        # 7. Delete User permanently
        del_resp = self.client.delete(f"/api/v1/users/{user_id}", headers=self.admin_headers)
        self.assertEqual(del_resp.status_code, 200)

        # Verify user is permanently removed from GET /users/{user_id}
        get_deleted = self.client.get(f"/api/v1/users/{user_id}", headers=self.admin_headers)
        self.assertEqual(get_deleted.status_code, 404)

    def test_admin_cannot_deactivate_or_delete_self(self):
        # Get admin details
        me_resp = self.client.get("/api/v1/auth/me", headers=self.admin_headers)
        self.assertEqual(me_resp.status_code, 200)
        admin_id = me_resp.json()["id"]

        # Admin attempts to deactivate self -> 400 Bad Request
        deact_self = self.client.post(f"/api/v1/users/{admin_id}/deactivate", headers=self.admin_headers)
        self.assertEqual(deact_self.status_code, 400)
        self.assertIn("cannot deactivate their own account", deact_self.json()["detail"].lower())

        # Admin attempts to delete self -> 400 Bad Request
        delete_self = self.client.delete(f"/api/v1/users/{admin_id}", headers=self.admin_headers)
        self.assertEqual(delete_self.status_code, 400)
        self.assertIn("cannot delete their own account", delete_self.json()["detail"].lower())

    def test_manager_and_scheduler_permission_boundaries(self):
        suffix = uuid.uuid4().hex[:6]
        
        # 1. Create Manager account as Admin
        mgr_create = self.client.post("/api/v1/users", json={
            "username": f"mgr_{suffix}",
            "email": f"mgr_{suffix}@test.com",
            "password": "Password123!",
            "first_name": "Manager",
            "last_name": "User",
            "role": "MANAGER"
        }, headers=self.admin_headers)
        self.assertEqual(mgr_create.status_code, 201)

        # 2. Login as Manager
        mgr_login = self.client.post("/api/v1/auth/login", data={
            "username": f"mgr_{suffix}@test.com",
            "password": "Password123!"
        })
        mgr_headers = {"Authorization": f"Bearer {mgr_login.json()['access_token']}"}

        # 3. Manager can list users
        mgr_list = self.client.get("/api/v1/users", headers=mgr_headers)
        self.assertEqual(mgr_list.status_code, 200)

        # 4. Manager can create Scheduler and Employee
        sch_create = self.client.post("/api/v1/users", json={
            "username": f"sch_{suffix}",
            "email": f"sch_{suffix}@test.com",
            "password": "Password123!",
            "first_name": "Scheduler",
            "last_name": "Sub",
            "role": "SCHEDULER"
        }, headers=mgr_headers)
        self.assertEqual(sch_create.status_code, 201)
        sch_id = sch_create.json()["id"]

        # 5. Manager CANNOT create Admin or Manager
        adm_fail = self.client.post("/api/v1/users", json={
            "username": f"fakeadmin_{suffix}",
            "email": f"fakeadmin_{suffix}@test.com",
            "password": "Password123!",
            "first_name": "Fake",
            "last_name": "Admin",
            "role": "ADMIN"
        }, headers=mgr_headers)
        self.assertEqual(adm_fail.status_code, 403)

        # 6. Manager CAN delete created Scheduler
        sch_del = self.client.delete(f"/api/v1/users/{sch_id}", headers=mgr_headers)
        self.assertEqual(sch_del.status_code, 200)

        # 7. Manager CANNOT delete Admin
        me_admin = self.client.get("/api/v1/auth/me", headers=self.admin_headers).json()["id"]
        mgr_del_admin = self.client.delete(f"/api/v1/users/{me_admin}", headers=mgr_headers)
        self.assertEqual(mgr_del_admin.status_code, 403)

        # 8. Login as Scheduler and verify user management is 403 Forbidden
        sch_user_create = self.client.post("/api/v1/users", json={
            "username": f"sch_real_{suffix}",
            "email": f"sch_real_{suffix}@test.com",
            "password": "Password123!",
            "first_name": "Sch",
            "last_name": "User",
            "role": "SCHEDULER"
        }, headers=self.admin_headers)
        sch_real_id = sch_user_create.json()["id"]

        sch_login = self.client.post("/api/v1/auth/login", data={
            "username": f"sch_real_{suffix}@test.com",
            "password": "Password123!"
        })
        sch_headers = {"Authorization": f"Bearer {sch_login.json()['access_token']}"}

        # Scheduler list users -> 403
        sch_list = self.client.get("/api/v1/users", headers=sch_headers)
        self.assertEqual(sch_list.status_code, 403)

    def test_non_admin_forbidden_from_user_management(self):
        user_suffix = uuid.uuid4().hex[:6]
        # Create non-admin employee
        self.client.post("/api/v1/users", json={
            "username": f"emp_{user_suffix}",
            "email": f"emp_{user_suffix}@test.com",
            "password": "Password123!",
            "first_name": "Regular",
            "last_name": "Employee",
            "role": "EMPLOYEE"
        }, headers=self.admin_headers)

        # Login as employee
        emp_login = self.client.post("/api/v1/auth/login", data={
            "username": f"emp_{user_suffix}@test.com",
            "password": "Password123!"
        })
        emp_token = emp_login.json()["access_token"]
        emp_headers = {"Authorization": f"Bearer {emp_token}"}

        # Employee tries to list users -> 403 Forbidden
        list_forbidden = self.client.get("/api/v1/users", headers=emp_headers)
        self.assertEqual(list_forbidden.status_code, 403)

    def test_security_headers_present(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(response.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(response.headers.get("X-XSS-Protection"), "1; mode=block")

if __name__ == "__main__":
    unittest.main()

