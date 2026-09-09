from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from app.models.user import AiSuggestionStatus

class SkillExtractRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=5000,
                      description="Free-form text (resume, summary, bio) to extract skills from")
    threshold: Optional[float] = Field(None, ge=0.1, le=1.0,
                                       description="Cosine similarity threshold (default from server config)")
    save_suggestions: bool = Field(True, description="Persist extracted matches as PENDING suggestions")

class SkillMatchRequest(BaseModel):
    phrases: List[str] = Field(..., min_length=1, max_length=20,
                               description="List of skill phrases to match against master catalogue")
    threshold: Optional[float] = Field(None, ge=0.1, le=1.0)

class SkillMatchItem(BaseModel):
    extracted_skill: str
    matched_skill_id: Optional[str] = None
    matched_skill_name: Optional[str] = None
    matched_skill_category: Optional[str] = None
    similarity_score: float
    confidence: int        # 0-100
    source: str            # EMBEDDING or KEYWORD
    above_threshold: bool

class ExtractResponse(BaseModel):
    input_text_length: int
    phrases_extracted: int
    matches_above_threshold: int
    model_used: str
    suggestions_saved: int
    matches: List[SkillMatchItem]

class MatchResponse(BaseModel):
    model_used: str
    matches: List[SkillMatchItem]

class AiSkillSuggestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    extracted_skill: str
    matched_skill_id: Optional[str] = None
    matched_skill_name: Optional[str] = None
    confidence: int
    similarity_score: Optional[str] = None
    status: AiSuggestionStatus
    suggested_level: None = None   # always None; level is never auto-set

class SuggestionsListResponse(BaseModel):
    total: int
    pending: int
    accepted: int
    rejected: int
    suggestions: List[AiSkillSuggestionOut]

class AcceptSuggestionRequest(BaseModel):
    current_level: int = Field(..., ge=0, le=5,
                               description="Employee-chosen skill level (0–5). Required for acceptance.")

class AcceptSuggestionResponse(BaseModel):
    suggestion_id: str
    skill_id: str
    skill_name: str
    current_level: int
    source: str
    message: str
