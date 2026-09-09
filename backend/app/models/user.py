import enum
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Enum as SQLEnum, ForeignKey, Text, Table, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class UserRole(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    ADMIN = "ADMIN"

class SkillCategory(str, enum.Enum):
    STATISTICAL = "STATISTICAL"
    TECHNICAL = "TECHNICAL"
    DIGITAL_GOVERNANCE = "DIGITAL_GOVERNANCE"
    BEHAVIOURAL = "BEHAVIOURAL"

class SkillLevel(int, enum.Enum):
    NO_KNOWLEDGE = 0
    BEGINNER = 1
    BASIC = 2
    INTERMEDIATE = 3
    ADVANCED = 4
    EXPERT = 5

class SkillSource(str, enum.Enum):
    SELF_ASSESSMENT = "SELF_ASSESSMENT"
    ASSESSMENT = "ASSESSMENT"
    AI_EXTRACTION = "AI_EXTRACTION"
    ADMIN = "ADMIN"

class SkillImportance(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class TrainingStatus(str, enum.Enum):
    COMPLETED = "COMPLETED"
    IN_PROGRESS = "IN_PROGRESS"
    NOT_STARTED = "NOT_STARTED"

class CourseDifficulty(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    training_history = relationship("TrainingHistory", back_populates="user", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(255), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)

class JobRole(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    title = Column(String(255), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)

class Skill(Base):
    __tablename__ = "skills"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(SkillCategory), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    profile_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    current_level = Column(Integer, default=0, nullable=False)
    source = Column(SQLEnum(SkillSource), default=SkillSource.SELF_ASSESSMENT, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    profile = relationship("Profile", back_populates="skills")
    skill = relationship("Skill")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    designation = Column(String(255), nullable=True)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    job_role_id = Column(String(36), ForeignKey("roles.id"), nullable=True)
    education = Column(String(255), nullable=True)
    years_of_experience = Column(Integer, default=0, nullable=False)
    current_assignment = Column(Text, nullable=True)
    professional_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User", back_populates="profile")
    department = relationship("Department")
    job_role = relationship("JobRole")
    skills = relationship("EmployeeSkill", back_populates="profile", cascade="all, delete-orphan")

class TrainingHistory(Base):
    __tablename__ = "training_history"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_name = Column(String(255), nullable=False)
    provider = Column(String(255), nullable=False) # e.g. iGOT Karmayogi, NSSTA
    completion_date = Column(String(50), nullable=True)
    duration_hours = Column(Integer, default=0, nullable=False)
    certificate_url = Column(String(500), nullable=True)
    status = Column(SQLEnum(TrainingStatus), default=TrainingStatus.COMPLETED, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="training_history")

class AiSuggestionStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"

class AiSkillSuggestion(Base):
    """Stores AI-extracted skill suggestions awaiting employee accept/reject confirmation."""
    __tablename__ = "ai_skill_suggestions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    extracted_skill = Column(String(255), nullable=False)       # raw phrase from input text
    matched_skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=True)
    confidence = Column(Integer, nullable=False, default=0)     # 0-100 integer percentage
    similarity_score = Column(String(10), nullable=True)        # float as string e.g. "0.87"
    source_text_snippet = Column(String(500), nullable=True)    # snippet from original input
    status = Column(SQLEnum(AiSuggestionStatus), nullable=False, default=AiSuggestionStatus.PENDING, index=True)
    suggested_level = Column(Integer, nullable=True)            # always None; level is never auto-set
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User")
    matched_skill = relationship("Skill")

class RoleSkillRequirement(Base):
    __tablename__ = "role_skill_requirements"
    __table_args__ = (
        UniqueConstraint("role_id", "skill_id", name="uq_role_skill_requirement"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    role_id = Column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    required_level = Column(Integer, nullable=False, default=1)
    importance = Column(SQLEnum(SkillImportance), nullable=False, default=SkillImportance.MEDIUM)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    job_role = relationship("JobRole")
    skill = relationship("Skill")

class TrainingCourse(Base):
    __tablename__ = "training_courses"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    provider = Column(String(255), nullable=False)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    difficulty = Column(SQLEnum(CourseDifficulty), default=CourseDifficulty.BEGINNER, nullable=False, index=True)
    duration_hours = Column(Integer, default=0, nullable=False)
    url = Column(String(500), nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    skill = relationship("Skill")

