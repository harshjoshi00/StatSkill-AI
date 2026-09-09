import json
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import TypeDecorator, TEXT
import uuid
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class JSONVector(TypeDecorator):
    """
    Custom SQLAlchemy type that stores float vector embeddings as JSON string
    in SQLite or text-compatible databases, while allowing easy list serialization.
    """
    impl = TEXT
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, list):
            return json.dumps(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return []
        return value


class LearningMaterial(Base):
    __tablename__ = "learning_materials"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    title = Column(String(255), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False, index=True)  # pdf, pptx, txt
    file_size = Column(Integer, nullable=False, default=0)
    file_path = Column(String(500), nullable=True)
    content_text = Column(Text, nullable=False)
    uploader_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(36), ForeignKey("training_courses.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    uploader = relationship("User")
    course = relationship("TrainingCourse")
    chunks = relationship("MaterialChunk", back_populates="material", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="material", cascade="all, delete-orphan")


class MaterialChunk(Base):
    __tablename__ = "material_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    material_id = Column(String(36), ForeignKey("learning_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(JSONVector, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    material = relationship("LearningMaterial", back_populates="chunks")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    material_id = Column(String(36), ForeignKey("learning_materials.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    num_questions = Column(Integer, nullable=False, default=5)
    creator_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_demo = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    material = relationship("LearningMaterial", back_populates="quizzes")
    creator = relationship("User")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    options = Column(JSONVector, nullable=False)  # List of 4 option strings
    correct_answer = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    difficulty = Column(String(50), nullable=False, default="Medium")  # Easy, Medium, Hard
    source_chunk_id = Column(String(36), ForeignKey("material_chunks.id", ondelete="SET NULL"), nullable=True)
    source_reference = Column(Text, nullable=True)

    quiz = relationship("Quiz", back_populates="questions")
    source_chunk = relationship("MaterialChunk")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, nullable=False, default=0.0)
    max_score = Column(Integer, nullable=False, default=0)
    percentage = Column(Float, nullable=False, default=0.0)
    passed = Column(Boolean, nullable=False, default=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User")
    answers = relationship("QuizAnswer", back_populates="attempt", cascade="all, delete-orphan")


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    attempt_id = Column(String(36), ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    selected_option = Column(String(255), nullable=False)
    is_correct = Column(Boolean, nullable=False, default=False)

    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("QuizQuestion")
