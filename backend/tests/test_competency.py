import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.seed import seed_database
from app.services.competency_service import (
    calculate_gap, classify_gap, determine_priority, generate_gap_explanation
)
from app.models.user import SkillImportance

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_database()

# Unit Tests for Competency Engine Logic
def test_calculate_gap():
    assert calculate_gap(required_level=4, current_level=2) == 2
    assert calculate_gap(required_level=3, current_level=3) == 0
    assert calculate_gap(required_level=2, current_level=4) == -2

def test_classify_gap():
    assert classify_gap(0) == "NO_GAP"
    assert classify_gap(-1) == "NO_GAP"
    assert classify_gap(1) == "LOW"
    assert classify_gap(2) == "MEDIUM"
    assert classify_gap(3) == "HIGH"
    assert classify_gap(4) == "HIGH"

def test_determine_priority():
    assert determine_priority(SkillImportance.HIGH, "NO_GAP") == "NONE"
    assert determine_priority(SkillImportance.CRITICAL, "HIGH") == "CRITICAL"
    assert determine_priority(SkillImportance.MEDIUM, "HIGH") == "HIGH"
    assert determine_priority(SkillImportance.CRITICAL, "MEDIUM") == "HIGH"
    assert determine_priority(SkillImportance.HIGH, "MEDIUM") == "MEDIUM"
    assert determine_priority(SkillImportance.LOW, "MEDIUM") == "LOW"
    assert determine_priority(SkillImportance.CRITICAL, "LOW") == "MEDIUM"
    assert determine_priority(SkillImportance.MEDIUM, "LOW") == "LOW"

def test_generate_gap_explanation():
    exp_gap = generate_gap_explanation(
        skill_name="Python",
        role_title="Statistical Officer",
        current_level=2,
        required_level=4,
        importance=SkillImportance.CRITICAL,
        gap=2,
        classification="MEDIUM",
        priority="HIGH"
    )
    assert "Skill Gap Identified" in exp_gap
    assert "Python" in exp_gap
    assert "Statistical Officer" in exp_gap
    assert "Level 4" in exp_gap or "Advanced" in exp_gap

    exp_met = generate_gap_explanation(
        skill_name="Excel",
        role_title="Statistical Officer",
        current_level=4,
        required_level=4,
        importance=SkillImportance.MEDIUM,
        gap=0,
        classification="NO_GAP",
        priority="NONE"
    )
    assert "Requirement Met" in exp_met

# API & Authorization Tests
def test_employee_competency_overview_success():
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "employee@statskill.gov.in",
        "password": "Employee@123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/competency", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "overall_match_percentage" in data
    assert "skills" in data
    assert len(data["skills"]) > 0

def test_employee_competency_summary_success():
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "employee@statskill.gov.in",
        "password": "Employee@123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/competency/summary", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_required_skills" in data
    assert "skills_with_gaps" in data

def test_employee_competency_gaps_success():
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "employee@statskill.gov.in",
        "password": "Employee@123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/competency/gaps", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "gaps" in data
    for gap_item in data["gaps"]:
        assert gap_item["gap"] > 0
        assert "explanation" in gap_item

def test_admin_competency_overview_authorization():
    # 1. Unauthenticated request -> 401
    unauth_resp = client.get("/api/v1/admin/competency-overview")
    assert unauth_resp.status_code == 401

    # 2. Employee token attempting admin overview -> 403 Forbidden
    emp_login = client.post("/api/v1/auth/login", json={
        "email": "employee@statskill.gov.in",
        "password": "Employee@123"
    })
    emp_headers = {"Authorization": f"Bearer {emp_login.json()['access_token']}"}
    emp_resp = client.get("/api/v1/admin/competency-overview", headers=emp_headers)
    assert emp_resp.status_code == 403
    assert "Administrator access required" in emp_resp.json()["detail"]

    # 3. Admin token attempting admin overview -> 200 OK
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@statskill.gov.in",
        "password": "Admin@123"
    })
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    admin_resp = client.get("/api/v1/admin/competency-overview", headers=admin_headers)
    assert admin_resp.status_code == 200
    admin_data = admin_resp.json()
    assert "total_employees" in admin_data
    assert "most_common_skill_gaps" in admin_data
    assert "department_summary" in admin_data
    assert "role_summary" in admin_data
