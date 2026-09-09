from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.assessment import (
    AssessmentEvaluateInput, AssessmentEvaluateResponse,
    AssessmentProgressResponse, AssessmentHistoryResponse,
    CompetencyProgressResponse
)
from app.services import assessment_service

router = APIRouter()


@router.get("/assessment/progress", response_model=AssessmentProgressResponse)
def get_assessment_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get employee's overall assessment progress: totals, pass rate, average score, streak."""
    return assessment_service.get_assessment_progress(db, current_user)


@router.post("/assessment/evaluate", response_model=AssessmentEvaluateResponse)
def evaluate_assessment(
    payload: AssessmentEvaluateInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Convert a completed quiz attempt into a competency evidence record.
    Updates skill level, records history, recalculates skill gaps.
    """
    try:
        result = assessment_service.evaluate_assessment_attempt(
            db=db, user=current_user,
            attempt_id=payload.attempt_id,
            skill_id=payload.skill_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/assessment/history", response_model=AssessmentHistoryResponse)
def get_assessment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chronological evidence log of all competency updates for the employee."""
    return assessment_service.get_assessment_history(db, current_user)


@router.get("/competency/progress", response_model=CompetencyProgressResponse)
def get_competency_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get skill-by-skill competency progression with level history and evaluation trail."""
    return assessment_service.get_competency_progress(db, current_user)
