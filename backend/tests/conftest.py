"""
Pytest fixtures shared across all test modules.

Provides:
    - client: a FastAPI TestClient bound to the application
    - admin_token_headers: Authorization headers for the seeded admin account
    - db: a SQLAlchemy session connected to the live test database
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal


@pytest.fixture(scope="module")
def client() -> TestClient:
    """FastAPI TestClient for the full application."""
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def admin_token_headers(client: TestClient) -> dict:
    """Authorization headers authenticated as the seeded admin user."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@admin.com", "password": "!23QWEasd"},
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def db() -> Session:
    """Database session for direct ORM assertions in tests."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
