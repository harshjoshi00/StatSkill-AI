from sqlalchemy import (
    Column, String, Integer, Float, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class CompetencyHistory(Base):
    """
    Tracks continuous competency progression evidence:
    records previous level, new level, assessment score, evidence source,
    adaptive difficulty recommendation, and explainable justification.
    """
    __tablename__ = "competency_history"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    old_level = Column(Integer, nullable=False, default=0)
    new_level = Column(Integer, nullable=False, default=0)
    score = Column(Float, nullable=False, default=0.0)
    evidence_source = Column(String(50), nullable=False, default="QUIZ_ASSESSMENT")
    evidence_id = Column(String(36), nullable=True, index=True)
    assessment_difficulty = Column(String(50), nullable=True)
    adaptive_next_difficulty = Column(String(50), nullable=True)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User")
    skill = relationship("Skill")
