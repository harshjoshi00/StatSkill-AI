from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from app.models.user import SkillCategory, SkillImportance

class RoleSkillRequirementCreate(BaseModel):
    role_id: str
    skill_id: str
    required_level: int = Field(..., ge=1, le=5)
    importance: SkillImportance = SkillImportance.MEDIUM

class RoleSkillRequirementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role_id: str
    skill_id: str
    required_level: int
    importance: SkillImportance

class SkillCompetencyItem(BaseModel):
    skill_id: str
    skill_name: str
    skill_category: SkillCategory
    current_level: int
    current_level_label: str
    required_level: int
    required_level_label: str
    gap: int
    gap_classification: str  # NO_GAP, LOW, MEDIUM, HIGH
    importance: SkillImportance
    priority: str            # NONE, LOW, MEDIUM, HIGH, CRITICAL
    explanation: str

class CompetencyOverviewResponse(BaseModel):
    user_id: str
    job_role_id: Optional[str] = None
    job_role_title: Optional[str] = None
    department_name: Optional[str] = None
    overall_match_percentage: float
    total_required_skills: int
    skills_met: int
    skills_with_gaps: int
    skills: List[SkillCompetencyItem] = []

class CompetencySummaryResponse(BaseModel):
    job_role_title: Optional[str] = None
    total_required_skills: int
    skills_met: int
    skills_with_gaps: int
    low_gaps_count: int
    medium_gaps_count: int
    high_gaps_count: int
    high_priority_gaps_count: int
    overall_match_percentage: float

class CompetencyGapsResponse(BaseModel):
    total_gaps_count: int
    gaps: List[SkillCompetencyItem] = []

class CommonSkillGapItem(BaseModel):
    skill_id: str
    skill_name: str
    skill_category: SkillCategory
    gap_count: int
    average_gap: float
    importance: SkillImportance

class DepartmentCompetencySummaryItem(BaseModel):
    department_id: str
    department_name: str
    department_code: str
    total_employees: int
    employees_with_gaps: int
    average_match_percentage: float

class RoleCompetencySummaryItem(BaseModel):
    role_id: str
    role_title: str
    role_code: str
    total_employees: int
    total_requirements: int
    total_gaps: int

class AdminCompetencyOverviewResponse(BaseModel):
    total_employees: int
    employees_with_gaps: int
    high_priority_gaps: int
    most_common_skill_gaps: List[CommonSkillGapItem] = []
    department_summary: List[DepartmentCompetencySummaryItem] = []
    role_summary: List[RoleCompetencySummaryItem] = []
