from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.schemas.competency import CommonSkillGapItem, DepartmentCompetencySummaryItem, RoleCompetencySummaryItem

class AdminAnalyticsResponse(BaseModel):
    total_employees: int
    total_departments: int
    total_roles: int
    total_skills: int
    average_competency_match: float
    total_open_skill_gaps: int
    high_critical_gaps: int
    training_completed_count: int
    training_completion_rate: float
    total_quiz_attempts: int
    average_quiz_score: float
    quiz_pass_rate: float
    top_missing_skills: List[CommonSkillGapItem] = []
    department_breakdown: List[DepartmentCompetencySummaryItem] = []
    role_breakdown: List[RoleCompetencySummaryItem] = []
    training_effectiveness_summary: Dict[str, Any] = {}

class TrainingEffectivenessCourseItem(BaseModel):
    course_id: str
    course_title: str
    provider: str
    enrolled_count: int
    completed_count: int
    completion_rate: float
    avg_quiz_score: float
    competency_gain_avg: float
    effectiveness_score: float

class TrainingEffectivenessResponse(BaseModel):
    total_courses: int
    total_completions: int
    overall_avg_gain: float
    courses: List[TrainingEffectivenessCourseItem] = []

class EmployeeRiskPrediction(BaseModel):
    user_id: str
    employee_name: str
    email: str
    department_name: Optional[str] = None
    job_role_title: Optional[str] = None
    risk_level: str  # "HIGH", "MEDIUM", "LOW"
    risk_probability: float
    overall_match_pct: float
    open_gaps_count: int
    high_critical_gaps_count: int
    quiz_pass_rate: float
    contributing_factors: List[str] = []
    recommended_action: str

class AdminPredictionsResponse(BaseModel):
    model_type: str
    model_accuracy: float
    total_predictions: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    feature_importances: Dict[str, float] = {}
    predictions: List[EmployeeRiskPrediction] = []

class WorkforceSummaryResponse(BaseModel):
    total_employees: int
    workforce_readiness_score: float
    top_critical_skill_gaps: List[CommonSkillGapItem] = []
    high_risk_employee_pct: float
    training_completion_pct: float
    key_recommendations: List[str] = []
