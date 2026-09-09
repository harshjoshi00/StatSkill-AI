from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AssessmentEvaluateInput(BaseModel):
    attempt_id: str = Field(..., description="ID of the quiz attempt to evaluate")
    skill_id: Optional[str] = Field(None, description="Optional target skill ID to associate evaluation with")


class AssessmentEvaluateResponse(BaseModel):
    attempt_id: str
    skill_id: str
    skill_name: str
    old_level: int
    new_level: int
    level_changed: bool
    score: float
    evidence_source: str
    adaptive_next_difficulty: str
    reason: str
    updated_overall_match_percentage: float
    updated_skills_with_gaps: int

    model_config = ConfigDict(from_attributes=True)


class AssessmentProgressResponse(BaseModel):
    user_id: str
    total_assessments_taken: int
    assessments_passed: int
    pass_rate_percentage: float
    average_score: float
    learning_streak_days: int
    current_overall_match_percentage: float
    skills_count: int

    model_config = ConfigDict(from_attributes=True)


class AssessmentHistoryItem(BaseModel):
    id: str
    skill_id: str
    skill_name: str
    old_level: int
    new_level: int
    score: float
    evidence_source: str
    adaptive_next_difficulty: Optional[str] = None
    reason: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AssessmentHistoryResponse(BaseModel):
    total_records: int
    history: List[AssessmentHistoryItem]


class SkillCompetencyProgressItem(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    current_level: int
    current_level_label: str
    required_level: int
    required_level_label: str
    gap: int
    total_evaluations: int
    last_evaluated_at: Optional[datetime] = None
    history: List[AssessmentHistoryItem] = []

    model_config = ConfigDict(from_attributes=True)


class CompetencyProgressResponse(BaseModel):
    user_id: str
    overall_match_percentage: float
    skills_progress: List[SkillCompetencyProgressItem]

    model_config = ConfigDict(from_attributes=True)
