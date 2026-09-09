from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.user import User, Profile, Department, JobRole, Skill, EmployeeSkill, TrainingHistory, SkillSource
from app.schemas.profile import (
    ProfileOut, ProfileUpdate, DepartmentOut, JobRoleOut, SkillOut,
    TrainingHistoryCreate, TrainingHistoryOut
)

router = APIRouter()

@router.get("/profile", response_model=ProfileOut)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get profile details of the authenticated employee.
    """
    profile = db.query(Profile).options(
        joinedload(Profile.department),
        joinedload(Profile.job_role),
        joinedload(Profile.skills).joinedload(EmployeeSkill.skill)
    ).filter(Profile.user_id == current_user.id).first()

    if not profile:
        # Create empty profile if missing
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return ProfileOut.model_validate(profile)

@router.put("/profile", response_model=ProfileOut)
def update_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update profile details (designation, department, education, skills, experience).
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    if profile_in.designation is not None:
        profile.designation = profile_in.designation
    if profile_in.department_id is not None:
        profile.department_id = profile_in.department_id
    if profile_in.job_role_id is not None:
        profile.job_role_id = profile_in.job_role_id
    if profile_in.education is not None:
        profile.education = profile_in.education
    if profile_in.years_of_experience is not None:
        profile.years_of_experience = profile_in.years_of_experience
    if profile_in.current_assignment is not None:
        profile.current_assignment = profile_in.current_assignment
    if profile_in.professional_summary is not None:
        profile.professional_summary = profile_in.professional_summary

    # Update skills if provided
    if profile_in.skills is not None:
        # Remove existing employee skills
        db.query(EmployeeSkill).filter(EmployeeSkill.profile_id == profile.id).delete()
        for s_in in profile_in.skills:
            emp_skill = EmployeeSkill(
                profile_id=profile.id,
                skill_id=s_in.skill_id,
                current_level=s_in.current_level,
                source=s_in.source or SkillSource.SELF_ASSESSMENT
            )
            db.add(emp_skill)

    db.commit()
    db.refresh(profile)

    # Re-fetch profile with relationships
    updated_profile = db.query(Profile).options(
        joinedload(Profile.department),
        joinedload(Profile.job_role),
        joinedload(Profile.skills).joinedload(EmployeeSkill.skill)
    ).filter(Profile.id == profile.id).first()

    return ProfileOut.model_validate(updated_profile)

@router.get("/departments", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    """List all available statistical departments."""
    departments = db.query(Department).all()
    return [DepartmentOut.model_validate(d) for d in departments]

@router.get("/roles", response_model=List[JobRoleOut])
def get_roles(db: Session = Depends(get_db)):
    """List all statistical cadre job roles."""
    roles = db.query(JobRole).all()
    return [JobRoleOut.model_validate(r) for r in roles]

@router.get("/skills", response_model=List[SkillOut])
def get_skills(db: Session = Depends(get_db)):
    """List all master skills across Statistical, Technical, Digital Governance, and Behavioural categories."""
    skills = db.query(Skill).all()
    return [SkillOut.model_validate(s) for s in skills]

@router.get("/training-history", response_model=List[TrainingHistoryOut])
def get_training_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get training history logs for the current employee."""
    trainings = db.query(TrainingHistory).filter(TrainingHistory.user_id == current_user.id).all()
    return [TrainingHistoryOut.model_validate(t) for t in trainings]

@router.post("/training-history", response_model=TrainingHistoryOut, status_code=status.HTTP_201_CREATED)
def add_training_history(
    training_in: TrainingHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new completed or in-progress training course record."""
    training = TrainingHistory(
        user_id=current_user.id,
        course_name=training_in.course_name,
        provider=training_in.provider,
        completion_date=training_in.completion_date,
        duration_hours=training_in.duration_hours,
        certificate_url=training_in.certificate_url,
        status=training_in.status
    )
    db.add(training)
    db.commit()
    db.refresh(training)
    return TrainingHistoryOut.model_validate(training)


