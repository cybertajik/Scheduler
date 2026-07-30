import pytest
import uuid
import bcrypt
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.enums import UserRole


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Ensure database schema exists and default admin user is seeded."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@admin.com").first()
        if not admin:
            admin = User(
                id=uuid.uuid4(),
                username="admin",
                email="admin@admin.com",
                password_hash=hash_pw("!23QWEasd"),
                first_name="System",
                last_name="Administrator",
                role=UserRole.ADMIN,
                active=True,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


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

