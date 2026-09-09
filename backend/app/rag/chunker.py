import re
from typing import List


def clean_text(text: str) -> str:
    """Normalize whitespace and newline characters."""
    if not text:
        return ""
    # Normalize multiple newlines and carriage returns
    text = re.sub(r"\r\n|\r", "\n", text)
    # Normalize excessive spacing
    text = re.sub(r"[ \t]+", " ", text)
    # Remove excessive empty lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
    """
    Split text into overlapping text chunks for RAG processing.
    Ensures paragraph/sentence integrity where possible.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return []

    # If short enough, return as single chunk
    if len(cleaned) <= chunk_size:
        return [cleaned]

    paragraphs = cleaned.split("\n\n")
    chunks: List[str] = []
    current_chunk = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current_chunk) + len(para) + 2 <= chunk_size:
            current_chunk = f"{current_chunk}\n\n{para}".strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
            
            # Handle extra long single paragraph
            if len(para) > chunk_size:
                # Split by sentence
                sentences = re.split(r"(?<=[.!?])\s+", para)
                sub_chunk = ""
                for sent in sentences:
                    if len(sub_chunk) + len(sent) + 1 <= chunk_size:
                        sub_chunk = f"{sub_chunk} {sent}".strip()
                    else:
                        if sub_chunk:
                            chunks.append(sub_chunk)
                        sub_chunk = sent
                if sub_chunk:
                    current_chunk = sub_chunk
                else:
                    current_chunk = ""
            else:
                current_chunk = para

    if current_chunk:
        chunks.append(current_chunk)

    # Post-process: ensure overlap if chunks are rigid
    if len(chunks) > 1 and overlap > 0:
        overlapped_chunks: List[str] = []
        for i, chunk in enumerate(chunks):
            if i > 0 and len(chunks[i - 1]) > overlap:
                overlap_prefix = chunks[i - 1][-overlap:].strip()
                combined = f"{overlap_prefix} ... {chunk}"
            else:
                combined = chunk
            overlapped_chunks.append(combined)
        return overlapped_chunks

    return chunks
