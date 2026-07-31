from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, workers, shifts, rules, schedules, health, assignments, departments, jobs, import_export, analytics, organizations, holidays, onboarding, sandboxes, repairs

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["User Management"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(departments.router, prefix="/departments", tags=["Departments"])
api_router.include_router(workers.router, prefix="/workers", tags=["Workers"])
api_router.include_router(shifts.router, prefix="/shift-types", tags=["Shift Types"])
api_router.include_router(rules.router, prefix="/rules", tags=["Rules & Constraints"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["Schedules"])
api_router.include_router(repairs.router, prefix="/schedules", tags=["Intelligent Auto-Repair & Conflict Resolution"])
api_router.include_router(sandboxes.router, prefix="/sandboxes", tags=["Schedule Sandboxes & Scenario Planning"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["Assignments"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Background Jobs"])
api_router.include_router(import_export.router, tags=["Import / Export"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(holidays.router, prefix="/holidays", tags=["Public Holidays"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["Onboarding Applications"])

