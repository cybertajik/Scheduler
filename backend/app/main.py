import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.middleware import SecurityHeadersMiddleware, RequestLoggingMiddleware
from app.api.v1.router import api_router
from app.models import User, UserRole
from app.models.organization import Organization
from app.core.security import get_password_hash

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schema & auto-migrations...")

    # Step 1: Create all base tables from SQLAlchemy models first
    Base.metadata.create_all(bind=engine)

    # Step 2: Add enum values (ignore errors if type doesn't exist yet)
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        for val in ["SUPER_ADMIN", "ORG_ADMIN"]:
            try:
                conn.execute(text(f"ALTER TYPE userrole_enum ADD VALUE IF NOT EXISTS '{val}'"))
            except Exception as e:
                logger.warning(f"Enum update note: {e}")

    # Step 3: Apply additive column migrations (safe with IF NOT EXISTS)
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS organizations (
                id UUID PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                domain VARCHAR(255) UNIQUE,
                description TEXT,
                require_employee_id BOOLEAN DEFAULT TRUE NOT NULL,
                active BOOLEAN DEFAULT TRUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en' NOT NULL;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) DEFAULT 'dark' NOT NULL;
            ALTER TABLE departments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
            ALTER TABLE workers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
            ALTER TABLE workers ALTER COLUMN employee_number DROP NOT NULL;
            ALTER TABLE workers ADD COLUMN IF NOT EXISTS contract_type VARCHAR(20) DEFAULT 'HOURLY' NOT NULL;
            ALTER TABLE workers ADD COLUMN IF NOT EXISTS hourly_rate FLOAT;
            ALTER TABLE workers ADD COLUMN IF NOT EXISTS monthly_salary FLOAT;
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country_code VARCHAR(5);
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS extra_country_code VARCHAR(5);
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'MONTHLY' NOT NULL;
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL;
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS grace_period_until TIMESTAMP WITH TIME ZONE;
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_tel VARCHAR(50);
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
            ALTER TABLE organizations ADD COLUMN IF NOT EXISTS admin_notes TEXT;

            CREATE TABLE IF NOT EXISTS onboarding_applications (
                id UUID PRIMARY KEY,
                org_name VARCHAR(150) NOT NULL,
                contact_name VARCHAR(100) NOT NULL,
                contact_email VARCHAR(255) NOT NULL,
                contact_tel VARCHAR(50) NOT NULL,
                address TEXT,
                requested_domain VARCHAR(255),
                estimated_employees INTEGER DEFAULT 10 NOT NULL,
                status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
                rejection_reason TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))
        conn.commit()

    
    # Seed default accounts on first boot (idempotent — only creates if missing)
    db = SessionLocal()
    try:
        # ── Product Owner (Super Admin) ──
        po_admin = db.query(User).filter(User.email == "admin@admin.com").first()
        if not po_admin:
            logger.info("First boot: seeding Product Owner (admin@admin.com)...")
            default_admin = User(
                username="admin",
                email="admin@admin.com",
                password_hash=get_password_hash("!23QWEasd"),
                first_name="Product",
                last_name="Owner",
                role=UserRole.SUPER_ADMIN,
                active=True
            )
            db.add(default_admin)
            db.commit()
            logger.info("Default Product Owner created.")

        # ── Test Organisation 1 + Manager ──
        org1_mgr = db.query(User).filter(User.email == "testorg1@org.com").first()
        if not org1_mgr:
            logger.info("Seeding Test Organisation 1 + Manager (testorg1@org.com)...")
            org1 = db.query(Organization).filter(Organization.slug == "test-org-1").first()
            if not org1:
                org1 = Organization(
                    name="Test Organisation 1",
                    slug="test-org-1",
                    domain="org1.scheduler.local",
                    description="Primary Logistics & Operations Organization",
                    contact_email="testorg1@org.com",
                    contact_tel="+1-555-0101",
                    address="100 Innovation Way, Tech City",
                    billing_cycle="MONTHLY",
                    subscription_status="ACTIVE",
                    require_employee_id=True,
                    country_code="US",
                    active=True,
                )
                db.add(org1)
                db.flush()
            org1_mgr = User(
                organization_id=org1.id,
                username="testorg1",
                email="testorg1@org.com",
                password_hash=get_password_hash("!23QWEasd"),
                first_name="Alex",
                last_name="Vance",
                role=UserRole.ORG_ADMIN,
                active=True
            )
            db.add(org1_mgr)
            db.commit()
            logger.info("Test Organisation 1 + Manager created.")

        # ── Test Organisation 2 + Manager ──
        org2_mgr = db.query(User).filter(User.email == "testorg2@org.com").first()
        if not org2_mgr:
            logger.info("Seeding Test Organisation 2 + Manager (testorg2@org.com)...")
            org2 = db.query(Organization).filter(Organization.slug == "test-org-2").first()
            if not org2:
                org2 = Organization(
                    name="Test Organisation 2",
                    slug="test-org-2",
                    domain="org2.scheduler.local",
                    description="Healthcare & Clinical Services",
                    contact_email="testorg2@org.com",
                    contact_tel="+1-555-0202",
                    address="200 Health Center Blvd, Medical District",
                    billing_cycle="ANNUAL",
                    subscription_status="ACTIVE",
                    require_employee_id=False,
                    country_code="GB",
                    active=True,
                )
                db.add(org2)
                db.flush()
            org2_mgr = User(
                organization_id=org2.id,
                username="testorg2",
                email="testorg2@org.com",
                password_hash=get_password_hash("!23QWEasd"),
                first_name="Dr. Marcus",
                last_name="Brody",
                role=UserRole.ORG_ADMIN,
                active=True
            )
            db.add(org2_mgr)
            db.commit()
            logger.info("Test Organisation 2 + Manager created.")
    except Exception as e:
        db.rollback()
        logger.error(f"Seed error: {e}")
    finally:
        db.close()

    logger.info("Staff Scheduler API started successfully")
    yield
    logger.info("Staff Scheduler API shutting down")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# ── Middleware ──
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# ── Central Error Handlers ──

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    logger.warning(f"Database integrity error: {exc.orig}")
    return JSONResponse(status_code=409, content={"detail": "Data conflict: a record with this data already exists.", "error_code": "INTEGRITY_ERROR"})

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal database error.", "error_code": "DB_ERROR"})

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc), "error_code": "VALIDATION_ERROR"})

@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url}")
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred.", "error_code": "INTERNAL_ERROR"})

# ── CORS Setup ──

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }
