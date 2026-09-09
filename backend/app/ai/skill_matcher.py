"""
Phase 4: Skill Semantic Matcher
Matches extracted skill phrases against the master Skill catalogue
using sentence-transformer embeddings + cosine similarity.
Falls back to keyword-overlap when the model is unavailable.
"""
import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.user import Skill
from app.ai.embedding_service import (
    embed_texts, cosine_similarity_vectors, keyword_similarity, is_model_available
)
from app.core.config import settings

logger = logging.getLogger(__name__)

# Default similarity threshold – overridable via SIMILARITY_THRESHOLD in .env
DEFAULT_THRESHOLD = getattr(settings, "SIMILARITY_THRESHOLD", 0.40)


def _confidence_from_similarity(sim: float) -> int:
    """Convert a float similarity score [0,1] to an integer confidence percentage 0-100."""
    return max(0, min(100, int(round(sim * 100))))


def match_phrases_to_skills(
    phrases: List[str],
    db: Session,
    threshold: float = DEFAULT_THRESHOLD,
) -> List[Dict[str, Any]]:
    """
    Match a list of extracted skill phrases against the Skill master catalogue.

    Returns a list of match dicts:
    {
        extracted_skill: str,
        matched_skill_id: str | None,
        matched_skill_name: str | None,
        matched_skill_category: str | None,
        similarity_score: float,
        confidence: int,          # 0-100
        source: "EMBEDDING" | "KEYWORD",
        above_threshold: bool,
    }

    IMPORTANT: suggested_level is NEVER included – the employee must set their own level.
    """
    if not phrases:
        return []

    skills: List[Skill] = db.query(Skill).all()
    if not skills:
        return []

    skill_names = [s.name for s in skills]
    results = []

    use_embeddings = is_model_available()

    if use_embeddings:
        # ---------------------------------------------------------
        # Embedding path: encode all phrases + skill names at once
        # ---------------------------------------------------------
        try:
            all_texts = phrases + skill_names
            all_embeddings = embed_texts(all_texts)
            if all_embeddings is None:
                use_embeddings = False
            else:
                phrase_embs = all_embeddings[:len(phrases)]
                skill_embs = all_embeddings[len(phrases):]
        except Exception as e:
            logger.error(f"[Phase4-AI] Embedding failed: {e}")
            use_embeddings = False

    for i, phrase in enumerate(phrases):
        best_skill = None
        best_score = 0.0
        source = "EMBEDDING" if use_embeddings else "KEYWORD"

        for j, skill in enumerate(skills):
            if use_embeddings:
                score = cosine_similarity_vectors(phrase_embs[i], skill_embs[j])
            else:
                score = keyword_similarity(phrase, skill.name)

            if score > best_score:
                best_score = score
                best_skill = skill

        above = best_score >= threshold
        results.append({
            "extracted_skill": phrase,
            "matched_skill_id": best_skill.id if above and best_skill else None,
            "matched_skill_name": best_skill.name if above and best_skill else None,
            "matched_skill_category": best_skill.category.value if above and best_skill else None,
            "similarity_score": round(best_score, 4),
            "confidence": _confidence_from_similarity(best_score) if above else 0,
            "source": source,
            "above_threshold": above,
        })

    # Sort: matches above threshold first, then by confidence desc
    results.sort(key=lambda r: (not r["above_threshold"], -r["confidence"]))
    return results
