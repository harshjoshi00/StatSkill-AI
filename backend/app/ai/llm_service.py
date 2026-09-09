import json
import logging
import re
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.models.learning import MaterialChunk

logger = logging.getLogger(__name__)


class MCQValidationError(Exception):
    """Exception raised when a generated MCQ fails structure or answer validation."""
    pass


class LLMService:
    """
    Provider-independent LLM Service for RAG-based AI Quiz Generation.
    Uses configured LLM_PROVIDER / LLM_API_KEY from .env.
    Falls back to deterministic DEMO mode if API key is missing or call fails.
    """

    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower() if settings.LLM_PROVIDER else "openai"
        self.api_key = settings.LLM_API_KEY.strip() if settings.LLM_API_KEY else ""
        self.model_name = settings.LLM_MODEL or "gpt-4o-mini"
        self.is_demo_mode = not bool(self.api_key)

        if self.is_demo_mode:
            logger.info("[LLMService] No LLM API key configured. Operating in DEMO mode.")
        else:
            logger.info(f"[LLMService] Configured with provider '{self.provider}' and model '{self.model_name}'.")

    def generate_quiz_mcqs(
        self,
        retrieved_chunks: List[MaterialChunk],
        num_questions: int = 5,
        target_difficulty: str = "Medium",
        topic_hint: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Generate MCQs based STRICTLY on retrieved RAG material chunks.
        Validates structure before returning.
        """
        if not retrieved_chunks:
            raise ValueError("Cannot generate quiz: No relevant material chunks provided.")

        context_text = "\n\n---\n\n".join([
            f"[Chunk {chunk.chunk_index}]: {chunk.chunk_text}" for chunk in retrieved_chunks
        ])

        mcqs: List[Dict[str, Any]] = []

        if not self.is_demo_mode:
            try:
                mcqs = self._generate_with_provider(context_text, num_questions, target_difficulty, topic_hint)
            except Exception as e:
                logger.warning(f"[LLMService] Provider call failed ({e}). Falling back to DEMO mode.")
                mcqs = self._generate_demo_mcqs(retrieved_chunks, num_questions, target_difficulty)
        else:
            mcqs = self._generate_demo_mcqs(retrieved_chunks, num_questions, target_difficulty)

        # Validate each question
        validated_mcqs = []
        for raw_q in mcqs:
            try:
                valid_q = self.validate_and_normalize_mcq(raw_q, retrieved_chunks)
                validated_mcqs.append(valid_q)
            except MCQValidationError as ve:
                logger.warning(f"[LLMService] MCQ validation failed for item: {ve}")

        if not validated_mcqs:
            # Fall back to deterministic generator if external API returned malformed JSON
            logger.warning("[LLMService] No valid questions produced by provider. Generating fallback DEMO MCQs.")
            demo_raw = self._generate_demo_mcqs(retrieved_chunks, num_questions, target_difficulty)
            validated_mcqs = [self.validate_and_normalize_mcq(q, retrieved_chunks) for q in demo_raw]

        return validated_mcqs[:num_questions]

    def validate_and_normalize_mcq(
        self,
        mcq: Dict[str, Any],
        chunks: List[MaterialChunk]
    ) -> Dict[str, Any]:
        """
        Validates structure of an MCQ:
        - question (non-empty)
        - 4 options (distinct strings)
        - correct answer (must match one option)
        - explanation (non-empty)
        - difficulty (Easy/Medium/Hard)
        - source_chunk / reference
        """
        question = str(mcq.get("question", "")).strip()
        if not question:
            raise MCQValidationError("Question text is empty.")

        raw_options = mcq.get("options", [])
        if not isinstance(raw_options, list) or len(raw_options) != 4:
            raise MCQValidationError(f"Options must be a list of exactly 4 strings, got: {raw_options}")

        options = [str(opt).strip() for opt in raw_options]
        if any(not opt for opt in options):
            raise MCQValidationError("One or more options are empty strings.")

        correct_answer = str(mcq.get("correct_answer", "")).strip()
        # If correct_answer is an index like "0", "1", "2", "3" or "A", "B", "C", "D"
        if correct_answer in ["0", "1", "2", "3"]:
            correct_answer = options[int(correct_answer)]
        elif correct_answer.upper() in ["A", "B", "C", "D"]:
            idx = {"A": 0, "B": 1, "C": 2, "D": 3}[correct_answer.upper()]
            correct_answer = options[idx]

        if correct_answer not in options:
            raise MCQValidationError(f"Correct answer '{correct_answer}' is not among the 4 options: {options}")

        explanation = str(mcq.get("explanation", "")).strip()
        if not explanation:
            explanation = f"Correct answer is '{correct_answer}' based on the provided learning material."

        difficulty = str(mcq.get("difficulty", "Medium")).strip().capitalize()
        if difficulty not in ["Easy", "Medium", "Hard"]:
            difficulty = "Medium"

        source_chunk_id = mcq.get("source_chunk_id")
        source_reference = str(mcq.get("source_reference", "")).strip()

        # If source_chunk_id not provided, pick first chunk as reference
        if not source_chunk_id and chunks:
            source_chunk_id = chunks[0].id
            if not source_reference:
                source_reference = f"Chunk {chunks[0].chunk_index}"

        return {
            "question": question,
            "options": options,
            "correct_answer": correct_answer,
            "explanation": explanation,
            "difficulty": difficulty,
            "source_chunk_id": source_chunk_id,
            "source_reference": source_reference,
        }

    def _generate_with_provider(
        self,
        context_text: str,
        num_questions: int,
        target_difficulty: str,
        topic_hint: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Call external LLM API (e.g. OpenAI endpoint) via httpx."""
        import httpx  # type: ignore

        system_prompt = (
            "You are an expert instructional designer creating high-quality multiple choice quizzes for training. "
            "STRICT RAG RULE: You MUST generate questions derived ONLY from the provided context. "
            "Do NOT invent external facts or outside knowledge. "
            "Format output strictly as a JSON array of objects with keys: "
            "['question', 'options', 'correct_answer', 'explanation', 'difficulty', 'source_reference']. "
            "'options' must be a list of 4 strings. 'correct_answer' must exactly match one of the 4 strings."
        )

        user_prompt = (
            f"Target difficulty: {target_difficulty}\n"
            f"Number of questions requested: {num_questions}\n"
            f"Topic hint: {topic_hint or 'General'}\n\n"
            f"LEARNING MATERIAL CONTEXT:\n{context_text}\n\n"
            "Return valid JSON array only:"
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"}
        }

        url = "https://api.openai.com/v1/chat/completions"
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]

            # Parse JSON
            parsed = json.loads(content)
            if isinstance(parsed, dict) and "questions" in parsed:
                return parsed["questions"]
            elif isinstance(parsed, list):
                return parsed
            else:
                raise ValueError("Unexpected JSON response structure from LLM provider.")

    def _generate_demo_mcqs(
        self,
        chunks: List[MaterialChunk],
        num_questions: int,
        target_difficulty: str
    ) -> List[Dict[str, Any]]:
        """
        Deterministic, context-anchored DEMO mode MCQ generator.
        Extracts key sentences and facts from the material chunks to create valid 4-option questions.
        """
        generated = []
        difficulties = ["Easy", "Medium", "Hard"]

        for i in range(num_questions):
            chunk = chunks[i % len(chunks)]
            text = chunk.chunk_text.strip()

            # Find sentences in chunk text
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 20]
            if not sentences:
                sentences = [text[:100]]

            sentence = sentences[0]
            diff = target_difficulty if target_difficulty in difficulties else difficulties[i % 3]

            # Generate question anchored in chunk sentence
            words = sentence.split()
            kw = words[0] if words else "statistical methodology"

            question = f"[DEMO] According to Section {chunk.chunk_index + 1}, which statement regarding '{kw}' is correct?"

            correct = f"{sentence[:120]}."
            option_b = f"It requires manual override without following standard protocols."
            option_c = f"It applies only to non-statistical administrative surveys."
            option_d = f"It was completely deprecated in the latest policy revision."

            options = [correct, option_b, option_c, option_d]
            # Shuffle slightly based on index
            shift = i % 4
            options = options[shift:] + options[:shift]

            explanation = (
                f"[DEMO Mode] Based directly on Chunk {chunk.chunk_index + 1}: '{sentence[:100]}...'"
            )

            generated.append({
                "question": question,
                "options": options,
                "correct_answer": correct,
                "explanation": explanation,
                "difficulty": diff,
                "source_chunk_id": chunk.id,
                "source_reference": f"Chunk #{chunk.chunk_index + 1} (Page/Section text)",
            })

        return generated


# Singleton instance helper
_llm_service_instance: Optional[LLMService] = None

def get_llm_service() -> LLMService:
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = LLMService()
    return _llm_service_instance
