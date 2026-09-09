"""
Phase 4: Skill Phrase Extractor
Converts free-form text (resume, summary) into candidate skill phrases
using rule-based tokenization + stop-word filtering.
No LLM, no RAG – purely deterministic.
"""
import re
from typing import List

# Extended stop-words for statistical/government domain context
_STOP_WORDS = {
    "i", "me", "my", "we", "our", "you", "he", "she", "they", "it", "am",
    "is", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "will", "would", "shall", "should",
    "may", "might", "must", "can", "could", "a", "an", "the", "and",
    "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
    "from", "as", "into", "about", "than", "that", "this", "these",
    "those", "all", "both", "each", "more", "most", "other", "some",
    "such", "no", "not", "only", "own", "same", "so", "than", "too",
    "very", "just", "worked", "working", "work", "use", "used", "using",
    "also", "including", "well", "experience", "years", "year",
    "knowledge", "ability", "skills", "field", "area", "various",
    "strong", "good", "excellent", "proficient", "familiar", "demonstrated",
    "developed", "degree", "university", "college", "government",
    "management", "team", "role", "project", "department", "office",
}

# Known multi-word skill phrases to prefer over individual words
_KNOWN_PHRASES = [
    "machine learning", "artificial intelligence", "deep learning",
    "natural language processing", "data science", "data analysis",
    "data visualization", "data quality", "survey design",
    "statistical analysis", "time series", "hypothesis testing",
    "national accounts", "price statistics", "labour statistics",
    "sdg indicators", "cloud computing", "government cloud",
    "digital governance", "data privacy", "project management",
    "decision making", "r programming", "python programming",
]


def _clean(text: str) -> str:
    """Lowercase, remove punctuation except hyphens (keep compound words)."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s\-/]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _is_valid_token(token: str) -> bool:
    if token in _STOP_WORDS:
        return False
    if len(token) <= 1:
        return False
    if re.match(r"^\d+$", token):  # pure numbers
        return False
    return True


def extract_skill_phrases(text: str, max_phrases: int = 30) -> List[str]:
    """
    Extract candidate skill phrases from free-form text.
    Returns a deduplicated list of strings.
    Steps:
    1. Search for known multi-word phrases in the text.
    2. Tokenise remaining words, filter stop-words.
    3. Combine and deduplicate.
    """
    cleaned = _clean(text)
    found: List[str] = []
    consumed_positions: set = set()

    # Step 1: greedy multi-word phrase matching
    for phrase in _KNOWN_PHRASES:
        idx = cleaned.find(phrase)
        if idx != -1:
            span = set(range(idx, idx + len(phrase)))
            if not span & consumed_positions:
                found.append(phrase.title())
                consumed_positions.update(span)

    # Step 2: individual meaningful tokens
    tokens = cleaned.split()
    for token in tokens:
        clean_token = token.strip("-/")
        if _is_valid_token(clean_token) and clean_token not in [f.lower() for f in found]:
            found.append(clean_token.capitalize())

    # Step 3: deduplicate (case-insensitive), preserve insertion order
    seen: set = set()
    unique: List[str] = []
    for phrase in found:
        key = phrase.lower()
        if key not in seen:
            seen.add(key)
            unique.append(phrase)

    return unique[:max_phrases]
