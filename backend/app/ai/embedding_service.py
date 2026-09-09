"""
Phase 4: AI Embedding Service
Wraps sentence-transformers for generating text embeddings with lazy loading
and a deterministic keyword-fallback when the model is unavailable/slow to download.
"""
import logging
import re
from typing import List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

_model = None          # cached SentenceTransformer instance
_model_loaded = False
_model_failed = False  # set True if import/download fails


def _load_model():
    """Lazy-load SentenceTransformer on first use; fall back gracefully."""
    global _model, _model_loaded, _model_failed
    if _model_loaded or _model_failed:
        return
    try:
        from sentence_transformers import SentenceTransformer  # type: ignore
        model_name = settings.EMBEDDING_MODEL  # configurable via .env
        logger.info(f"[Phase4-AI] Loading embedding model: {model_name}")
        _model = SentenceTransformer(model_name)
        _model_loaded = True
        logger.info(f"[Phase4-AI] Embedding model loaded successfully: {model_name}")
    except ImportError:
        logger.warning("[Phase4-AI] sentence-transformers not installed. Using keyword fallback.")
        _model_failed = True
    except Exception as e:
        logger.warning(f"[Phase4-AI] Could not load model '{settings.EMBEDDING_MODEL}': {e}. Using keyword fallback.")
        _model_failed = True


def embed_texts(texts: List[str]) -> Optional[List[List[float]]]:
    """
    Generate embeddings for a list of texts.
    Returns list of float vectors, or None if model unavailable (fallback to keyword).
    """
    _load_model()
    if _model is None:
        return None
    try:
        import numpy as np  # type: ignore
        embeddings = _model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return embeddings.tolist()
    except Exception as e:
        logger.error(f"[Phase4-AI] Embedding encode error: {e}")
        return None


def cosine_similarity_vectors(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute cosine similarity between two pre-normalised vectors."""
    try:
        import numpy as np  # type: ignore
        a = np.array(vec_a, dtype=float)
        b = np.array(vec_b, dtype=float)
        norm_a = float(np.linalg.norm(a))
        norm_b = float(np.linalg.norm(b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))
    except Exception:
        return 0.0


# ---------------------------------------------------------------------------
# Keyword fallback: simple token-overlap similarity (Jaccard-style)
# Used when sentence-transformers cannot be loaded.
# ---------------------------------------------------------------------------

def _tokenize(text: str) -> set:
    tokens = re.findall(r"[a-zA-Z0-9]+", text.lower())
    return set(tokens)


def keyword_similarity(phrase: str, skill_name: str) -> float:
    """
    Lightweight keyword overlap similarity used as fallback.
    Returns a float in [0, 1].
    """
    p_clean = phrase.lower().strip()
    s_clean = skill_name.lower().strip()
    if not p_clean or not s_clean:
        return 0.0
    a = _tokenize(phrase)
    b = _tokenize(skill_name)
    if not a or not b:
        return 0.0
    # Full match
    if p_clean == s_clean:
        return 1.0
    # Substring containment bonus
    if p_clean in s_clean or s_clean in p_clean:
        return 0.85
    # Jaccard
    intersection = a & b
    union = a | b
    return len(intersection) / len(union)


def is_model_available() -> bool:
    """Return True if the SentenceTransformer model was successfully loaded."""
    _load_model()
    return _model_loaded and _model is not None
