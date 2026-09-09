import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, TrainingCourse
from app.models.learning import (
    LearningMaterial, MaterialChunk, Quiz, QuizQuestion, QuizAttempt, QuizAnswer
)
from app.schemas.learning import (
    LearningMaterialOut, MaterialUploadResponse, QuizCreateInput, QuizOut, QuizQuestionOut,
    QuizSubmitInput, QuizAttemptResultOut, QuizAnswerResultOut, RecommendedCourseSummary
)
from app.rag.parser import extract_text_from_file
from app.rag.chunker import chunk_text
from app.rag.retrieval import retrieve_top_chunks
from app.ai.embedding_service import embed_texts
from app.ai.llm_service import get_llm_service

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# 1. Learning Materials Management
# ---------------------------------------------------------------------------

@router.post("/learning/materials/upload", response_model=MaterialUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_learning_material(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    course_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload learning material (PDF, PPTX, TXT), extract text, split into chunks,
    generate vector embeddings, and save to vector store.
    """
    filename = file.filename or "uploaded_file"
    file_bytes = await file.read()

    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    # Validate size (e.g. 15MB limit)
    MAX_SIZE = 15 * 1024 * 1024
    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 15MB."
        )

    # Extract text from PDF, PPTX, or TXT
    try:
        extracted_text = extract_text_from_file(file_bytes, filename)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Text extraction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract text from file: {str(e)}"
        )

    if not extracted_text or not extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File contains no extractable or valid text content."
        )

    # Check course_id if provided
    if course_id:
        course_exists = db.query(TrainingCourse).filter(TrainingCourse.id == course_id).first()
        if not course_exists:
            course_id = None

    # Derive title if not provided
    material_title = title.strip() if (title and title.strip()) else filename.rsplit(".", 1)[0]
    file_ext = filename.lower().split(".")[-1] if "." in filename else "txt"

    # Create LearningMaterial record
    material = LearningMaterial(
        title=material_title,
        file_name=filename,
        file_type=file_ext,
        file_size=len(file_bytes),
        content_text=extracted_text,
        uploader_id=current_user.id,
        course_id=course_id
    )
    db.add(material)
    db.flush()

    # Chunk text
    raw_chunks = chunk_text(extracted_text, chunk_size=600, overlap=100)
    if not raw_chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to generate text chunks from the material content."
        )

    # Embed chunks using Phase 4 embedding service
    embeddings = embed_texts(raw_chunks)

    chunks_created = 0
    for idx, chunk_str in enumerate(raw_chunks):
        emb = embeddings[idx] if (embeddings and idx < len(embeddings)) else None
        chunk_obj = MaterialChunk(
            material_id=material.id,
            chunk_index=idx,
            chunk_text=chunk_str,
            embedding=emb
        )
        db.add(chunk_obj)
        chunks_created += 1

    db.commit()
    db.refresh(material)

    mat_out = LearningMaterialOut(
        id=material.id,
        title=material.title,
        file_name=material.file_name,
        file_type=material.file_type,
        file_size=material.file_size,
        content_text=material.content_text[:300] + "...",
        uploader_id=material.uploader_id,
        course_id=material.course_id,
        chunk_count=chunks_created,
        created_at=material.created_at
    )

    return MaterialUploadResponse(
        message="Learning material uploaded, parsed, chunked, and embedded successfully.",
        material=mat_out,
        chunks_created=chunks_created
    )


@router.get("/learning/materials", response_model=List[LearningMaterialOut])
def list_learning_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all uploaded learning materials."""
    materials = db.query(LearningMaterial).order_by(LearningMaterial.created_at.desc()).all()
    result = []
    for mat in materials:
        chunk_count = db.query(MaterialChunk).filter(MaterialChunk.material_id == mat.id).count()
        result.append(LearningMaterialOut(
            id=mat.id,
            title=mat.title,
            file_name=mat.file_name,
            file_type=mat.file_type,
            file_size=mat.file_size,
            content_text=mat.content_text[:300] + "..." if mat.content_text else "",
            uploader_id=mat.uploader_id,
            course_id=mat.course_id,
            chunk_count=chunk_count,
            created_at=mat.created_at
        ))
    return result


# ---------------------------------------------------------------------------
# 2. AI Quiz Generation & Retrieval
# ---------------------------------------------------------------------------

@router.post("/learning/materials/{material_id}/quiz", response_model=QuizOut, status_code=status.HTTP_201_CREATED)
def create_quiz_from_material(
    material_id: str,
    payload: QuizCreateInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    RAG Pipeline:
    1. Verify material exists and has valid text chunks.
    2. Retrieve top-k relevant chunks.
    3. Generate MCQs using LLMService (with DEMO fallback if no API key configured).
    4. Validate structure and answers.
    5. Save Quiz and QuizQuestions to database.
    """
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning material with ID '{material_id}' not found."
        )

    if not material.content_text or not material.content_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate quiz: learning material contains empty text."
        )

    # Retrieve relevant chunks using RAG vector similarity
    top_chunks = retrieve_top_chunks(
        material_id=material.id,
        query=payload.topic,
        db=db,
        top_k=max(payload.num_questions * 2, 5)
    )

    if not top_chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate quiz: No valid material chunks found for RAG context retrieval."
        )

    llm_service = get_llm_service()
    try:
        raw_mcqs = llm_service.generate_quiz_mcqs(
            retrieved_chunks=top_chunks,
            num_questions=payload.num_questions,
            target_difficulty=payload.difficulty or "Medium",
            topic_hint=payload.topic
        )
    except Exception as e:
        logger.error(f"Quiz generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quiz: {str(e)}"
        )

    if not raw_mcqs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to generate valid quiz questions from the material context."
        )

    # Save Quiz
    quiz_title = f"Quiz: {material.title}"
    if payload.topic:
        quiz_title += f" ({payload.topic})"

    is_demo = llm_service.is_demo_mode

    quiz = Quiz(
        material_id=material.id,
        title=quiz_title,
        description=f"Generated via RAG AI based on '{material.title}'. Target difficulty: {payload.difficulty}.",
        num_questions=len(raw_mcqs),
        creator_id=current_user.id,
        is_demo=is_demo
    )
    db.add(quiz)
    db.flush()

    questions_out: List[QuizQuestionOut] = []
    for q_data in raw_mcqs:
        q_obj = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q_data["question"],
            options=q_data["options"],
            correct_answer=q_data["correct_answer"],
            explanation=q_data["explanation"],
            difficulty=q_data["difficulty"],
            source_chunk_id=q_data.get("source_chunk_id"),
            source_reference=q_data.get("source_reference")
        )
        db.add(q_obj)
        db.flush()

        questions_out.append(QuizQuestionOut(
            id=q_obj.id,
            question_text=q_obj.question_text,
            options=q_obj.options,
            difficulty=q_obj.difficulty,
            source_reference=q_obj.source_reference
        ))

    db.commit()
    db.refresh(quiz)

    return QuizOut(
        id=quiz.id,
        material_id=quiz.material_id,
        material_title=material.title,
        title=quiz.title,
        description=quiz.description,
        num_questions=quiz.num_questions,
        is_demo=quiz.is_demo,
        questions=questions_out,
        created_at=quiz.created_at
    )


@router.get("/quizzes/{quiz_id}", response_model=QuizOut)
def get_quiz_by_id(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve quiz details and question choices for employee attempt."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz with ID '{quiz_id}' not found."
        )

    material = db.query(LearningMaterial).filter(LearningMaterial.id == quiz.material_id).first()
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()

    q_out = [
        QuizQuestionOut(
            id=q.id,
            question_text=q.question_text,
            options=q.options,
            difficulty=q.difficulty,
            source_reference=q.source_reference
        ) for q in questions
    ]

    return QuizOut(
        id=quiz.id,
        material_id=quiz.material_id,
        material_title=material.title if material else "Learning Material",
        title=quiz.title,
        description=quiz.description,
        num_questions=quiz.num_questions,
        is_demo=quiz.is_demo,
        questions=q_out,
        created_at=quiz.created_at
    )


# ---------------------------------------------------------------------------
# 3. Quiz Submission, Scoring & Results
# ---------------------------------------------------------------------------

@router.post("/quizzes/{quiz_id}/submit", response_model=QuizAttemptResultOut)
def submit_quiz_attempt(
    quiz_id: str,
    payload: QuizSubmitInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit employee answers for a quiz, evaluate accuracy, store attempt,
    and return score breakdown with explanations & recommended courses.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz with ID '{quiz_id}' not found."
        )

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz has no questions to evaluate."
        )

    user_answers_map = {ans.question_id: ans.selected_option.strip() for ans in payload.answers}

    correct_count = 0
    max_score = len(questions)
    answer_results: List[QuizAnswerResultOut] = []

    # Temporary holding for quiz_answers DB models
    db_answers = []

    for q in questions:
        selected = user_answers_map.get(q.id, "").strip()
        is_correct = (selected.lower() == q.correct_answer.strip().lower())
        if is_correct:
            correct_count += 1

        answer_results.append(QuizAnswerResultOut(
            question_id=q.id,
            question_text=q.question_text,
            options=q.options,
            selected_option=selected if selected else "[No Answer]",
            correct_answer=q.correct_answer,
            is_correct=is_correct,
            explanation=q.explanation,
            difficulty=q.difficulty,
            source_reference=q.source_reference
        ))

        db_answers.append((q.id, selected, is_correct))

    percentage = round((correct_count / max_score) * 100.0, 1)
    passed = percentage >= 60.0

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        score=float(correct_count),
        max_score=max_score,
        percentage=percentage,
        passed=passed
    )
    db.add(attempt)
    db.flush()

    for q_id, sel_opt, is_corr in db_answers:
        ans_record = QuizAnswer(
            attempt_id=attempt.id,
            question_id=q_id,
            selected_option=sel_opt,
            is_correct=is_corr
        )
        db.add(ans_record)

    db.commit()
    db.refresh(attempt)

    # Fetch connected recommended courses
    rec_courses: List[RecommendedCourseSummary] = []
    material = db.query(LearningMaterial).filter(LearningMaterial.id == quiz.material_id).first()
    if material and material.course_id:
        course = db.query(TrainingCourse).filter(TrainingCourse.id == material.course_id).first()
        if course:
            rec_courses.append(RecommendedCourseSummary(
                id=course.id,
                title=course.title,
                provider=course.provider,
                difficulty=str(course.difficulty.value if hasattr(course.difficulty, 'value') else course.difficulty),
                duration_hours=course.duration_hours,
                url=course.url
            ))

    # Also include general active courses as recommendation recommendations
    if len(rec_courses) < 3:
        extra_courses = db.query(TrainingCourse).filter(TrainingCourse.active == True).limit(3 - len(rec_courses)).all()
        for c in extra_courses:
            if not any(rc.id == c.id for rc in rec_courses):
                rec_courses.append(RecommendedCourseSummary(
                    id=c.id,
                    title=c.title,
                    provider=c.provider,
                    difficulty=str(c.difficulty.value if hasattr(c.difficulty, 'value') else c.difficulty),
                    duration_hours=c.duration_hours,
                    url=c.url
                ))

    # Construct competency improvement summary placeholder
    comp_summary = (
        f"Score: {correct_count}/{max_score} ({percentage}%). "
        f"{'Passed: Competency benchmark satisfied.' if passed else 'Needs Improvement: Review flagged source chunk references and recommended courses below.'}"
    )

    return QuizAttemptResultOut(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        user_id=current_user.id,
        score=attempt.score,
        max_score=attempt.max_score,
        percentage=attempt.percentage,
        passed=attempt.passed,
        submitted_at=attempt.submitted_at,
        answers=answer_results,
        competency_improvement_summary=comp_summary,
        recommended_courses=rec_courses
    )


@router.get("/quizzes/{quiz_id}/result", response_model=QuizAttemptResultOut)
def get_latest_quiz_result(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve latest attempt result for a quiz by the current employee."""
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.user_id == current_user.id
    ).order_by(QuizAttempt.submitted_at.desc()).first()

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No quiz attempt found for quiz ID '{quiz_id}' and user '{current_user.id}'."
        )

    return _build_attempt_result_response(attempt, db)


@router.get("/quizzes/attempts/{attempt_id}/result", response_model=QuizAttemptResultOut)
def get_attempt_result_by_id(
    attempt_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve attempt result by attempt ID."""
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz attempt with ID '{attempt_id}' not found."
        )

    return _build_attempt_result_response(attempt, db)


def _build_attempt_result_response(attempt: QuizAttempt, db: Session) -> QuizAttemptResultOut:
    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    quiz_title = quiz.title if quiz else "Quiz Attempt"

    answers_records = db.query(QuizAnswer).filter(QuizAnswer.attempt_id == attempt.id).all()
    answer_results = []

    for ans in answers_records:
        q = db.query(QuizQuestion).filter(QuizQuestion.id == ans.question_id).first()
        if q:
            answer_results.append(QuizAnswerResultOut(
                question_id=q.id,
                question_text=q.question_text,
                options=q.options,
                selected_option=ans.selected_option,
                correct_answer=q.correct_answer,
                is_correct=ans.is_correct,
                explanation=q.explanation,
                difficulty=q.difficulty,
                source_reference=q.source_reference
            ))

    rec_courses: List[RecommendedCourseSummary] = []
    if quiz and quiz.material_id:
        material = db.query(LearningMaterial).filter(LearningMaterial.id == quiz.material_id).first()
        if material and material.course_id:
            course = db.query(TrainingCourse).filter(TrainingCourse.id == material.course_id).first()
            if course:
                rec_courses.append(RecommendedCourseSummary(
                    id=course.id,
                    title=course.title,
                    provider=course.provider,
                    difficulty=str(course.difficulty.value if hasattr(course.difficulty, 'value') else course.difficulty),
                    duration_hours=course.duration_hours,
                    url=course.url
                ))

    if len(rec_courses) < 3:
        extra_courses = db.query(TrainingCourse).filter(TrainingCourse.active == True).limit(3 - len(rec_courses)).all()
        for c in extra_courses:
            if not any(rc.id == c.id for rc in rec_courses):
                rec_courses.append(RecommendedCourseSummary(
                    id=c.id,
                    title=c.title,
                    provider=c.provider,
                    difficulty=str(c.difficulty.value if hasattr(c.difficulty, 'value') else c.difficulty),
                    duration_hours=c.duration_hours,
                    url=c.url
                ))

    comp_summary = (
        f"Score: {attempt.score}/{attempt.max_score} ({attempt.percentage}%). "
        f"{'Passed: Competency benchmark satisfied.' if attempt.passed else 'Needs Improvement: Review flagged source chunk references and recommended courses below.'}"
    )

    return QuizAttemptResultOut(
        attempt_id=attempt.id,
        quiz_id=attempt.quiz_id,
        quiz_title=quiz_title,
        user_id=attempt.user_id,
        score=attempt.score,
        max_score=attempt.max_score,
        percentage=attempt.percentage,
        passed=attempt.passed,
        submitted_at=attempt.submitted_at,
        answers=answer_results,
        competency_improvement_summary=comp_summary,
        recommended_courses=rec_courses
    )
