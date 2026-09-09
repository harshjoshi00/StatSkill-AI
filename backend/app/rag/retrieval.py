import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.learning import MaterialChunk
from app.ai.embedding_service import embed_texts, cosine_similarity_vectors, keyword_similarity

logger = logging.getLogger(__name__)


def retrieve_top_chunks(
    material_id: str,
    query: Optional[str],
    db: Session,
    top_k: int = 5
) -> List[MaterialChunk]:
    """
    RAG retrieval: Fetch top-k relevant chunks for a given material_id and query/topic.
    """
    chunks = db.query(MaterialChunk).filter(MaterialChunk.material_id == material_id).order_by(MaterialChunk.chunk_index.asc()).all()
    if not chunks:
        return []

    # If no specific query is provided or material is small, return up to top_k chunks in order
    if not query or not query.strip() or len(chunks) <= top_k:
        return chunks[:top_k]

    clean_query = query.strip()
    query_vectors = embed_texts([clean_query])
    query_vector = query_vectors[0] if (query_vectors and len(query_vectors) > 0) else None

    chunk_scores = []
    for chunk in chunks:
        score = 0.0
        # If vector embedding exists for query & chunk
        if query_vector is not None and chunk.embedding and isinstance(chunk.embedding, list) and len(chunk.embedding) > 0:
            score = cosine_similarity_vectors(query_vector, chunk.embedding)
        else:
            # Fallback to keyword Jaccard overlap similarity
            score = keyword_similarity(clean_query, chunk.chunk_text)

        chunk_scores.append((score, chunk))

    # Sort descending by similarity score
    chunk_scores.sort(key=lambda x: x[0], reverse=True)
    
    # Return top_k chunks
    top_chunks = [item[1] for item in chunk_scores[:top_k]]
    return top_chunks
