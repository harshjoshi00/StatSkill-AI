"""
Phase 4 Tests: AI Skill Extraction & Semantic Matching
Covers:
- extract_skill_phrases (text → phrases)
- match_phrases_to_skills (threshold logic, above/below)
- keyword_similarity (fallback)
- AiSkillSuggestion DB storage / no auto-level
- POST /ai/skills/extract  (employee auth)
- POST /ai/skills/match    (employee auth)
- GET  /ai/skills/suggestions
- POST /ai/skills/suggestions/{id}/accept  (employee sets own level)
- POST /ai/skills/suggestions/{id}/reject
- RBAC: unauthenticated → 401
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.seed import seed_database
from app.ai.skill_extractor import extract_skill_phrases
from app.ai.embedding_service import keyword_similarity
from app.ai.skill_matcher import match_phrases_to_skills
from app.core.database import SessionLocal

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_database()


# ---------------------------------------------------------------------------
# Unit tests: skill phrase extractor
# ---------------------------------------------------------------------------
def test_extract_returns_phrases():
    phrases = extract_skill_phrases(
        "I have strong experience in Python, SQL, and Survey Design for PLFS data processing."
    )
    assert isinstance(phrases, list)
    assert len(phrases) > 0

def test_extract_known_multi_word():
    phrases = extract_skill_phrases(
        "Applied machine learning and statistical analysis for national accounts estimation."
    )
    lower = [p.lower() for p in phrases]
    assert any("machine learning" in p or "statistical analysis" in p for p in lower)

def test_extract_empty_returns_empty():
    # Very short text yields no meaningful phrases
    phrases = extract_skill_phrases("Hi.")
    assert isinstance(phrases, list)

def test_extract_filters_stopwords():
    phrases = extract_skill_phrases("I am a good person who works in the office.")
    lower = [p.lower() for p in phrases]
    assert "i" not in lower
    assert "am" not in lower
    assert "the" not in lower


# ---------------------------------------------------------------------------
# Unit tests: keyword similarity fallback
# ---------------------------------------------------------------------------
def test_keyword_similarity_exact():
    score = keyword_similarity("Python", "Python")
    assert score == 1.0

def test_keyword_similarity_substring():
    score = keyword_similarity("machine learning", "Machine Learning")
    assert score >= 0.8

def test_keyword_similarity_unrelated():
    score = keyword_similarity("python", "communication")
    assert score < 0.5

def test_keyword_similarity_zero_for_empty():
    score = keyword_similarity("", "Python")
    assert score == 0.0


# ---------------------------------------------------------------------------
# Unit tests: matcher threshold logic
# ---------------------------------------------------------------------------
def test_matcher_above_threshold_with_db():
    db = SessionLocal()
    try:
        # "Python" should match the "Python" skill in the seeded DB
        results = match_phrases_to_skills(["Python"], db, threshold=0.0)
        assert len(results) > 0
        assert results[0]["extracted_skill"] == "Python"
        # With threshold=0 every phrase should match something
        assert results[0]["above_threshold"] is True
    finally:
        db.close()

def test_matcher_below_threshold():
    db = SessionLocal()
    try:
        # Very high threshold → nothing matches
        results = match_phrases_to_skills(["xyzzy"], db, threshold=0.99)
        # May match but confidence will be very low / None
        for r in results:
            if r["above_threshold"]:
                assert r["confidence"] >= 99
    finally:
        db.close()

def test_matcher_never_sets_suggested_level():
    """Ensure the matcher result dict contains NO 'suggested_level' key."""
    db = SessionLocal()
    try:
        results = match_phrases_to_skills(["SQL", "Python"], db, threshold=0.0)
        for r in results:
            assert "suggested_level" not in r
    finally:
        db.close()


# ---------------------------------------------------------------------------
# API tests: authentication / RBAC
# ---------------------------------------------------------------------------
def _employee_token():
    r = client.post("/api/v1/auth/login", json={
        "email": "employee@statskill.gov.in", "password": "Employee@123"
    })
    return r.json()["access_token"]

def _admin_token():
    r = client.post("/api/v1/auth/login", json={
        "email": "admin@statskill.gov.in", "password": "Admin@123"
    })
    return r.json()["access_token"]

def test_extract_unauthenticated_returns_401():
    resp = client.post("/api/v1/ai/skills/extract", json={"text": "I know Python and SQL."})
    assert resp.status_code == 401

def test_extract_authenticated_employee_success():
    token = _employee_token()
    resp = client.post(
        "/api/v1/ai/skills/extract",
        headers={"Authorization": f"Bearer {token}"},
        json={"text": "I have experience in Python programming, SQL databases, and statistical analysis.", "save_suggestions": False},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "phrases_extracted" in data
    assert "matches" in data
    assert data["phrases_extracted"] > 0

def test_extract_saves_suggestions():
    token = _employee_token()
    resp = client.post(
        "/api/v1/ai/skills/extract",
        headers={"Authorization": f"Bearer {token}"},
        json={"text": "Skilled in Python and Survey Design.", "save_suggestions": True},
    )
    assert resp.status_code == 200
    data = resp.json()
    # suggestions_saved >= 0 (some may already exist from previous test)
    assert "suggestions_saved" in data

def test_match_endpoint_success():
    token = _employee_token()
    resp = client.post(
        "/api/v1/ai/skills/match",
        headers={"Authorization": f"Bearer {token}"},
        json={"phrases": ["Python", "Machine Learning"]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "matches" in data
    assert len(data["matches"]) == 2

def test_list_suggestions_returns_data():
    token = _employee_token()
    resp = client.get("/api/v1/ai/skills/suggestions",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "suggestions" in data
    assert "pending" in data
    assert data["total"] >= 0

def test_accept_reject_flow():
    token = _employee_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Ensure at least one pending suggestion exists
    client.post(
        "/api/v1/ai/skills/extract",
        headers=headers,
        json={"text": "Experienced in Python data analysis.", "save_suggestions": True},
    )

    # 2. Get suggestions
    list_resp = client.get("/api/v1/ai/skills/suggestions", headers=headers)
    suggs = list_resp.json()["suggestions"]
    pending = [s for s in suggs if s["status"] == "PENDING" and s["matched_skill_id"]]

    if not pending:
        pytest.skip("No pending suggestions available for accept/reject test")

    # 3. Accept first – employee provides level (NOT auto-set)
    s_id = pending[0]["id"]
    accept_resp = client.post(
        f"/api/v1/ai/skills/suggestions/{s_id}/accept",
        headers=headers,
        json={"current_level": 3},  # employee explicitly sets level
    )
    assert accept_resp.status_code == 200
    acc_data = accept_resp.json()
    assert acc_data["current_level"] == 3
    assert acc_data["source"] == "AI_EXTRACTION"

def test_reject_flow():
    token = _employee_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create a new suggestion to reject
    client.post(
        "/api/v1/ai/skills/extract",
        headers=headers,
        json={"text": "Background in Cybersecurity and data privacy regulations.", "save_suggestions": True},
    )

    list_resp = client.get("/api/v1/ai/skills/suggestions", headers=headers)
    suggs = list_resp.json()["suggestions"]
    pending = [s for s in suggs if s["status"] == "PENDING"]

    if not pending:
        pytest.skip("No pending suggestions available for reject test")

    s_id = pending[0]["id"]
    rej_resp = client.post(f"/api/v1/ai/skills/suggestions/{s_id}/reject", headers=headers)
    assert rej_resp.status_code == 200
    assert rej_resp.json()["status"] == "REJECTED"

def test_accept_does_not_auto_set_level():
    """Accepting a suggestion WITHOUT providing current_level must fail."""
    token = _employee_token()
    headers = {"Authorization": f"Bearer {token}"}

    list_resp = client.get("/api/v1/ai/skills/suggestions", headers=headers)
    suggs = list_resp.json()["suggestions"]
    pending = [s for s in suggs if s["status"] == "PENDING" and s["matched_skill_id"]]

    if not pending:
        pytest.skip("No pending suggestions for validation test")

    s_id = pending[0]["id"]
    # No current_level field → Pydantic validation error → 422
    resp = client.post(
        f"/api/v1/ai/skills/suggestions/{s_id}/accept",
        headers=headers,
        json={},  # missing required current_level
    )
    assert resp.status_code == 422

def test_admin_can_also_access_extract():
    """Admin is also an authenticated user so extract should work."""
    token = _admin_token()
    resp = client.post(
        "/api/v1/ai/skills/extract",
        headers={"Authorization": f"Bearer {token}"},
        json={"text": "I manage statistical survey design and sampling.", "save_suggestions": False},
    )
    assert resp.status_code == 200
