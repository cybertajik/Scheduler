import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.deps import get_current_user, require_super_admin, require_org_admin
from app.models import User, Organization
from app.schemas.organization import OrganizationCreate, OrganizationUpdate, OrganizationResponse
from app.services.organization_service import OrganizationService

router = APIRouter()

@router.get("", response_model=List[OrganizationResponse])
def list_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """List all organizations (Super Admin only)."""
    return OrganizationService.get_all_organizations(db)

@router.post("", response_model=OrganizationResponse, status_code=201)
def create_organization(
    org_in: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Create a new organization and assign a Top Manager (Super Admin only)."""
    return OrganizationService.create_organization(db, org_in, creator=current_user)

@router.get("/current", response_model=OrganizationResponse)
def get_current_organization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get organization settings for current user."""
    if not current_user.organization_id:
        # Fallback default virtual organization for Super Admin or legacy users
        return OrganizationResponse(
            id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
            name="Global Enterprise System",
            slug="global",
            domain="localhost",
            description="Global multi-tenant system root",
            require_employee_id=True,
            active=True,
            created_at=current_user.created_at,
            updated_at=current_user.created_at
        )
    return OrganizationService.get_organization_by_id(db, current_user.organization_id)

@router.patch("/current", response_model=OrganizationResponse)
def update_current_organization(
    org_in: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_admin)
):
    """Update organization settings (Top Manager / Super Admin)."""
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User is not assigned to an organization")
    return OrganizationService.update_organization(db, current_user.organization_id, org_in, updater=current_user)

@router.get("/{org_id}", response_model=OrganizationResponse)
def get_organization(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get organization details by ID (Super Admin only)."""
    return OrganizationService.get_organization_by_id(db, org_id)

@router.patch("/{org_id}", response_model=OrganizationResponse)
def update_organization_by_id(
    org_id: uuid.UUID,
    org_in: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Update organization by ID (Super Admin only)."""
    return OrganizationService.update_organization(db, org_id, org_in, updater=current_user)

@router.post("/{org_id}/extend-grace", response_model=OrganizationResponse)
def extend_grace_period(
    org_id: uuid.UUID,
    days: int = 14,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Extend organization subscription grace period (Super Admin only)."""
    return OrganizationService.extend_grace_period(db, org_id, days)

@router.post("/{org_id}/suspend", response_model=OrganizationResponse)
def suspend_organization(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Suspend an organization subscription (Super Admin only)."""
    return OrganizationService.set_subscription_status(db, org_id, status="SUSPENDED", active=False)

@router.post("/{org_id}/activate", response_model=OrganizationResponse)
def activate_organization(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Activate an organization subscription (Super Admin only)."""
    return OrganizationService.set_subscription_status(db, org_id, status="ACTIVE", active=True)

@router.delete("/{org_id}", status_code=204)
def delete_organization(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Delete an organization (Super Admin only)."""
    OrganizationService.delete_organization(db, org_id)
    return None
