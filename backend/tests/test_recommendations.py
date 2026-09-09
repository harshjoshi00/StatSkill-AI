import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.seed import seed_database
from app.models.user import User, TrainingCourse, Skill

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_database()

def get_employee_token():
    res = client.post("/api/v1/auth/login", json={"email": "employee@statskill.gov.in", "password": "Employee@123"})
    if res.status_code != 200:
        res = client.post("/api/v1/auth/login", json={"email": "employee@statskill.local", "password": "Employee@123"})
    return res.json()["access_token"]


def test_list_training_courses_unauthorized():
    res = client.get("/api/v1/training-courses")
    assert res.status_code == 401


def test_list_training_courses_authenticated():
    token = get_employee_token()
    res = client.get("/api/v1/training-courses", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    courses = res.json()
    assert isinstance(courses, list)
    assert len(courses) > 0
    assert "title" in courses[0]
    assert "provider" in courses[0]


def test_get_recommendations_hybrid():
    token = get_employee_token()
    res = client.get("/api/v1/recommendations", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "recommendations" in data
    assert "total_recommended" in data
    assert "high_priority_count" in data
    assert data["total_recommended"] > 0
    
    # Verify ranking descending order
    recs = data["recommendations"]
    for i in range(len(recs) - 1):
        assert recs[i]["match_score"] >= recs[i+1]["match_score"]
    
    first = recs[0]
    assert "course" in first
    assert "match_score" in first
    assert "match_percentage" in first
    assert "match_reasons" in first
    assert 0.0 <= first["match_score"] <= 1.0


def test_get_recommendations_priority_filter():
    token = get_employee_token()
    res = client.get("/api/v1/recommendations?priority=HIGH_PRIORITY", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    for item in data["recommendations"]:
        assert item["gap_priority"] in ["HIGH", "CRITICAL"]


def test_get_recommendations_by_skill():
    token = get_employee_token()
    # First get catalog to find a skill_id
    c_res = client.get("/api/v1/training-courses", headers={"Authorization": f"Bearer {token}"})
    skill_id = c_res.json()[0]["skill_id"]
    
    res = client.get(f"/api/v1/recommendations/{skill_id}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    for item in data["recommendations"]:
        assert item["skill_id"] == skill_id


def test_get_recommendations_difficulty_filter():
    token = get_employee_token()
    res = client.get("/api/v1/recommendations?difficulty=BEGINNER", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    for item in data["recommendations"]:
        assert item["course"]["difficulty"] == "BEGINNER"


def test_start_and_complete_course_flow():
    token = get_employee_token()
    c_res = client.get("/api/v1/training-courses", headers={"Authorization": f"Bearer {token}"})
    course_id = c_res.json()[0]["id"]

    # Start Course
    start_res = client.post(f"/api/v1/recommendations/{course_id}/start", headers={"Authorization": f"Bearer {token}"})
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "IN_PROGRESS"

    # Verify status in recommendations
    rec_res = client.get("/api/v1/recommendations", headers={"Authorization": f"Bearer {token}"})
    found = [r for r in rec_res.json()["recommendations"] if r["course"]["id"] == course_id]
    if found:
        assert found[0]["status"] == "IN_PROGRESS"

    # Complete Course
    comp_res = client.post(f"/api/v1/recommendations/{course_id}/complete", headers={"Authorization": f"Bearer {token}"})
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "COMPLETED"

    # Verify status in recommendations
    rec_res2 = client.get("/api/v1/recommendations", headers={"Authorization": f"Bearer {token}"})
    found2 = [r for r in rec_res2.json()["recommendations"] if r["course"]["id"] == course_id]
    if found2:
        assert found2[0]["status"] == "COMPLETED"
