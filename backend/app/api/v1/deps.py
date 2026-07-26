from typing import List, Callable
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import oauth2_scheme, decode_token
from app.models import User, UserRole

# Declarative Role-Permission Mapping Matrix
ROLE_PERMISSIONS = {
    UserRole.ADMIN: {
        "users:create", "users:read", "users:update", "users:delete",
        "schedules:create", "schedules:read", "schedules:update", "schedules:delete", "schedules:generate", "schedules:publish",
        "workers:create", "workers:read", "workers:update", "workers:delete",
        "shifts:create", "shifts:read", "shifts:update", "shifts:delete",
        "rules:create", "rules:read", "rules:update", "rules:delete",
        "assignments:manage"
    },
    UserRole.SCHEDULER: {
        "schedules:create", "schedules:read", "schedules:update", "schedules:generate",
        "workers:read", "workers:update",
        "shifts:read", "shifts:create", "shifts:update",
        "rules:create", "rules:read", "rules:update", "rules:delete",
        "assignments:manage"
    },
    UserRole.MANAGER: {
        "schedules:read", "schedules:publish",
        "workers:read",
        "shifts:read",
        "rules:read"
    },
    UserRole.EMPLOYEE: {
        "schedules:read_own",
        "workers:read_self",
        "rules:read_self"
    }
}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated")
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")
    return current_user

def require_role(*allowed_roles: UserRole) -> Callable:
    """Dependency factory enforcing that the authenticated user has one of the allowed roles."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action forbidden. Required role: {', '.join(r.value for r in allowed_roles)}"
            )
        return current_user
    return role_checker

def require_permission(permission: str) -> Callable:
    """Dependency factory enforcing that the user's role grants a specific permission."""
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        user_perms = ROLE_PERMISSIONS.get(current_user.role, set())
        if permission not in user_perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' denied for role '{current_user.role.value}'"
            )
        return current_user
    return permission_checker

# Standardized Shorthand Role Dependencies
require_admin = require_role(UserRole.ADMIN)
admin_only = require_role(UserRole.ADMIN)
scheduler_or_admin = require_role(UserRole.ADMIN, UserRole.SCHEDULER)
manager_or_higher = require_role(UserRole.ADMIN, UserRole.SCHEDULER, UserRole.MANAGER)
