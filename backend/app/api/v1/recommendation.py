from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.recommendation import (
    TrainingCourseOut, RecommendationListResponse, CourseActionResponse
)
from app.services import recommendation_service

router = APIRouter()


@router.get("/recommendations", response_model=RecommendationListResponse)
def get_recommendations(
    priority: Optional[str] = Query(None, description="Filter by priority: HIGH, CRITICAL, MEDIUM, LOW, HIGH_PRIORITY"),
    skill_id: Optional[str] = Query(None, description="Filter recommendations for a specific skill ID"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch personalized learning recommendations for the authenticated employee
    using hybrid multi-factor ranking (Skill Gap 40%, Semantic 30%, Role 10%, Difficulty 10%, History 10%).
    """
    return recommendation_service.get_recommendations(
        db=db,
        user_id=current_user.id,
        priority_filter=priority,
        skill_id_filter=skill_id,
        difficulty_filter=difficulty,
        limit=limit
    )


@router.get("/recommendations/{skill_id}", response_model=RecommendationListResponse)
def get_recommendations_by_skill(
    skill_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch recommendations filtered specifically for a single skill ID."""
    return recommendation_service.get_recommendations(
        db=db,
        user_id=current_user.id,
        skill_id_filter=skill_id
    )


@router.get("/training-courses", response_model=List[TrainingCourseOut])
def list_training_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all active training courses available in the platform catalog."""
    return recommendation_service.get_all_training_courses(db)


@router.post("/recommendations/{course_id}/start", response_model=CourseActionResponse)
def start_recommended_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enroll employee in a recommended course (sets status to IN_PROGRESS)."""
    try:
        return recommendation_service.start_course(db=db, user_id=current_user.id, course_id=course_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/recommendations/{course_id}/complete", response_model=CourseActionResponse)
def complete_recommended_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a recommended course as COMPLETED in employee training history."""
    try:
        return recommendation_service.complete_course(db=db, user_id=current_user.id, course_id=course_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
