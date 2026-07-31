import unittest
import uuid
from datetime import timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import create_access_token, create_refresh_token, validate_password_complexity, get_password_hash
from app.services.import_service import ImportService
from app.models.enums import UserRole
from app.core.database import SessionLocal
from app.models import User, Organization

class TestSecurityHardeningSuite(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

        # Ensure seed users exist in local test session if missing
        db = SessionLocal()
        try:
            po = db.query(User).filter(User.email == "admin@admin.com").first()
            if not po:
                po = User(
                    username="admin",
                    email="admin@admin.com",
                    password_hash=get_password_hash("!23QWEasd"),
                    first_name="Product",
                    last_name="Owner",
                    role=UserRole.SUPER_ADMIN,
                    active=True
                )
                db.add(po)

            org1 = db.query(Organization).filter(Organization.slug == "test-org-1").first()
            if not org1:
                org1 = Organization(
                    name="Test Organisation 1",
                    slug="test-org-1",
                    domain="org1.scheduler.local",
                    contact_email="testorg1@org.com",
                    billing_cycle="MONTHLY",
                    subscription_status="ACTIVE",
                    active=True
                )
                db.add(org1)
                db.flush()

            mgr1 = db.query(User).filter(User.email == "testorg1@org.com").first()
            if not mgr1:
                mgr1 = User(
                    organization_id=org1.id,
                    username="testorg1",
                    email="testorg1@org.com",
                    password_hash=get_password_hash("!23QWEasd"),
                    first_name="Alex",
                    last_name="Vance",
                    role=UserRole.ORG_ADMIN,
                    active=True
                )
                db.add(mgr1)

            db.commit()
        finally:
            db.close()

        # Login as Product Owner
        res = self.client.post("/api/v1/auth/login", data={"username": "admin@admin.com", "password": "!23QWEasd"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.po_token = data["access_token"]
        self.po_refresh = data["refresh_token"]
        self.po_headers = {"Authorization": f"Bearer {self.po_token}"}

        # Login as Test Org 1 Manager
        res1 = self.client.post("/api/v1/auth/login", data={"username": "testorg1@org.com", "password": "!23QWEasd"})
        self.assertEqual(res1.status_code, 200)
        data1 = res1.json()
        self.org1_token = data1["access_token"]
        self.org1_headers = {"Authorization": f"Bearer {self.org1_token}"}

    def test_invalid_login_credentials(self):
        res = self.client.post("/api/v1/auth/login", data={"username": "admin@admin.com", "password": "WrongPassword99!"})
        self.assertEqual(res.status_code, 401)

    def test_expired_token_rejected(self):
        # Create an expired token (expired 10 minutes ago)
        expired_token = create_access_token(
            subject=uuid.uuid4(),
            role="SUPER_ADMIN",
            expires_delta=timedelta(minutes=-10)
        )
        headers = {"Authorization": f"Bearer {expired_token}"}
        res = self.client.get("/api/v1/organizations", headers=headers)
        self.assertEqual(res.status_code, 401)

    def test_refresh_token_cannot_access_protected_endpoint(self):
        # Attempt to access protected endpoint using refresh token
        headers = {"Authorization": f"Bearer {self.po_refresh}"}
        res = self.client.get("/api/v1/organizations", headers=headers)
        self.assertEqual(res.status_code, 401)
        self.assertIn("Invalid token type", res.json()["detail"])

    def test_unauthorized_route_access(self):
        # Employee user token with access type
        emp_token = create_access_token(subject=uuid.uuid4(), role="EMPLOYEE")
        headers = {"Authorization": f"Bearer {emp_token}"}
        res = self.client.get("/api/v1/organizations", headers=headers)
        self.assertIn(res.status_code, [401, 403])

    def test_password_policy_complexity_enforcement(self):
        self.assertIsNone(validate_password_complexity("Valid123!Pass"))
        with self.assertRaises(ValueError):
            validate_password_complexity("simple")

    def test_oversized_file_upload_rejected(self):
        service = ImportService()
        large_content = b"header1,header2\n" + (b"val1,val2\n" * 600000)  # > 5MB
        with self.assertRaises(ValueError) as ctx:
            service.parse_file_rows(large_content, "workers.csv")
        self.assertIn("exceeds maximum allowed limit", str(ctx.exception))

    def test_csv_injection_defended(self):
        service = ImportService()
        raw_csv = b"First Name,Last Name,Email,Employee Number,Weekly Contract Hours,Contract Type\n=cmd|' /C calc'!A0,Doe,john@test.com,EMP-99,40,HOURLY"
        rows = service.parse_file_rows(raw_csv, "workers.csv")
        self.assertEqual(len(rows), 1)
        self.assertTrue(rows[0]["First Name"].startswith("'="))

    def test_export_workers_tenant_boundary(self):
        res = self.client.get("/api/v1/export/workers", headers=self.org1_headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn("text/csv", res.headers["content-type"])

if __name__ == "__main__":
    unittest.main()
