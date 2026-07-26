from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, workers, shifts, rules, schedules, health, assignments, departments, jobs

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["User Management"])
api_router.include_router(departments.router, prefix="/departments", tags=["Departments"])
api_router.include_router(workers.router, prefix="/workers", tags=["Workers"])
api_router.include_router(shifts.router, prefix="/shift-types", tags=["Shift Types"])
api_router.include_router(rules.router, prefix="/rules", tags=["Rules & Constraints"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["Schedules"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["Assignments"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Background Jobs"])
