import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.user import User, Profile, EmployeeSkill, Skill, SkillSource
from app.models.learning import QuizAttempt, Quiz, LearningMaterial
from app.models.competency_history import CompetencyHistory
from app.services.competency_service import get_employee_competency_overview, LEVEL_LABELS

logger = logging.getLogger(__name__)

DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"]


def score_to_adaptive_difficulty(score: float, current_difficulty: str) -> str:
    idx = DIFFICULTY_LEVELS.index(current_difficulty) if current_difficulty in DIFFICULTY_LEVELS else 1
    if score >= 80.0:
        return DIFFICULTY_LEVELS[min(idx + 1, 2)]
    elif score >= 50.0:
        return DIFFICULTY_LEVELS[idx]
    else:
        return DIFFICULTY_LEVELS[max(idx - 1, 0)]


def score_to_level_change(score: float, old_level: int) -> int:
    """score >= 80% -> +1 level (capped at 5), else no change."""
    if score >= 80.0:
        return min(old_level + 1, 5)
    return old_level


def build_reason(skill_name: str, old_level: int, new_level: int, score: float) -> str:
    old_lbl = LEVEL_LABELS.get(old_level, str(old_level))
    new_lbl = LEVEL_LABELS.get(new_level, str(new_level))
    if new_level > old_level:
        return (
            f"Your competency in '{skill_name}' changed from {old_lbl} (Level {old_level}) "
            f"to {new_lbl} (Level {new_level}) because you scored {score:.1f}% on the assessment "
            f"(threshold: 80%), demonstrating mastery at the next level."
        )
    elif score < 50.0:
        return (
            f"Your competency in '{skill_name}' remains at {old_lbl} (Level {old_level}). "
            f"You scored {score:.1f}% (below 50%), indicating foundational learning is recommended "
            f"before advancing. A lower difficulty assessment is suggested next."
        )
    else:
        return (
            f"Your competency in '{skill_name}' remains at {old_lbl} (Level {old_level}). "
            f"You scored {score:.1f}% (50–79%), which maintains your current level. "
            f"Continue practicing and aim for 80%+ to advance."
        )


def evaluate_assessment_attempt(
    db: Session,
    user: User,
    attempt_id: str,
    skill_id: Optional[str] = None
):
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.user_id == user.id
    ).first()
    if not attempt:
        raise ValueError(f"Quiz attempt '{attempt_id}' not found for this user.")

    # Prevent duplicate evaluation
    existing = db.query(CompetencyHistory).filter(
        CompetencyHistory.evidence_id == attempt_id,
        CompetencyHistory.user_id == user.id
    ).first()
    if existing:
        raise ValueError("This quiz attempt has already been evaluated for competency. Duplicate evaluations are not permitted.")

    # Resolve skill_id from linked material/course if not provided
    resolved_skill_id = skill_id
    if not resolved_skill_id:
        quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
        if quiz and quiz.material_id:
            mat = db.query(LearningMaterial).filter(LearningMaterial.id == quiz.material_id).first()
            if mat and mat.course_id:
                from app.models.user import TrainingCourse
                course = db.query(TrainingCourse).filter(TrainingCourse.id == mat.course_id).first()
                if course:
                    resolved_skill_id = course.skill_id

    # Fallback: pick the highest-gap skill from job role
    if not resolved_skill_id:
        from app.services.competency_service import get_employee_skill_gaps
        gaps = get_employee_skill_gaps(db, user)
        if gaps.gaps:
            resolved_skill_id = gaps.gaps[0].skill_id

    if not resolved_skill_id:
        raise ValueError("Could not resolve a target skill for this quiz attempt. Please specify skill_id.")

    skill = db.query(Skill).filter(Skill.id == resolved_skill_id).first()
    if not skill:
        raise ValueError(f"Skill '{resolved_skill_id}' not found.")

    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        raise ValueError("User profile not found.")

    emp_skill = db.query(EmployeeSkill).filter(
        EmployeeSkill.profile_id == profile.id,
        EmployeeSkill.skill_id == resolved_skill_id
    ).first()

    old_level = emp_skill.current_level if emp_skill else 0
    score = float(attempt.percentage)
    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    current_diff = (quiz.description or "").split("difficulty: ")[-1].split(".")[0] if quiz else "Medium"
    if current_diff not in DIFFICULTY_LEVELS:
        current_diff = "Medium"

    new_level = score_to_level_change(score, old_level)
    adaptive_next = score_to_adaptive_difficulty(score, current_diff)
    reason = build_reason(skill.name, old_level, new_level, score)

    # Update or create EmployeeSkill
    if emp_skill:
        emp_skill.current_level = new_level
        emp_skill.source = SkillSource.ASSESSMENT
    else:
        emp_skill = EmployeeSkill(
            profile_id=profile.id,
            skill_id=resolved_skill_id,
            current_level=new_level,
            source=SkillSource.ASSESSMENT
        )
        db.add(emp_skill)

    # Record competency history
    history_entry = CompetencyHistory(
        user_id=user.id,
        skill_id=resolved_skill_id,
        old_level=old_level,
        new_level=new_level,
        score=score,
        evidence_source="QUIZ_ASSESSMENT",
        evidence_id=attempt_id,
        assessment_difficulty=current_diff,
        adaptive_next_difficulty=adaptive_next,
        reason=reason
    )
    db.add(history_entry)
    db.commit()

    # Recalculate competency overview
    overview = get_employee_competency_overview(db, user)

    return {
        "attempt_id": attempt_id,
        "skill_id": resolved_skill_id,
        "skill_name": skill.name,
        "old_level": old_level,
        "new_level": new_level,
        "level_changed": new_level != old_level,
        "score": score,
        "evidence_source": "QUIZ_ASSESSMENT",
        "adaptive_next_difficulty": adaptive_next,
        "reason": reason,
        "updated_overall_match_percentage": overview.overall_match_percentage,
        "updated_skills_with_gaps": overview.skills_with_gaps,
    }


def get_assessment_progress(db: Session, user: User) -> dict:
    attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == user.id).all()
    total = len(attempts)
    passed = sum(1 for a in attempts if a.passed)
    avg_score = round(sum(a.percentage for a in attempts) / total, 1) if total else 0.0
    pass_rate = round((passed / total) * 100.0, 1) if total else 0.0

    # Learning streak: count consecutive days with attempts
    if attempts:
        dates = sorted({a.submitted_at.date() for a in attempts if a.submitted_at}, reverse=True)
        streak = 1
        for i in range(1, len(dates)):
            if (dates[i - 1] - dates[i]).days == 1:
                streak += 1
            else:
                break
        # Only count if most recent is today or yesterday
        today = datetime.now(timezone.utc).date()
        if dates and (today - dates[0]).days > 1:
            streak = 0
    else:
        streak = 0

    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    skills_count = db.query(EmployeeSkill).filter(EmployeeSkill.profile_id == profile.id).count() if profile else 0
    overview = get_employee_competency_overview(db, user)

    return {
        "user_id": user.id,
        "total_assessments_taken": total,
        "assessments_passed": passed,
        "pass_rate_percentage": pass_rate,
        "average_score": avg_score,
        "learning_streak_days": streak,
        "current_overall_match_percentage": overview.overall_match_percentage,
        "skills_count": skills_count,
    }


def get_assessment_history(db: Session, user: User) -> dict:
    records = db.query(CompetencyHistory).filter(
        CompetencyHistory.user_id == user.id
    ).order_by(CompetencyHistory.created_at.desc()).all()

    history = []
    for r in records:
        skill = db.query(Skill).filter(Skill.id == r.skill_id).first()
        history.append({
            "id": r.id,
            "skill_id": r.skill_id,
            "skill_name": skill.name if skill else r.skill_id,
            "old_level": r.old_level,
            "new_level": r.new_level,
            "score": r.score,
            "evidence_source": r.evidence_source,
            "adaptive_next_difficulty": r.adaptive_next_difficulty,
            "reason": r.reason,
            "created_at": r.created_at,
        })

    return {"total_records": len(history), "history": history}


def get_competency_progress(db: Session, user: User) -> dict:
    overview = get_employee_competency_overview(db, user)
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()

    skills_progress = []
    for item in overview.skills:
        records = db.query(CompetencyHistory).filter(
            CompetencyHistory.user_id == user.id,
            CompetencyHistory.skill_id == item.skill_id
        ).order_by(CompetencyHistory.created_at.asc()).all()

        skill_history = []
        for r in records:
            skill = db.query(Skill).filter(Skill.id == r.skill_id).first()
            skill_history.append({
                "id": r.id,
                "skill_id": r.skill_id,
                "skill_name": skill.name if skill else r.skill_id,
                "old_level": r.old_level,
                "new_level": r.new_level,
                "score": r.score,
                "evidence_source": r.evidence_source,
                "adaptive_next_difficulty": r.adaptive_next_difficulty,
                "reason": r.reason,
                "created_at": r.created_at,
            })

        last_eval = records[-1].created_at if records else None
        skills_progress.append({
            "skill_id": item.skill_id,
            "skill_name": item.skill_name,
            "category": str(item.skill_category.value if hasattr(item.skill_category, "value") else item.skill_category),
            "current_level": item.current_level,
            "current_level_label": item.current_level_label,
            "required_level": item.required_level,
            "required_level_label": item.required_level_label,
            "gap": item.gap,
            "total_evaluations": len(records),
            "last_evaluated_at": last_eval,
            "history": skill_history,
        })

    return {
        "user_id": user.id,
        "overall_match_percentage": overview.overall_match_percentage,
        "skills_progress": skills_progress,
    }
