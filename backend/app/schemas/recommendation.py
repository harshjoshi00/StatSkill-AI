from pydantic import BaseModel, Field
from typing import List, Optional

class TrainingCourseOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    provider: str
    skill_id: str
    skill_name: Optional[str] = None
    difficulty: str
    duration_hours: int
    url: Optional[str] = None
    active: bool = True

    class Config:
        from_attributes = True

class RecommendationItemOut(BaseModel):
    course: TrainingCourseOut
    skill_id: str
    skill_name: str
    current_level: int
    required_level: int
    gap: int
    gap_priority: str
    match_score: float = Field(..., description="Normalized composite score between 0.0 and 1.0")
    match_percentage: int = Field(..., description="Score expressed as 0-100 percentage")
    match_reasons: List[str] = Field(default_factory=list, description="Explainable scoring breakdown")
    status: str = Field(default="NOT_STARTED", description="Employee enrollment status: NOT_STARTED, IN_PROGRESS, COMPLETED")

class RecommendationListResponse(BaseModel):
    recommendations: List[RecommendationItemOut]
    total_recommended: int
    high_priority_count: int

class CourseActionResponse(BaseModel):
    message: str
    course_id: str
    status: str
