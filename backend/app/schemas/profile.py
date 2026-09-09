from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from app.models.user import SkillCategory, SkillSource, TrainingStatus

class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    code: str
    description: Optional[str] = None

class JobRoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    code: str
    description: Optional[str] = None

class SkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    category: SkillCategory

class EmployeeSkillCreate(BaseModel):
    skill_id: str
    current_level: int = Field(..., ge=0, le=5)
    source: Optional[SkillSource] = SkillSource.SELF_ASSESSMENT

class EmployeeSkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    skill_id: str
    skill: SkillOut
    current_level: int
    source: SkillSource

class TrainingHistoryCreate(BaseModel):
    course_name: str
    provider: str
    completion_date: Optional[str] = None
    duration_hours: int = 0
    certificate_url: Optional[str] = None
    status: Optional[TrainingStatus] = TrainingStatus.COMPLETED

class TrainingHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    course_name: str
    provider: str
    completion_date: Optional[str] = None
    duration_hours: int
    certificate_url: Optional[str] = None
    status: TrainingStatus

class ProfileUpdate(BaseModel):
    designation: Optional[str] = None
    department_id: Optional[str] = None
    job_role_id: Optional[str] = None
    education: Optional[str] = None
    years_of_experience: Optional[int] = Field(None, ge=0)
    current_assignment: Optional[str] = None
    professional_summary: Optional[str] = None
    skills: Optional[List[EmployeeSkillCreate]] = None

class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    designation: Optional[str] = None
    department: Optional[DepartmentOut] = None
    job_role: Optional[JobRoleOut] = None
    education: Optional[str] = None
    years_of_experience: int = 0
    current_assignment: Optional[str] = None
    professional_summary: Optional[str] = None
    skills: List[EmployeeSkillOut] = []
