from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import require_admin
from app.models.user import User
from app.schemas.competency import AdminCompetencyOverviewResponse
from app.schemas.admin_analytics import (
    AdminAnalyticsResponse,
    TrainingEffectivenessResponse,
    AdminPredictionsResponse,
    WorkforceSummaryResponse
)
from app.services.competency_service import get_admin_competency_overview
from app.services.admin_analytics_service import (
    get_admin_analytics,
    get_training_effectiveness,
    get_admin_predictions,
    get_workforce_summary
)

router = APIRouter()

@router.get("/competency-overview", response_model=AdminCompetencyOverviewResponse)
def get_admin_competency_overview_endpoint(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get workforce aggregate competency analysis, high-priority skill gaps, and department/role breakdowns.
    Only accessible by users with ADMIN role.
    """
    return get_admin_competency_overview(db)


@router.get("/analytics", response_model=AdminAnalyticsResponse)
def get_admin_analytics_endpoint(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive workforce analytics including total employees, departments, roles,
    average competency match, open gaps, training completion, and quiz performance.
    Only accessible by users with ADMIN role.
    """
    return get_admin_analytics(db)


@router.get("/training-effectiveness", response_model=TrainingEffectivenessResponse)
def get_training_effectiveness_endpoint(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get course-level training effectiveness metrics including pre vs post competency improvement,
    quiz performance per course, and composite effectiveness scores.
    Only accessible by users with ADMIN role.
    """
    return get_training_effectiveness(db)


@router.get("/predictions", response_model=AdminPredictionsResponse)
def get_admin_predictions_endpoint(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get explainable ML workforce training risk predictions (RandomForest/XGBoost)
    with risk probabilities, top contributing features, and recommended training actions.
    Only accessible by users with ADMIN role.
    """
    return get_admin_predictions(db)


@router.get("/workforce-summary", response_model=WorkforceSummaryResponse)
def get_workforce_summary_endpoint(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get high-level executive workforce readiness summary, top critical skill gaps,
    high-risk employee percentage, and strategic recommendations.
    Only accessible by users with ADMIN role.
    """
    return get_workforce_summary(db)
