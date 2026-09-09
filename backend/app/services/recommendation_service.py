import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.user import (
    User, Profile, Skill, EmployeeSkill, TrainingHistory, RoleSkillRequirement,
    TrainingCourse, CourseDifficulty, TrainingStatus, SkillImportance
)
from app.schemas.recommendation import (
    TrainingCourseOut, RecommendationItemOut, RecommendationListResponse, CourseActionResponse
)
from app.services.competency_service import get_employee_competency_overview
from app.ai.embedding_service import embed_texts, cosine_similarity_vectors, keyword_similarity

logger = logging.getLogger(__name__)

# Difficulty fit lookup table: (user_level, course_difficulty) -> fit_score [0.0, 1.0]
DIFFICULTY_FIT_MAP = {
    (0, "BEGINNER"): 1.0, (0, "INTERMEDIATE"): 0.5, (0, "ADVANCED"): 0.2, (0, "EXPERT"): 0.1,
    (1, "BEGINNER"): 1.0, (1, "INTERMEDIATE"): 0.6, (1, "ADVANCED"): 0.3, (1, "EXPERT"): 0.1,
    (2, "BEGINNER"): 0.8, (2, "INTERMEDIATE"): 1.0, (2, "ADVANCED"): 0.6, (2, "EXPERT"): 0.2,
    (3, "BEGINNER"): 0.4, (3, "INTERMEDIATE"): 1.0, (3, "ADVANCED"): 0.9, (3, "EXPERT"): 0.4,
    (4, "BEGINNER"): 0.2, (4, "INTERMEDIATE"): 0.6, (4, "ADVANCED"): 1.0, (4, "EXPERT"): 0.9,
    (5, "BEGINNER"): 0.1, (5, "INTERMEDIATE"): 0.4, (5, "ADVANCED"): 0.9, (5, "EXPERT"): 1.0,
}

PRIORITY_WEIGHT = {
    "CRITICAL": 1.0,
    "HIGH": 0.9,
    "MEDIUM": 0.7,
    "LOW": 0.5,
    "NONE": 0.1
}

IMPORTANCE_WEIGHT = {
    SkillImportance.CRITICAL: 1.0,
    SkillImportance.HIGH: 0.9,
    SkillImportance.MEDIUM: 0.8,
    SkillImportance.LOW: 0.7
}


def get_all_training_courses(db: Session) -> List[TrainingCourseOut]:
    """Fetch all active training courses with skill names attached."""
    courses = db.query(TrainingCourse).filter(TrainingCourse.active == True).all()
    result = []
    for c in courses:
        skill = db.query(Skill).filter(Skill.id == c.skill_id).first()
        result.append(TrainingCourseOut(
            id=c.id,
            title=c.title,
            description=c.description,
            provider=c.provider,
            skill_id=c.skill_id,
            skill_name=skill.name if skill else "Unknown Skill",
            difficulty=c.difficulty.value if hasattr(c.difficulty, 'value') else str(c.difficulty),
            duration_hours=c.duration_hours,
            url=c.url,
            active=c.active
        ))
    return result


def get_recommendations(
    db: Session,
    user_id: str,
    priority_filter: Optional[str] = None,
    skill_id_filter: Optional[str] = None,
    difficulty_filter: Optional[str] = None,
    limit: int = 20
) -> RecommendationListResponse:
    """
    Generate hybrid personalized recommendations combining:
    - 40% Skill-Gap Relevance (Gap size & priority)
    - 30% Semantic Similarity (Embeddings / Cosine / Keyword fallback)
    - 10% Role Relevance (Job role requirements)
    - 10% Difficulty Fit (User current level vs course difficulty)
    - 10% Learning History (Completed vs in-progress vs new)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return RecommendationListResponse(recommendations=[], total_recommended=0, high_priority_count=0)

    # 1. Fetch Phase 3 competency gaps overview for user
    comp_overview = get_employee_competency_overview(db, user)
    
    # Map skill_id -> gap details
    user_gaps_map = {}
    for item in comp_overview.skills:
        user_gaps_map[item.skill_id] = item

    # 2. Fetch user's job role requirements
    role_req_map = {}
    if user.profile and user.profile.job_role_id:
        reqs = db.query(RoleSkillRequirement).filter(RoleSkillRequirement.role_id == user.profile.job_role_id).all()
        for r in reqs:
            role_req_map[r.skill_id] = r

    # 3. Fetch user's training history
    history_records = db.query(TrainingHistory).filter(TrainingHistory.user_id == user_id).all()
    history_status_map = {h.course_name.lower().strip(): h.status for h in history_records}

    # 4. Build user profile summary text for semantic matching
    profile_text_parts = []
    if user.profile:
        if user.profile.designation:
            profile_text_parts.append(user.profile.designation)
        if user.profile.professional_summary:
            profile_text_parts.append(user.profile.professional_summary)
        if user.profile.current_assignment:
            profile_text_parts.append(user.profile.current_assignment)
    
    missing_skill_names = [item.skill_name for item in comp_overview.skills if item.gap > 0]
    if missing_skill_names:
        profile_text_parts.append("Skill gaps: " + ", ".join(missing_skill_names))

    user_text = " ".join(profile_text_parts) if profile_text_parts else "Statistical officer data analysis survey design"

    # 5. Fetch all active training courses
    courses = db.query(TrainingCourse).filter(TrainingCourse.active == True).all()

    # Pre-compute embeddings for semantic matching if model available
    course_texts = [f"{c.title} {c.description or ''} {c.provider}" for c in courses]
    embeddings = embed_texts([user_text] + course_texts) if course_texts else None
    user_vec = embeddings[0] if (embeddings and len(embeddings) > 0) else None
    course_vecs = embeddings[1:] if (embeddings and len(embeddings) > 1) else []

    recommendation_items: List[RecommendationItemOut] = []

    for idx, c in enumerate(courses):
        skill = db.query(Skill).filter(Skill.id == c.skill_id).first()
        skill_name = skill.name if skill else "Skill"
        
        c_diff_str = c.difficulty.value if hasattr(c.difficulty, 'value') else str(c.difficulty)
        c_title_clean = c.title.lower().strip()
        enrollment_status = "NOT_STARTED"
        if c_title_clean in history_status_map:
            h_stat = history_status_map[c_title_clean]
            enrollment_status = h_stat.value if hasattr(h_stat, 'value') else str(h_stat)

        # Gap details for this course's skill
        gap_item = user_gaps_map.get(c.skill_id)
        current_level = gap_item.current_level if gap_item else 0
        required_level = gap_item.required_level if gap_item else 0
        gap_val = gap_item.gap if gap_item else 0
        gap_priority = gap_item.priority if gap_item else "NONE"

        reasons: List[str] = []

        # --- Factor 1: Skill-Gap Relevance (40%) ---
        if gap_val > 0:
            p_weight = PRIORITY_WEIGHT.get(gap_priority, 0.5)
            gap_ratio = min(1.0, gap_val / 3.0)
            gap_score = p_weight * (0.6 + 0.4 * gap_ratio)
            reasons.append(f"Addresses {gap_priority} Priority Skill Gap (+{gap_val} level gap)")
        else:
            gap_score = 0.1
            reasons.append("Maintains existing competency level")

        # --- Factor 2: Semantic Similarity (30%) ---
        if user_vec and idx < len(course_vecs):
            sim = cosine_similarity_vectors(user_vec, course_vecs[idx])
        else:
            sim = keyword_similarity(user_text, course_texts[idx])
        semantic_score = max(0.0, min(1.0, sim))
        if semantic_score >= 0.5:
            reasons.append(f"High Semantic Match ({int(semantic_score * 100)}% profile alignment)")

        # --- Factor 3: Role Relevance (10%) ---
        role_req = role_req_map.get(c.skill_id)
        if role_req:
            imp_w = IMPORTANCE_WEIGHT.get(role_req.importance, 0.8)
            role_score = imp_w
            reasons.append(f"Required for Job Role ({role_req.importance.value} Importance)")
        else:
            role_score = 0.2

        # --- Factor 4: Difficulty Fit (10%) ---
        difficulty_score = DIFFICULTY_FIT_MAP.get((min(5, max(0, current_level)), c_diff_str), 0.5)
        if difficulty_score >= 0.8:
            reasons.append(f"Ideal {c_diff_str.title()} difficulty fit for your Level {current_level}")

        # --- Factor 5: Learning History (10%) ---
        if enrollment_status == "COMPLETED":
            history_score = 0.0
            reasons.append("Already Completed")
        elif enrollment_status == "IN_PROGRESS":
            history_score = 0.5
            reasons.append("Currently In Progress")
        else:
            history_score = 0.85

        # Composite hybrid score calculation
        composite_score = (
            0.40 * gap_score +
            0.30 * semantic_score +
            0.10 * role_score +
            0.10 * difficulty_score +
            0.10 * history_score
        )

        # Penalize completed courses so they rank lower
        if enrollment_status == "COMPLETED":
            composite_score *= 0.1

        final_match_score = round(max(0.0, min(1.0, composite_score)), 4)
        match_pct = int(final_match_score * 100)

        course_out = TrainingCourseOut(
            id=c.id,
            title=c.title,
            description=c.description,
            provider=c.provider,
            skill_id=c.skill_id,
            skill_name=skill_name,
            difficulty=c_diff_str,
            duration_hours=c.duration_hours,
            url=c.url,
            active=c.active
        )

        item_out = RecommendationItemOut(
            course=course_out,
            skill_id=c.skill_id,
            skill_name=skill_name,
            current_level=current_level,
            required_level=required_level,
            gap=gap_val,
            gap_priority=gap_priority,
            match_score=final_match_score,
            match_percentage=match_pct,
            match_reasons=reasons,
            status=enrollment_status
        )

        # Apply Filters
        if priority_filter:
            p_clean = priority_filter.upper().strip()
            if p_clean == "HIGH_PRIORITY":
                if gap_priority not in ["HIGH", "CRITICAL"]:
                    continue
            elif gap_priority != p_clean:
                continue

        if skill_id_filter and c.skill_id != skill_id_filter:
            continue

        if difficulty_filter and c_diff_str != difficulty_filter.upper().strip():
            continue

        recommendation_items.append(item_out)

    # Sort recommendations by match_score descending
    recommendation_items.sort(key=lambda x: x.match_score, reverse=True)

    # Apply limit
    limited_items = recommendation_items[:limit]
    high_priority_count = sum(1 for item in recommendation_items if item.gap_priority in ["HIGH", "CRITICAL"])

    return RecommendationListResponse(
        recommendations=limited_items,
        total_recommended=len(recommendation_items),
        high_priority_count=high_priority_count
    )


def start_course(db: Session, user_id: str, course_id: str) -> CourseActionResponse:
    """Enroll user in a course / update training_history to IN_PROGRESS."""
    course = db.query(TrainingCourse).filter(TrainingCourse.id == course_id).first()
    if not course:
        raise ValueError(f"Training course with ID '{course_id}' not found.")

    history_item = db.query(TrainingHistory).filter(
        TrainingHistory.user_id == user_id,
        TrainingHistory.course_name == course.title
    ).first()

    if not history_item:
        history_item = TrainingHistory(
            user_id=user_id,
            course_name=course.title,
            provider=course.provider,
            duration_hours=course.duration_hours,
            status=TrainingStatus.IN_PROGRESS
        )
        db.add(history_item)
    else:
        history_item.status = TrainingStatus.IN_PROGRESS

    db.commit()

    return CourseActionResponse(
        message=f"Successfully started course '{course.title}'",
        course_id=course.id,
        status="IN_PROGRESS"
    )


def complete_course(db: Session, user_id: str, course_id: str) -> CourseActionResponse:
    """Mark course as COMPLETED in user's training_history."""
    course = db.query(TrainingCourse).filter(TrainingCourse.id == course_id).first()
    if not course:
        raise ValueError(f"Training course with ID '{course_id}' not found.")

    history_item = db.query(TrainingHistory).filter(
        TrainingHistory.user_id == user_id,
        TrainingHistory.course_name == course.title
    ).first()

    now_str = datetime.now().strftime("%Y-%m-%d")

    if not history_item:
        history_item = TrainingHistory(
            user_id=user_id,
            course_name=course.title,
            provider=course.provider,
            duration_hours=course.duration_hours,
            completion_date=now_str,
            status=TrainingStatus.COMPLETED
        )
        db.add(history_item)
    else:
        history_item.status = TrainingStatus.COMPLETED
        history_item.completion_date = now_str

    db.commit()

    return CourseActionResponse(
        message=f"Successfully completed course '{course.title}'",
        course_id=course.id,
        status="COMPLETED"
    )
