from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class MaterialChunkOut(BaseModel):
    id: str
    chunk_index: int
    chunk_text: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LearningMaterialOut(BaseModel):
    id: str
    title: str
    file_name: str
    file_type: str
    file_size: int
    content_text: str
    uploader_id: str
    course_id: Optional[str] = None
    chunk_count: int = 0
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MaterialUploadResponse(BaseModel):
    message: str
    material: LearningMaterialOut
    chunks_created: int


class QuizCreateInput(BaseModel):
    num_questions: int = Field(default=5, ge=1, le=20)
    difficulty: Optional[str] = Field(default="Medium", description="Easy, Medium, Hard")
    topic: Optional[str] = Field(default=None, description="Optional topic focus for RAG retrieval")


class QuizQuestionOut(BaseModel):
    id: str
    question_text: str
    options: List[str]
    difficulty: str
    source_reference: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class QuizOut(BaseModel):
    id: str
    material_id: str
    material_title: str
    title: str
    description: Optional[str] = None
    num_questions: int
    is_demo: bool
    questions: List[QuizQuestionOut]
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class QuizSubmitAnswerItem(BaseModel):
    question_id: str
    selected_option: str


class QuizSubmitInput(BaseModel):
    answers: List[QuizSubmitAnswerItem]


class QuizAnswerResultOut(BaseModel):
    question_id: str
    question_text: str
    options: List[str]
    selected_option: str
    correct_answer: str
    is_correct: bool
    explanation: str
    difficulty: str
    source_reference: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RecommendedCourseSummary(BaseModel):
    id: str
    title: str
    provider: str
    difficulty: str
    duration_hours: int
    url: Optional[str] = None


class QuizAttemptResultOut(BaseModel):
    attempt_id: str
    quiz_id: str
    quiz_title: str
    user_id: str
    score: float
    max_score: int
    percentage: float
    passed: bool
    submitted_at: Optional[datetime] = None
    answers: List[QuizAnswerResultOut]
    competency_improvement_summary: str
    recommended_courses: List[RecommendedCourseSummary] = []

    model_config = ConfigDict(from_attributes=True)
