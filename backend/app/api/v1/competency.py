from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.user import User
from app.schemas.competency import (
    CompetencyOverviewResponse, CompetencySummaryResponse,
    CompetencyGapsResponse, AdminCompetencyOverviewResponse
)
from app.services.competency_service import (
    get_employee_competency_overview,
    get_employee_competency_summary,
    get_employee_skill_gaps,
    get_admin_competency_overview
)

router = APIRouter()

@router.get("", response_model=CompetencyOverviewResponse)
def get_competency_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current employee's overall competency score and detailed skill requirements vs current levels.
    """
    return get_employee_competency_overview(db, current_user)

@router.get("/summary", response_model=CompetencySummaryResponse)
def get_competency_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current employee's high-level competency summary metrics.
    """
    return get_employee_competency_summary(db, current_user)

@router.get("/gaps", response_model=CompetencyGapsResponse)
def get_competency_gaps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current employee's identified skill gaps with priority ranking and explainable text reasoning.
    """
    return get_employee_skill_gaps(db, current_user)
