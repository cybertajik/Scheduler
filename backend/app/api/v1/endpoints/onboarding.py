import uuid
import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.deps import require_super_admin
from app.models import OnboardingApplication, Organization, User, UserRole
from app.schemas.onboarding import OnboardingCreate, OnboardingResponse, OnboardingReject
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/apply", response_model=OnboardingResponse, status_code=201)
def submit_onboarding_application(
    app_in: OnboardingCreate,
    db: Session = Depends(get_db)
):
    """Public endpoint: Submit a new organization onboarding application."""
    # Check if existing pending app with same email or org_name
    existing = db.query(OnboardingApplication).filter(
        (OnboardingApplication.contact_email == app_in.contact_email) |
        (OnboardingApplication.org_name == app_in.org_name)
    ).filter(OnboardingApplication.status == "PENDING").first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="An application for this organization or contact email is already pending review."
        )

    application = OnboardingApplication(
        org_name=app_in.org_name,
        contact_name=app_in.contact_name,
        contact_email=app_in.contact_email,
        contact_tel=app_in.contact_tel,
        address=app_in.address,
        requested_domain=app_in.requested_domain,
        estimated_employees=app_in.estimated_employees,
        status="PENDING"
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/applications", response_model=List[OnboardingResponse])
def list_onboarding_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """List all onboarding applications (Product Owner / Super Admin only)."""
    return db.query(OnboardingApplication).order_by(OnboardingApplication.created_at.desc()).all()


@router.post("/applications/{app_id}/approve", response_model=OnboardingResponse)
def approve_onboarding_application(
    app_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Approve application: Create Organization + Top Manager account."""
    app_obj = db.query(OnboardingApplication).filter(OnboardingApplication.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Onboarding application not found")
    if app_obj.status == "APPROVED":
        raise HTTPException(status_code=400, detail="Application is already approved")

    # Generate slug & domain
    slug = re.sub(r'[^a-z0-9]', '', app_obj.org_name.lower())[:30] or f"org-{uuid.uuid4().hex[:6]}"
    domain = app_obj.requested_domain or f"{slug}.scheduler.local"

    # Create Organization
    org = Organization(
        name=app_obj.org_name,
        slug=slug,
        domain=domain.lower(),
        contact_email=app_obj.contact_email,
        contact_tel=app_obj.contact_tel,
        address=app_obj.address,
        billing_cycle="MONTHLY",
        subscription_status="ACTIVE",
        require_employee_id=True,
        active=True
    )
    db.add(org)
    db.flush()

    # Create Top Manager User
    manager_email = app_obj.contact_email
    manager = db.query(User).filter(User.email == manager_email).first()
    if not manager:
        name_parts = app_obj.contact_name.split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else "Manager"
        username = manager_email.split("@")[0]
        
        manager = User(
            organization_id=org.id,
            username=username,
            email=manager_email,
            password_hash=get_password_hash("!23QWEasd"),
            first_name=first_name,
            last_name=last_name,
            role=UserRole.ORG_ADMIN,
            active=True
        )
        db.add(manager)

    app_obj.status = "APPROVED"
    db.commit()
    db.refresh(app_obj)
    return app_obj


@router.post("/applications/{app_id}/reject", response_model=OnboardingResponse)
def reject_onboarding_application(
    app_id: uuid.UUID,
    rej_in: OnboardingReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Reject application with reason."""
    app_obj = db.query(OnboardingApplication).filter(OnboardingApplication.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Onboarding application not found")
    app_obj.status = "REJECTED"
    app_obj.rejection_reason = rej_in.reason or "Application rejected by administrator."
    db.commit()
    db.refresh(app_obj)
    return app_obj
