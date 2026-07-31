import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import User, UserRole
from app.schemas.auth import UserCreate, UserLogin, UserUpdate, PasswordChangeRequest, UserPreferencesUpdate
from app.core.security import (
    verify_password, get_password_hash, validate_password_complexity,
    create_access_token, create_refresh_token, decode_token
)
from app.core.token_blacklist import add_token_to_blacklist
from app.services.audit_service import AuditService

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, credentials: UserLogin, ip_address: Optional[str] = None) -> User:
        user = db.query(User).filter(
            (User.email == credentials.email) | (User.username == credentials.email)
        ).first()
        if not user or not verify_password(credentials.password, user.password_hash):
            AuditService.log_action(
                db, action="LOGIN_FAILURE", entity_type="User",
                who=credentials.email, ip_address=ip_address, reason="Incorrect email or password"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        if not user.active:
            AuditService.log_action(
                db, action="LOGIN_FAILURE", entity_type="User", entity_id=str(user.id),
                user_id=user.id, who=user.full_name, ip_address=ip_address, reason="Account disabled"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user account"
            )
        
        # Update last login timestamp
        user.last_login_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)

        AuditService.log_action(
            db, action="LOGIN_SUCCESS", entity_type="User", entity_id=str(user.id),
            user_id=user.id, who=user.full_name, ip_address=ip_address
        )
        return user

    @staticmethod
    def create_user(db: Session, user_in: UserCreate, creator: Optional[User] = None) -> User:
        validate_password_complexity(user_in.password)
        
        if creator and creator.role == UserRole.MANAGER:
            if user_in.role not in [UserRole.SCHEDULER, UserRole.EMPLOYEE]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Managers can only create Schedulers and Employees"
                )

        existing = db.query(User).filter(
            (User.email == user_in.email) | (User.username == user_in.username)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email is already registered"
            )

        org_id = user_in.organization_id
        if not org_id and creator and creator.organization_id:
            org_id = creator.organization_id

        user = User(
            organization_id=org_id,
            username=user_in.username,
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            role=user_in.role,
            active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        creator_id = creator.id if creator else None
        creator_name = creator.full_name if creator else "System"
        AuditService.log_action(
            db, action="USER_CREATE", entity_type="User", entity_id=str(user.id),
            user_id=creator_id, who=creator_name, new_value={"email": user.email, "role": user.role.value}
        )
        return user

    @staticmethod
    def refresh_access_token(refresh_token: str) -> dict:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token type")
        
        user_id = payload.get("sub")
        role = payload.get("role")
        if not user_id or not role:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        new_access_token = create_access_token(subject=user_id, role=role)
        return {"access_token": new_access_token, "token_type": "bearer"}

    @staticmethod
    def logout(token: str, user: User, db: Session) -> None:
        add_token_to_blacklist(token)
        AuditService.log_action(
            db, action="LOGOUT", entity_type="User", entity_id=str(user.id),
            user_id=user.id, who=user.full_name
        )

    @staticmethod
    def change_password(db: Session, user: User, pwd_in: PasswordChangeRequest) -> None:
        if not verify_password(pwd_in.current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        validate_password_complexity(pwd_in.new_password)
        user.password_hash = get_password_hash(pwd_in.new_password)
        user.must_change_password = False
        db.commit()

        AuditService.log_action(
            db, action="PASSWORD_CHANGE", entity_type="User", entity_id=str(user.id),
            user_id=user.id, who=user.full_name
        )

    @staticmethod
    def update_preferences(db: Session, user: User, pref_in: UserPreferencesUpdate) -> User:
        if pref_in.preferred_language:
            user.preferred_language = pref_in.preferred_language
        if pref_in.theme_preference:
            user.theme_preference = pref_in.theme_preference
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_all_users(db: Session, current_user: Optional[User] = None) -> List[User]:
        query = db.query(User)
        if current_user and current_user.role != UserRole.SUPER_ADMIN and current_user.organization_id:
            query = query.filter(User.organization_id == current_user.organization_id)
        return query.order_by(User.username).all()

    @staticmethod
    def get_user_by_id(db: Session, user_id: uuid.UUID) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    @staticmethod
    def update_user(db: Session, user_id: uuid.UUID, update_in: UserUpdate, admin: User) -> User:
        user = AuthService.get_user_by_id(db, user_id)
        
        if admin.role == UserRole.MANAGER:
            if user.role not in [UserRole.SCHEDULER, UserRole.EMPLOYEE]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Managers can only update Schedulers and Employees"
                )
            if update_in.role and update_in.role not in [UserRole.SCHEDULER, UserRole.EMPLOYEE]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Managers can only assign Scheduler or Employee roles"
                )

        update_data = update_in.model_dump(exclude_unset=True)

        for key, val in update_data.items():
            setattr(user, key, val)

        db.commit()
        db.refresh(user)

        AuditService.log_action(
            db, action="USER_UPDATE", entity_type="User", entity_id=str(user.id),
            user_id=admin.id, who=admin.full_name, new_value=update_data
        )
        return user

    @staticmethod
    def deactivate_user(db: Session, user_id: uuid.UUID, admin: User) -> User:
        user = AuthService.get_user_by_id(db, user_id)

        admin_roles = [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ADMIN]
        if user.role in admin_roles:
            if admin.id == user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Admin cannot deactivate their own account"
                )
            if admin.role not in admin_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot deactivate Admin accounts"
                )

        if admin.role == UserRole.MANAGER and user.role not in [UserRole.SCHEDULER, UserRole.EMPLOYEE]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers can only deactivate Schedulers and Employees"
            )

        user.active = False
        db.commit()
        db.refresh(user)

        AuditService.log_action(
            db, action="USER_DISABLE", entity_type="User", entity_id=str(user.id),
            user_id=admin.id, who=admin.full_name
        )
        return user

    @staticmethod
    def activate_user(db: Session, user_id: uuid.UUID, admin: User) -> User:
        user = AuthService.get_user_by_id(db, user_id)

        if admin.role == UserRole.MANAGER and user.role not in [UserRole.SCHEDULER, UserRole.EMPLOYEE]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers can only activate Schedulers and Employees"
            )

        user.active = True
        db.commit()
        db.refresh(user)

        AuditService.log_action(
            db, action="USER_ENABLE", entity_type="User", entity_id=str(user.id),
            user_id=admin.id, who=admin.full_name
        )
        return user

    @staticmethod
    def delete_user(db: Session, user_id: uuid.UUID, admin: User) -> None:
        user = AuthService.get_user_by_id(db, user_id)

        admin_roles = [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.ADMIN]
        if user.role in admin_roles:
            if admin.id == user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Admin cannot delete their own account"
                )
            if admin.role not in admin_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot delete Admin accounts"
                )

        if admin.role == UserRole.MANAGER and user.role not in [UserRole.SCHEDULER, UserRole.EMPLOYEE]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers can only delete Schedulers and Employees"
            )

        AuditService.log_action(
            db, action="USER_DELETE", entity_type="User", entity_id=str(user.id),
            user_id=admin.id, who=admin.full_name, old_value={"email": user.email, "username": user.username}
        )

        db.delete(user)
        db.commit()
