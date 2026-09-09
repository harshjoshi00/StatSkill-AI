import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.user import (
    User, UserRole, Profile, Department, JobRole, Skill,
    EmployeeSkill, TrainingHistory, TrainingStatus, TrainingCourse
)
from app.models.learning import QuizAttempt, Quiz, LearningMaterial
from app.models.competency_history import CompetencyHistory
from app.schemas.admin_analytics import (
    AdminAnalyticsResponse,
    TrainingEffectivenessResponse,
    TrainingEffectivenessCourseItem,
    AdminPredictionsResponse,
    WorkforceSummaryResponse
)
from app.services.competency_service import get_admin_competency_overview, get_employee_competency_overview
from app.ml.risk_prediction import predict_workforce_risk

logger = logging.getLogger(__name__)

def get_admin_analytics(db: Session) -> AdminAnalyticsResponse:
    """
    Compute aggregate workforce analytics across all employees, departments, trainings, and quiz attempts.
    """
    employees = db.query(User).filter(User.role == UserRole.EMPLOYEE).all()
    total_employees = len(employees)

    total_depts = db.query(Department).count()
    total_roles = db.query(JobRole).count()
    total_skills = db.query(Skill).count()

    # Calculate employee match percentages and gaps
    match_percentages = []
    total_open_gaps = 0
    high_critical_gaps = 0

    for emp in employees:
        overview = get_employee_competency_overview(db, emp)
        match_percentages.append(overview.overall_match_percentage)
        for s in overview.skills:
            if s.gap > 0:
                total_open_gaps += 1
            if s.priority in ["HIGH", "CRITICAL"]:
                high_critical_gaps += 1

    avg_competency_match = round(sum(match_percentages) / len(match_percentages), 1) if match_percentages else 100.0

    # Training History metrics
    trainings = db.query(TrainingHistory).all()
    total_trainings = len(trainings)
    completed_trainings = sum(1 for t in trainings if t.status == TrainingStatus.COMPLETED)
    training_completion_rate = round((completed_trainings / total_trainings) * 100.0, 1) if total_trainings > 0 else 100.0

    # Quiz Attempts metrics
    attempts = db.query(QuizAttempt).all()
    total_quiz_attempts = len(attempts)
    passed_attempts = sum(1 for a in attempts if a.passed)
    quiz_pass_rate = round((passed_attempts / total_quiz_attempts) * 100.0, 1) if total_quiz_attempts > 0 else 0.0
    avg_quiz_score = round(sum(a.percentage for a in attempts) / total_quiz_attempts, 1) if total_quiz_attempts > 0 else 0.0

    # Get admin competency overview for department/role breakdowns
    comp_overview = get_admin_competency_overview(db)

    # Effectiveness summary
    eff = get_training_effectiveness(db)
    eff_summary = {
        "total_courses_evaluated": eff.total_courses,
        "total_completions": eff.total_completions,
        "overall_avg_competency_gain": eff.overall_avg_gain,
        "overall_quiz_pass_rate": quiz_pass_rate
    }

    return AdminAnalyticsResponse(
        total_employees=total_employees,
        total_departments=total_depts,
        total_roles=total_roles,
        total_skills=total_skills,
        average_competency_match=avg_competency_match,
        total_open_skill_gaps=total_open_gaps,
        high_critical_gaps=high_critical_gaps,
        training_completed_count=completed_trainings,
        training_completion_rate=training_completion_rate,
        total_quiz_attempts=total_quiz_attempts,
        average_quiz_score=avg_quiz_score,
        quiz_pass_rate=quiz_pass_rate,
        top_missing_skills=comp_overview.most_common_skill_gaps,
        department_breakdown=comp_overview.department_summary,
        role_breakdown=comp_overview.role_summary,
        training_effectiveness_summary=eff_summary
    )


def get_training_effectiveness(db: Session) -> TrainingEffectivenessResponse:
    """
    Evaluate training effectiveness per course by measuring completion rate, average quiz scores,
    and competency level gains recorded in CompetencyHistory.
    """
    courses = db.query(TrainingCourse).all()
    course_items: List[TrainingEffectivenessCourseItem] = []

    total_completions_all = 0
    gains_all = []

    for course in courses:
        # Enrolled trainees (matching course title in TrainingHistory or linked)
        history_entries = db.query(TrainingHistory).filter(
            TrainingHistory.course_name.ilike(f"%{course.title}%")
        ).all()

        enrolled = len(history_entries)
        completed = sum(1 for h in history_entries if h.status == TrainingStatus.COMPLETED)
        comp_rate = round((completed / enrolled) * 100.0, 1) if enrolled > 0 else (100.0 if course.active else 0.0)

        # Quizzes linked to materials of this course
        materials = db.query(LearningMaterial).filter(LearningMaterial.course_id == course.id).all()
        material_ids = [m.id for m in materials]

        quizzes = db.query(Quiz).filter(Quiz.material_id.in_(material_ids)).all() if material_ids else []
        quiz_ids = [q.id for q in quizzes]

        attempts = db.query(QuizAttempt).filter(QuizAttempt.quiz_id.in_(quiz_ids)).all() if quiz_ids else []
        avg_q_score = round(sum(a.percentage for a in attempts) / len(attempts), 1) if attempts else 75.0

        # Competency gain for skill_id associated with course
        history_records = db.query(CompetencyHistory).filter(
            CompetencyHistory.skill_id == course.skill_id
        ).all()

        if history_records:
            course_gains = [max(r.new_level - r.old_level, 0) for r in history_records]
            avg_gain = round(sum(course_gains) / len(course_gains), 1)
        else:
            avg_gain = 1.0  # default baseline gain if no history recorded yet

        # Composite effectiveness score (0-100)
        eff_score = round(0.4 * comp_rate + 0.4 * avg_q_score + 0.2 * min(avg_gain * 20.0, 100.0), 1)

        total_completions_all += completed
        gains_all.append(avg_gain)

        course_items.append(TrainingEffectivenessCourseItem(
            course_id=course.id,
            course_title=course.title,
            provider=course.provider,
            enrolled_count=max(enrolled, completed),
            completed_count=completed,
            completion_rate=comp_rate,
            avg_quiz_score=avg_q_score,
            competency_gain_avg=avg_gain,
            effectiveness_score=eff_score
        ))

    overall_avg_gain = round(sum(gains_all) / len(gains_all), 1) if gains_all else 0.0

    return TrainingEffectivenessResponse(
        total_courses=len(courses),
        total_completions=total_completions_all,
        overall_avg_gain=overall_avg_gain,
        courses=course_items
    )


def get_admin_predictions(db: Session) -> AdminPredictionsResponse:
    """
    Get explainable ML workforce risk predictions for administrator console.
    """
    pred_data = predict_workforce_risk(db)
    return AdminPredictionsResponse(**pred_data)


def get_workforce_summary(db: Session) -> WorkforceSummaryResponse:
    """
    Generate top-level executive workforce summary report.
    """
    analytics = get_admin_analytics(db)
    preds = get_admin_predictions(db)

    high_risk_pct = round((preds.high_risk_count / analytics.total_employees) * 100.0, 1) if analytics.total_employees > 0 else 0.0

    recommendations = []
    if analytics.high_critical_gaps > 0:
        recommendations.append(f"Prioritize immediate training intervention for {analytics.high_critical_gaps} critical role skill gap(s).")
    if preds.high_risk_count > 0:
        recommendations.append(f"Deploy specialized learning paths for {preds.high_risk_count} high-risk official(s) identified by ML predictions.")
    if analytics.quiz_pass_rate < 70.0 and analytics.total_quiz_attempts > 0:
        recommendations.append(f"Improve quiz pass rate ({analytics.quiz_pass_rate}%) by recommending foundational material reviews before re-testing.")
    if not recommendations:
        recommendations.append("Workforce competency aligns strongly with MOSPI cadre benchmarks. Continue continuous skill assessments.")

    return WorkforceSummaryResponse(
        total_employees=analytics.total_employees,
        workforce_readiness_score=analytics.average_competency_match,
        top_critical_skill_gaps=analytics.top_missing_skills[:5],
        high_risk_employee_pct=high_risk_pct,
        training_completion_pct=analytics.training_completion_rate,
        key_recommendations=recommendations
    )
