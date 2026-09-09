import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.core.database import Base, engine, get_db
from app.models.user import User, UserRole
from app.models.learning import LearningMaterial, MaterialChunk, Quiz, QuizQuestion, QuizAttempt
from app.rag.parser import extract_text_from_file, extract_text_from_txt, extract_text_from_pdf, extract_text_from_pptx
from app.rag.chunker import chunk_text
from app.rag.retrieval import retrieve_top_chunks
from app.ai.llm_service import LLMService, MCQValidationError, get_llm_service
from app.core.security import create_access_token

client = TestClient(app)

# Helper token generator
def get_auth_header(role: UserRole = UserRole.EMPLOYEE, email: str = "test_phase6@example.com"):
    db = next(get_db())
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            password_hash="hashed_pw",
            first_name="Phase6",
            last_name="Tester",
            role=role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id, role=user.role.value)
    return {"Authorization": f"Bearer {token}"}, user


# ---------------------------------------------------------------------------
# Unit Tests: Parser, Chunker, Retrieval, LLM Validation
# ---------------------------------------------------------------------------

def test_extract_text_from_txt():
    sample_bytes = "Official Statistical System of India is managed by MoSPI.".encode("utf-8")
    extracted = extract_text_from_txt(sample_bytes)
    assert "MoSPI" in extracted


def test_extract_text_from_file_unsupported_and_empty():
    with pytest.raises(ValueError, match="empty"):
        extract_text_from_file(b"", "sample.txt")

    with pytest.raises(ValueError, match="Unsupported file format"):
        extract_text_from_file(b"data", "sample.exe")


def test_text_chunker():
    long_text = "Sentence one about National Accounts. " * 50
    chunks = chunk_text(long_text, chunk_size=200, overlap=30)
    assert len(chunks) > 1
    assert "National Accounts" in chunks[0]


def test_mcq_validation():
    llm = LLMService()

    valid_q = {
        "question": "What is the capital of India?",
        "options": ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
        "correct_answer": "New Delhi",
        "explanation": "New Delhi is the constitutional capital.",
        "difficulty": "Easy"
    }
    normalized = llm.validate_and_normalize_mcq(valid_q, [])
    assert normalized["correct_answer"] == "New Delhi"
    assert len(normalized["options"]) == 4

    # Invalid: missing option
    invalid_options = {
        "question": "Sample Question",
        "options": ["Opt1", "Opt2"],
        "correct_answer": "Opt1"
    }
    with pytest.raises(MCQValidationError):
        llm.validate_and_normalize_mcq(invalid_options, [])

    # Invalid: correct answer not in options
    wrong_answer = {
        "question": "Sample Question",
        "options": ["Opt1", "Opt2", "Opt3", "Opt4"],
        "correct_answer": "NonExistent"
    }
    with pytest.raises(MCQValidationError):
        llm.validate_and_normalize_mcq(wrong_answer, [])


# ---------------------------------------------------------------------------
# Integration Tests: Material Upload, Quiz Generation, Submission & Result APIs
# ---------------------------------------------------------------------------

def test_upload_material_api_success():
    headers, user = get_auth_header(email="uploader@example.com")
    content = "Sample text regarding CPI survey methodology in official statistics.\n" * 10
    file_payload = ("cpi_methodology.txt", content.encode("utf-8"), "text/plain")

    response = client.post(
        "/api/v1/learning/materials/upload",
        headers=headers,
        data={"title": "CPI Survey Overview"},
        files={"file": file_payload}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["material"]["title"] == "CPI Survey Overview"
    assert data["material"]["file_type"] == "txt"
    assert data["chunks_created"] >= 1
    material_id = data["material"]["id"]

    # Verify listing API
    list_resp = client.get("/api/v1/learning/materials", headers=headers)
    assert list_resp.status_code == 200
    materials = list_resp.json()
    assert any(m["id"] == material_id for m in materials)


def test_upload_empty_file_rejected():
    headers, _ = get_auth_header(email="uploader_empty@example.com")
    empty_file = ("empty.txt", b"", "text/plain")

    response = client.post(
        "/api/v1/learning/materials/upload",
        headers=headers,
        files={"file": empty_file}
    )
    assert response.status_code == 400


def test_create_quiz_and_submit_flow():
    headers, user = get_auth_header(email="quiz_taker@example.com")

    # 1. Upload Material
    text_content = (
        "Consumer Price Index (CPI) measures changes over time in general level of prices of goods and services. "
        "The National Statistical Office (NSO) compiles CPI in India. "
        "Base year for current CPI series is 2012=100. "
        "Index covers rural, urban and combined sectors across all states."
    )
    file_payload = ("cpi_guide.txt", text_content.encode("utf-8"), "text/plain")
    upload_res = client.post(
        "/api/v1/learning/materials/upload",
        headers=headers,
        data={"title": "CPI Guide"},
        files={"file": file_payload}
    )
    assert upload_res.status_code == 201
    material_id = upload_res.json()["material"]["id"]

    # 2. Generate Quiz
    quiz_res = client.post(
        f"/api/v1/learning/materials/{material_id}/quiz",
        headers=headers,
        json={"num_questions": 3, "difficulty": "Medium", "topic": "CPI"}
    )
    assert quiz_res.status_code == 201
    quiz_data = quiz_res.json()
    assert quiz_data["material_id"] == material_id
    assert len(quiz_data["questions"]) == 3
    assert quiz_data["is_demo"] is True  # No API key in test environment
    quiz_id = quiz_data["id"]

    # 3. Fetch Quiz by ID
    get_quiz_res = client.get(f"/api/v1/quizzes/{quiz_id}", headers=headers)
    assert get_quiz_res.status_code == 200
    assert len(get_quiz_res.json()["questions"]) == 3

    # 4. Submit Quiz Attempt
    q1 = quiz_data["questions"][0]
    answers_payload = [
        {"question_id": q1["id"], "selected_option": q1["options"][0]},
        {"question_id": quiz_data["questions"][1]["id"], "selected_option": "Wrong Answer Choice"}
    ]

    submit_res = client.post(
        f"/api/v1/quizzes/{quiz_id}/submit",
        headers=headers,
        json={"answers": answers_payload}
    )
    assert submit_res.status_code == 200
    attempt_data = submit_res.json()
    assert attempt_data["quiz_id"] == quiz_id
    assert "score" in attempt_data
    assert "percentage" in attempt_data
    assert len(attempt_data["answers"]) == 3

    # 5. Fetch Latest Result
    result_res = client.get(f"/api/v1/quizzes/{quiz_id}/result", headers=headers)
    assert result_res.status_code == 200
    assert result_res.json()["attempt_id"] == attempt_data["attempt_id"]


def test_unauthenticated_requests_blocked():
    upload_res = client.post("/api/v1/learning/materials/upload")
    assert upload_res.status_code == 401

    list_res = client.get("/api/v1/learning/materials")
    assert list_res.status_code == 401

    quiz_res = client.post("/api/v1/learning/materials/fake-id/quiz", json={"num_questions": 3})
    assert quiz_res.status_code == 401
