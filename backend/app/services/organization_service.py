import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import Organization, User, UserRole
from app.schemas.organization import OrganizationCreate, OrganizationUpdate
from app.core.security import get_password_hash
from app.services.audit_service import AuditService

class OrganizationService:
    @staticmethod
    def get_all_organizations(db: Session) -> List[Organization]:
        return db.query(Organization).order_by(Organization.name).all()

    @staticmethod
    def get_organization_by_id(db: Session, org_id: uuid.UUID) -> Organization:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        return org

    @staticmethod
    def get_organization_by_domain(db: Session, domain: str) -> Optional[Organization]:
        if not domain:
            return None
        return db.query(Organization).filter(Organization.domain == domain.lower()).first()

    @staticmethod
    def create_organization(db: Session, org_in: OrganizationCreate, creator: Optional[User] = None) -> Organization:
        existing = db.query(Organization).filter(
            (Organization.slug == org_in.slug) | 
            (Organization.domain == org_in.domain if org_in.domain else False)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization slug or domain is already registered"
            )

        org = Organization(
            name=org_in.name,
            slug=org_in.slug,
            domain=org_in.domain.lower() if org_in.domain else None,
            description=org_in.description,
            require_employee_id=org_in.require_employee_id,
            active=org_in.active
        )
        db.add(org)
        db.commit()
        db.refresh(org)

        # Create Top Manager if credentials provided
        if org_in.top_manager_email and org_in.top_manager_password:
            top_manager = User(
                organization_id=org.id,
                username=org_in.top_manager_email.split('@')[0],
                email=org_in.top_manager_email,
                password_hash=get_password_hash(org_in.top_manager_password),
                first_name="Top",
                last_name="Manager",
                role=UserRole.ORG_ADMIN,
                active=True
            )
            db.add(top_manager)
            db.commit()

        creator_id = creator.id if creator else None
        creator_name = creator.full_name if creator else "System"
        AuditService.log_action(
            db, action="CREATE_ORGANIZATION", entity_type="Organization", entity_id=str(org.id),
            user_id=creator_id, who=creator_name, reason=f"Created organization '{org.name}'"
        )
        return org

    @staticmethod
    def update_organization(db: Session, org_id: uuid.UUID, update_in: OrganizationUpdate, updater: User) -> Organization:
        org = OrganizationService.get_organization_by_id(db, org_id)
        update_data = update_in.model_dump(exclude_unset=True)

        for key, val in update_data.items():
            if key == "domain" and val:
                val = val.lower()
            setattr(org, key, val)

        db.commit()
        db.refresh(org)

        AuditService.log_action(
            db, action="UPDATE_ORGANIZATION", entity_type="Organization", entity_id=str(org.id),
            user_id=updater.id, who=updater.full_name, new_value=update_data
        )
        return org
