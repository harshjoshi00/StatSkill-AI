import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db
from app.models.user import User, UserRole, Profile
from app.models.competency_history import CompetencyHistory
from app.models.learning import QuizAttempt, Quiz, LearningMaterial
from app.core.security import create_access_token
from app.services.assessment_service import (
    score_to_level_change, score_to_adaptive_difficulty, build_reason
)

client = TestClient(app)

# Ensure tables exist before helpers run outside of request context
from app.core.database import init_db
init_db()


def get_auth_header(role=UserRole.EMPLOYEE, email="phase7test@example.com"):
    db = next(get_db())
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, password_hash="hash", first_name="P7", last_name="Tester",
                    role=role, is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(user.id, role=user.role.value)
    return {"Authorization": f"Bearer {token}"}, user


# ---------------------------------------------------------------------------
# Unit Tests: Scoring Rules & Adaptive Difficulty
# ---------------------------------------------------------------------------

def test_score_to_level_change_high():
    """Score >= 80% increases level by 1"""
    assert score_to_level_change(85.0, 0) == 1
    assert score_to_level_change(80.0, 2) == 3
    assert score_to_level_change(100.0, 5) == 5  # capped at 5


def test_score_to_level_change_no_change():
    """Score 50-79% keeps same level"""
    assert score_to_level_change(75.0, 3) == 3
    assert score_to_level_change(50.0, 1) == 1


def test_score_to_level_change_low():
    """Score < 50% keeps same level"""
    assert score_to_level_change(40.0, 2) == 2
    assert score_to_level_change(0.0, 4) == 4


def test_adaptive_difficulty_increases():
    assert score_to_adaptive_difficulty(90.0, "Easy") == "Medium"
    assert score_to_adaptive_difficulty(80.0, "Medium") == "Hard"
    assert score_to_adaptive_difficulty(100.0, "Hard") == "Hard"  # capped


def test_adaptive_difficulty_maintained():
    assert score_to_adaptive_difficulty(70.0, "Medium") == "Medium"
    assert score_to_adaptive_difficulty(50.0, "Easy") == "Easy"


def test_adaptive_difficulty_decreases():
    assert score_to_adaptive_difficulty(30.0, "Hard") == "Medium"
    assert score_to_adaptive_difficulty(0.0, "Medium") == "Easy"
    assert score_to_adaptive_difficulty(0.0, "Easy") == "Easy"  # floor


def test_build_reason_level_increase():
    reason = build_reason("Statistics", 1, 2, 85.0)
    assert "changed from" in reason
    assert "85.0%" in reason


def test_build_reason_no_change_mid():
    reason = build_reason("Statistics", 2, 2, 70.0)
    assert "remains at" in reason
    assert "50–79%" in reason or "50" in reason


def test_build_reason_foundational():
    reason = build_reason("Statistics", 2, 2, 30.0)
    assert "foundational" in reason.lower()


# ---------------------------------------------------------------------------
# Integration Tests: Assessment APIs
# ---------------------------------------------------------------------------

def test_assessment_progress_api():
    headers, user = get_auth_header(email="p7prog@example.com")
    r = client.get("/api/v1/assessment/progress", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert "total_assessments_taken" in data
    assert "pass_rate_percentage" in data
    assert "learning_streak_days" in data


def test_assessment_history_api_empty():
    headers, _ = get_auth_header(email="p7hist@example.com")
    r = client.get("/api/v1/assessment/history", headers=headers)
    assert r.status_code == 200
    assert r.json()["total_records"] == 0


def test_competency_progress_api():
    headers, _ = get_auth_header(email="p7cprog@example.com")
    r = client.get("/api/v1/competency/progress", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert "overall_match_percentage" in data
    assert "skills_progress" in data


def test_evaluate_invalid_attempt_rejected():
    headers, _ = get_auth_header(email="p7eval@example.com")
    r = client.post("/api/v1/assessment/evaluate", headers=headers,
                    json={"attempt_id": "nonexistent-attempt-id"})
    assert r.status_code == 400


def test_full_evaluate_and_history_flow():
    """Upload material -> generate quiz -> submit -> evaluate -> check history"""
    headers, user = get_auth_header(email="p7flow@example.com")

    # Setup: create profile + skill for this user
    db = next(get_db())
    from app.models.user import Skill, SkillCategory
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        profile = Profile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    skill = db.query(Skill).filter(Skill.name == "CPI Analysis").first()
    if not skill:
        skill = Skill(name="CPI Analysis", category=SkillCategory.TECHNICAL)
        db.add(skill)
        db.commit()
        db.refresh(skill)

    # Upload material
    content = "Consumer Price Index (CPI) is the key inflation measure in India." * 10
    upload_r = client.post("/api/v1/learning/materials/upload", headers=headers,
                           data={"title": "CPI Study"},
                           files={"file": ("cpi.txt", content.encode(), "text/plain")})
    assert upload_r.status_code == 201
    mat_id = upload_r.json()["material"]["id"]

    # Generate quiz
    quiz_r = client.post(f"/api/v1/learning/materials/{mat_id}/quiz", headers=headers,
                         json={"num_questions": 3, "difficulty": "Medium"})
    assert quiz_r.status_code == 201
    quiz_id = quiz_r.json()["id"]

    # Submit with all correct answers
    from app.models.learning import QuizQuestion
    q_objs = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
    answers = [{"question_id": q.id, "selected_option": q.correct_answer} for q in q_objs]

    submit_r = client.post(f"/api/v1/quizzes/{quiz_id}/submit", headers=headers,
                           json={"answers": answers})
    assert submit_r.status_code == 200
    attempt_id = submit_r.json()["attempt_id"]
    score = submit_r.json()["percentage"]

    # Evaluate for competency update — pass skill_id explicitly
    eval_r = client.post("/api/v1/assessment/evaluate", headers=headers,
                         json={"attempt_id": attempt_id, "skill_id": skill.id})
    assert eval_r.status_code == 200, eval_r.json()
    eval_data = eval_r.json()
    assert "reason" in eval_data
    assert "Your competency" in eval_data["reason"]
    assert eval_data["score"] == score

    # Duplicate evaluation blocked
    dup_r = client.post("/api/v1/assessment/evaluate", headers=headers,
                        json={"attempt_id": attempt_id, "skill_id": skill.id})
    assert dup_r.status_code == 400
    assert "already been evaluated" in dup_r.json()["detail"]

    # History now has 1 record
    hist_r = client.get("/api/v1/assessment/history", headers=headers)
    assert hist_r.status_code == 200
    assert hist_r.json()["total_records"] >= 1


def test_unauthenticated_assessment_blocked():
    for endpoint in ["/api/v1/assessment/progress", "/api/v1/assessment/history",
                     "/api/v1/competency/progress"]:
        assert client.get(endpoint).status_code == 401
    assert client.post("/api/v1/assessment/evaluate",
                       json={"attempt_id": "x"}).status_code == 401

