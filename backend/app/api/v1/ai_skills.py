"""
Phase 4: AI Skill Extraction & Semantic Matching API
Endpoints:
  POST   /api/v1/ai/skills/extract
  POST   /api/v1/ai/skills/match
  GET    /api/v1/ai/skills/suggestions
  POST   /api/v1/ai/skills/suggestions/{id}/accept
  POST   /api/v1/ai/skills/suggestions/{id}/reject
"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import (
    User, Profile, Skill, EmployeeSkill, AiSkillSuggestion,
    SkillSource, AiSuggestionStatus
)
from app.schemas.ai_skills import (
    SkillExtractRequest, SkillMatchRequest,
    ExtractResponse, MatchResponse, SkillMatchItem,
    AiSkillSuggestionOut, SuggestionsListResponse,
    AcceptSuggestionRequest, AcceptSuggestionResponse,
)
from app.ai.skill_extractor import extract_skill_phrases
from app.ai.skill_matcher import match_phrases_to_skills
from app.ai.embedding_service import is_model_available
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_model_label() -> str:
    return settings.EMBEDDING_MODEL if is_model_available() else "keyword-fallback"


def _save_suggestions(matches, user_id: str, db: Session) -> int:
    """Persist matched phrases as PENDING AiSkillSuggestion rows (skip below-threshold)."""
    count = 0
    for m in matches:
        if not m["above_threshold"] or not m["matched_skill_id"]:
            continue
        # Avoid duplicate pending suggestions for same (user, extracted_skill, matched_skill)
        existing = db.query(AiSkillSuggestion).filter(
            AiSkillSuggestion.user_id == user_id,
            AiSkillSuggestion.extracted_skill == m["extracted_skill"],
            AiSkillSuggestion.matched_skill_id == m["matched_skill_id"],
            AiSkillSuggestion.status == AiSuggestionStatus.PENDING,
        ).first()
        if existing:
            continue
        db.add(AiSkillSuggestion(
            user_id=user_id,
            extracted_skill=m["extracted_skill"],
            matched_skill_id=m["matched_skill_id"],
            confidence=m["confidence"],
            similarity_score=str(round(m["similarity_score"], 4)),
            status=AiSuggestionStatus.PENDING,
            suggested_level=None,   # NEVER auto-assign level
        ))
        count += 1
    db.commit()
    return count


# ---------------------------------------------------------------------------
# POST /extract  – full pipeline: text → phrases → matches → (optional) save
# ---------------------------------------------------------------------------
@router.post("/skills/extract", response_model=ExtractResponse, status_code=status.HTTP_200_OK)
def extract_skills(
    body: SkillExtractRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Extract skill phrases from free-form text and semantically match them
    against the master Skill catalogue. Saves PENDING suggestions for
    employee review (accept/reject). Skill level is NEVER auto-set.
    """
    logger.info(f"[Phase4-AI] extract request user={current_user.id} text_len={len(body.text)}")
    phrases = extract_skill_phrases(body.text)
    if not phrases:
        return ExtractResponse(
            input_text_length=len(body.text),
            phrases_extracted=0,
            matches_above_threshold=0,
            model_used=_get_model_label(),
            suggestions_saved=0,
            matches=[],
        )

    threshold = body.threshold if body.threshold is not None else getattr(settings, "SIMILARITY_THRESHOLD", 0.40)
    raw = match_phrases_to_skills(phrases, db, threshold=threshold)

    matches = [SkillMatchItem(**m) for m in raw]
    above = sum(1 for m in raw if m["above_threshold"])

    saved = 0
    if body.save_suggestions:
        saved = _save_suggestions(raw, current_user.id, db)

    return ExtractResponse(
        input_text_length=len(body.text),
        phrases_extracted=len(phrases),
        matches_above_threshold=above,
        model_used=_get_model_label(),
        suggestions_saved=saved,
        matches=matches,
    )


# ---------------------------------------------------------------------------
# POST /match  – match explicit phrase list (no save)
# ---------------------------------------------------------------------------
@router.post("/skills/match", response_model=MatchResponse, status_code=status.HTTP_200_OK)
def match_skills(
    body: SkillMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Directly match a list of skill phrases against the master catalogue.
    Does not persist suggestions.
    """
    threshold = body.threshold if body.threshold is not None else getattr(settings, "SIMILARITY_THRESHOLD", 0.40)
    raw = match_phrases_to_skills(body.phrases, db, threshold=threshold)
    return MatchResponse(model_used=_get_model_label(), matches=[SkillMatchItem(**m) for m in raw])


# ---------------------------------------------------------------------------
# GET /suggestions  – list current user's AI suggestions
# ---------------------------------------------------------------------------
@router.get("/skills/suggestions", response_model=SuggestionsListResponse, status_code=status.HTTP_200_OK)
def list_suggestions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve all AI skill suggestions for the authenticated employee,
    including their matched skill names and current status.
    """
    suggs = db.query(AiSkillSuggestion).filter(
        AiSkillSuggestion.user_id == current_user.id
    ).order_by(AiSkillSuggestion.created_at.desc()).all()

    out = []
    for s in suggs:
        skill_name = s.matched_skill.name if s.matched_skill else None
        out.append(AiSkillSuggestionOut(
            id=s.id,
            user_id=s.user_id,
            extracted_skill=s.extracted_skill,
            matched_skill_id=s.matched_skill_id,
            matched_skill_name=skill_name,
            confidence=s.confidence,
            similarity_score=s.similarity_score,
            status=s.status,
            suggested_level=None,
        ))

    pending = sum(1 for s in suggs if s.status == AiSuggestionStatus.PENDING)
    accepted = sum(1 for s in suggs if s.status == AiSuggestionStatus.ACCEPTED)
    rejected = sum(1 for s in suggs if s.status == AiSuggestionStatus.REJECTED)

    return SuggestionsListResponse(
        total=len(suggs),
        pending=pending,
        accepted=accepted,
        rejected=rejected,
        suggestions=out,
    )


# ---------------------------------------------------------------------------
# POST /suggestions/{id}/accept  – employee accepts + sets their own level
# ---------------------------------------------------------------------------
@router.post("/skills/suggestions/{suggestion_id}/accept", response_model=AcceptSuggestionResponse)
def accept_suggestion(
    suggestion_id: str,
    body: AcceptSuggestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Employee accepts an AI suggestion and provides their chosen skill level.
    Updates (or creates) the corresponding EmployeeSkill with source=AI_EXTRACTION.
    Skill level is ONLY set by the employee; it is never automatically assigned.
    """
    sugg = db.query(AiSkillSuggestion).filter(
        AiSkillSuggestion.id == suggestion_id,
        AiSkillSuggestion.user_id == current_user.id,
    ).first()
    if not sugg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suggestion not found")
    if sugg.status != AiSuggestionStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Suggestion already {sugg.status.value}")
    if not sugg.matched_skill_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="No matched skill – cannot accept unmatched suggestion")

    # Update suggestion status
    sugg.status = AiSuggestionStatus.ACCEPTED
    sugg.suggested_level = None  # enforce: level always set by employee, never AI

    # Upsert EmployeeSkill
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")

    emp_skill = db.query(EmployeeSkill).filter(
        EmployeeSkill.profile_id == profile.id,
        EmployeeSkill.skill_id == sugg.matched_skill_id,
    ).first()

    if emp_skill:
        emp_skill.current_level = body.current_level
        emp_skill.source = SkillSource.AI_EXTRACTION
    else:
        emp_skill = EmployeeSkill(
            profile_id=profile.id,
            skill_id=sugg.matched_skill_id,
            current_level=body.current_level,
            source=SkillSource.AI_EXTRACTION,
        )
        db.add(emp_skill)

    db.commit()
    db.refresh(sugg)

    skill = db.query(Skill).filter(Skill.id == sugg.matched_skill_id).first()
    return AcceptSuggestionResponse(
        suggestion_id=sugg.id,
        skill_id=sugg.matched_skill_id,
        skill_name=skill.name if skill else "Unknown",
        current_level=body.current_level,
        source=SkillSource.AI_EXTRACTION.value,
        message=f"Skill '{skill.name if skill else 'Unknown'}' accepted at level {body.current_level} and saved to your profile.",
    )


# ---------------------------------------------------------------------------
# POST /suggestions/{id}/reject
# ---------------------------------------------------------------------------
@router.post("/skills/suggestions/{suggestion_id}/reject", status_code=status.HTTP_200_OK)
def reject_suggestion(
    suggestion_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Employee rejects an AI skill suggestion. No profile changes are made.
    """
    sugg = db.query(AiSkillSuggestion).filter(
        AiSkillSuggestion.id == suggestion_id,
        AiSkillSuggestion.user_id == current_user.id,
    ).first()
    if not sugg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suggestion not found")
    if sugg.status != AiSuggestionStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Suggestion already {sugg.status.value}")

    sugg.status = AiSuggestionStatus.REJECTED
    db.commit()
    return {"suggestion_id": suggestion_id, "status": "REJECTED", "message": "Suggestion rejected."}
