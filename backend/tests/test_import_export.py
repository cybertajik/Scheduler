import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Worker, Schedule

def test_export_workers_csv(client: TestClient, admin_token_headers: dict):
    """Test exporting worker roster as CSV."""
    response = client.get("/api/v1/export/workers", headers=admin_token_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "Employee Number" in response.text

def test_export_audit_log_csv(client: TestClient, admin_token_headers: dict):
    """Test exporting audit log entries as CSV."""
    response = client.get("/api/v1/export/audit-log", headers=admin_token_headers)
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "Timestamp" in response.text

def test_validate_workers_import_csv(client: TestClient, admin_token_headers: dict):
    """Test dry-run validation for worker CSV upload."""
    csv_content = (
        "Employee Number,First Name,Last Name,Email,Department\n"
        "W9001,John,ImportTest,john.import@company.local,Engineering\n"
        "W9002,Jane,ImportTest,jane.import@company.local,Operations\n"
    )
    files = {"file": ("test_workers.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/v1/import/validate-workers", headers=admin_token_headers, files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["total_rows"] == 2
    assert data["valid_count"] == 2
    assert len(data["valid_records"]) == 2

def test_commit_workers_import(client: TestClient, admin_token_headers: dict, db: Session):
    """Test committing validated worker import records."""
    valid_records = [
        {
            "row": 2,
            "code": "W9901",
            "first_name": "CommitTest1",
            "last_name": "User",
            "email": "committest1@company.local",
            "dept_name": "Engineering"
        }
    ]
    response = client.post(
        "/api/v1/import/commit-workers",
        headers=admin_token_headers,
        json={"valid_records": valid_records}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["imported_count"] == 1

    # Verify worker created in DB
    w = db.query(Worker).filter(Worker.employee_number == "W9901").first()
    assert w is not None
    assert w.first_name == "CommitTest1"
