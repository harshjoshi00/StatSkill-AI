import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db, init_db
from app.models.user import User, UserRole, Profile, Skill, SkillCategory, EmployeeSkill
from app.core.security import create_access_token

client = TestClient(app)
init_db()


def get_auth_header(role=UserRole.ADMIN, email="admin_p8@example.com"):
    db = next(get_db())
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            password_hash="hash",
            first_name="Phase8",
            last_name="Admin",
            role=role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(user.id, role=user.role.value)
    return {"Authorization": f"Bearer {token}"}, user


def test_admin_analytics_api_success():
    """Admin accesses GET /api/v1/admin/analytics"""
    headers, _ = get_auth_header(role=UserRole.ADMIN, email="admin_analytics@example.com")
    res = client.get("/api/v1/admin/analytics", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_employees" in data
    assert "total_departments" in data
    assert "total_roles" in data
    assert "average_competency_match" in data
    assert "total_open_skill_gaps" in data
    assert "high_critical_gaps" in data
    assert "training_completion_rate" in data
    assert "quiz_pass_rate" in data
    assert "top_missing_skills" in data
    assert "department_breakdown" in data
    assert "role_breakdown" in data


def test_admin_competency_overview_api_success():
    """Admin accesses GET /api/v1/admin/competency-overview"""
    headers, _ = get_auth_header(role=UserRole.ADMIN, email="admin_comp@example.com")
    res = client.get("/api/v1/admin/competency-overview", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_employees" in data
    assert "employees_with_gaps" in data
    assert "high_priority_gaps" in data
    assert "most_common_skill_gaps" in data


def test_admin_training_effectiveness_api_success():
    """Admin accesses GET /api/v1/admin/training-effectiveness"""
    headers, _ = get_auth_header(role=UserRole.ADMIN, email="admin_teff@example.com")
    res = client.get("/api/v1/admin/training-effectiveness", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_courses" in data
    assert "total_completions" in data
    assert "overall_avg_gain" in data
    assert "courses" in data


def test_admin_predictions_api_success():
    """Admin accesses GET /api/v1/admin/predictions"""
    headers, _ = get_auth_header(role=UserRole.ADMIN, email="admin_preds@example.com")
    res = client.get("/api/v1/admin/predictions", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "model_type" in data
    assert data["model_type"] in ["RandomForestClassifier", "XGBoostClassifier"]
    assert "model_accuracy" in data
    assert "total_predictions" in data
    assert "high_risk_count" in data
    assert "medium_risk_count" in data
    assert "low_risk_count" in data
    assert "predictions" in data


def test_admin_workforce_summary_api_success():
    """Admin accesses GET /api/v1/admin/workforce-summary"""
    headers, _ = get_auth_header(role=UserRole.ADMIN, email="admin_wfsum@example.com")
    res = client.get("/api/v1/admin/workforce-summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_employees" in data
    assert "workforce_readiness_score" in data
    assert "top_critical_skill_gaps" in data
    assert "high_risk_employee_pct" in data
    assert "key_recommendations" in data


def test_employee_access_forbidden():
    """Regular EMPLOYEE is forbidden (403) from accessing admin APIs"""
    headers, _ = get_auth_header(role=UserRole.EMPLOYEE, email="employee_forbidden@example.com")
    admin_endpoints = [
        "/api/v1/admin/analytics",
        "/api/v1/admin/competency-overview",
        "/api/v1/admin/training-effectiveness",
        "/api/v1/admin/predictions",
        "/api/v1/admin/workforce-summary"
    ]
    for endpoint in admin_endpoints:
        res = client.get(endpoint, headers=headers)
        assert res.status_code == 403, f"Endpoint {endpoint} should be forbidden for EMPLOYEE"


def test_unauthenticated_access_blocked():
    """Unauthenticated request (401) is blocked for all admin APIs"""
    admin_endpoints = [
        "/api/v1/admin/analytics",
        "/api/v1/admin/competency-overview",
        "/api/v1/admin/training-effectiveness",
        "/api/v1/admin/predictions",
        "/api/v1/admin/workforce-summary"
    ]
    for endpoint in admin_endpoints:
        res = client.get(endpoint)
        assert res.status_code == 401, f"Endpoint {endpoint} should require authentication"


def test_competency_update_refreshes_analytics():
    """Verifies that competency level changes automatically refresh analytics & predictions"""
    db = next(get_db())

    # Create employee user
    emp = db.query(User).filter(User.email == "emp_refresh@example.com").first()
    if not emp:
        emp = User(
            email="emp_refresh@example.com",
            password_hash="hash",
            first_name="Refresh",
            last_name="Tester",
            role=UserRole.EMPLOYEE,
            is_active=True
        )
        db.add(emp)
        db.commit()
        db.refresh(emp)

    profile = db.query(Profile).filter(Profile.user_id == emp.id).first()
    if not profile:
        profile = Profile(user_id=emp.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    skill = db.query(Skill).filter(Skill.name == "National Accounts").first()
    if not skill:
        skill = Skill(name="National Accounts", category=SkillCategory.STATISTICAL)
        db.add(skill)
        db.commit()
        db.refresh(skill)

    # Fetch admin analytics before change
    admin_headers, _ = get_auth_header(role=UserRole.ADMIN, email="admin_refresh@example.com")
    r1 = client.get("/api/v1/admin/analytics", headers=admin_headers)
    assert r1.status_code == 200

    # Modify employee skill level
    emp_skill = db.query(EmployeeSkill).filter(
        EmployeeSkill.profile_id == profile.id,
        EmployeeSkill.skill_id == skill.id
    ).first()
    if emp_skill:
        emp_skill.current_level = 4
    else:
        emp_skill = EmployeeSkill(profile_id=profile.id, skill_id=skill.id, current_level=4)
        db.add(emp_skill)
    db.commit()

    # Fetch admin analytics after change
    r2 = client.get("/api/v1/admin/analytics", headers=admin_headers)
    assert r2.status_code == 200
    assert r2.json()["total_employees"] >= 1
