import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.middleware import SecurityHeadersMiddleware, RequestLoggingMiddleware
from app.api.v1.router import api_router
from app.models import User, UserRole
from app.core.security import get_password_hash

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Seed default Admin user on first boot only
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin:
            logger.info("First boot: seeding default Admin user (admin@admin.com)...")
            default_admin = User(
                username="admin",
                email="admin@admin.com",
                password_hash=get_password_hash("!23QWEasd"),
                first_name="System",
                last_name="Administrator",
                role=UserRole.ADMIN,
                active=True
            )
            db.add(default_admin)
            db.commit()
            logger.info("Default Admin user created. Change the password after first login.")
        else:
            logger.info(f"Admin user '{admin.username}' found — skipping seed.")
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
