import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.utils.seed import seed_database

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_database()

def test_health_endpoint():
    response = client.get("/api/v1/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_employee_success():
    response = client.post("/api/v1/auth/login", json={
        "email": "employee@statskill.gov.in",
        "password": "Employee@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "EMPLOYEE"
    assert data["user"]["email"] == "employee@statskill.gov.in"

def test_login_admin_success():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@statskill.gov.in",
        "password": "Admin@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"

def test_login_invalid_credentials():
    response = client.post("/api/v1/auth/login", json={
        "email": "employee@statskill.gov.in",
        "password": "WrongPassword123"
    })
    assert response.status_code == 401

def test_register_duplicate_email():
    response = client.post("/api/v1/auth/register", json={
        "first_name": "Test",
        "last_name": "Official",
        "email": "employee@statskill.gov.in",
        "password": "Password123"
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_register_new_official():
    unique_email = f"test.{uuid.uuid4().hex[:8]}@statskill.gov.in"
    response = client.post("/api/v1/auth/register", json={
        "first_name": "Anita",
        "last_name": "Roy",
        "email": unique_email,
        "password": "Password123"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["role"] == "EMPLOYEE"
    assert data["user"]["first_name"] == "Anita"

def test_auth_me_and_rbac():
    # Login as Employee
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "employee@statskill.gov.in",
        "password": "Employee@123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # /auth/me should succeed
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "employee@statskill.gov.in"

    # Employee attempting admin endpoint MUST return 403 Forbidden
    admin_resp = client.get("/api/v1/admin/analytics", headers=headers)
    assert admin_resp.status_code == 403
    assert "Administrator access required" in admin_resp.json()["detail"]

def test_admin_access_allowed():
    # Login as Admin
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "admin@statskill.gov.in",
        "password": "Admin@123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Admin accessing /admin/analytics MUST succeed
    admin_resp = client.get("/api/v1/admin/analytics", headers=headers)
    assert admin_resp.status_code == 200
    assert admin_resp.json()["total_employees"] >= 2
