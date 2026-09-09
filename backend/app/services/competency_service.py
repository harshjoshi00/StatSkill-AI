from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from collections import defaultdict
from app.models.user import (
    User, Profile, JobRole, Department, Skill, EmployeeSkill,
    RoleSkillRequirement, UserRole, SkillImportance, SkillCategory
)
from app.schemas.competency import (
    SkillCompetencyItem, CompetencyOverviewResponse, CompetencySummaryResponse,
    CompetencyGapsResponse, CommonSkillGapItem, DepartmentCompetencySummaryItem,
    RoleCompetencySummaryItem, AdminCompetencyOverviewResponse
)

LEVEL_LABELS = {
    0: "No Knowledge",
    1: "Beginner",
    2: "Basic",
    3: "Intermediate",
    4: "Advanced",
    5: "Expert"
}

PRIORITY_RANK = {
    "CRITICAL": 4,
    "HIGH": 3,
    "MEDIUM": 2,
    "LOW": 1,
    "NONE": 0
}

def calculate_gap(required_level: int, current_level: int) -> int:
    """Calculate skill gap: gap = required_level - current_level."""
    return required_level - current_level

def classify_gap(gap: int) -> str:
    """
    Classify gap severity:
    - gap <= 0 -> NO_GAP
    - gap == 1 -> LOW
    - gap == 2 -> MEDIUM
    - gap >= 3 -> HIGH
    """
    if gap <= 0:
        return "NO_GAP"
    elif gap == 1:
        return "LOW"
    elif gap == 2:
        return "MEDIUM"
    else:
        return "HIGH"

def determine_priority(importance: SkillImportance | str, gap_classification: str) -> str:
    """
    Derive priority explainably from skill importance and gap classification.
    """
    importance_str = importance.value if isinstance(importance, SkillImportance) else str(importance)
    
    if gap_classification == "NO_GAP":
        return "NONE"
    
    if gap_classification == "HIGH":  # gap >= 3
        if importance_str in ["CRITICAL", "HIGH"]:
            return "CRITICAL"
        return "HIGH"
    elif gap_classification == "MEDIUM":  # gap == 2
        if importance_str == "CRITICAL":
            return "HIGH"
        elif importance_str in ["HIGH", "MEDIUM"]:
            return "MEDIUM"
        return "LOW"
    else:  # gap == 1 (LOW)
        if importance_str == "CRITICAL":
            return "MEDIUM"
        return "LOW"

def generate_gap_explanation(
    skill_name: str,
    role_title: str,
    current_level: int,
    required_level: int,
    importance: SkillImportance | str,
    gap: int,
    classification: str,
    priority: str
) -> str:
    """Generate clear, explainable text reasoning for competency level and gap."""
    importance_str = importance.value if isinstance(importance, SkillImportance) else str(importance)
    curr_label = LEVEL_LABELS.get(current_level, f"Level {current_level}")
    req_label = LEVEL_LABELS.get(required_level, f"Level {required_level}")

    if gap <= 0:
        if current_level > required_level:
            return (
                f"Exceeds Requirement: Your competency level ({curr_label}) exceeds the target "
                f"level ({req_label}) for {role_title}."
            )
        return (
            f"Requirement Met: Your competency level ({curr_label}) meets the target "
            f"level ({req_label}) for {role_title}."
        )
    
    return (
        f"Skill Gap Identified: For {role_title}, {skill_name} is required at {req_label} level "
        f"(Importance: {importance_str}), but your current level is {curr_label}. "
        f"This creates a {classification} gap of {gap} level(s) with {priority} priority."
    )

def get_employee_competency_overview(db: Session, user: User) -> CompetencyOverviewResponse:
    """Compute overall competency overview comparing current employee skills with job role requirements."""
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    
    if not profile or not profile.job_role_id:
        dept_name = profile.department.name if profile and profile.department else None
        return CompetencyOverviewResponse(
            user_id=user.id,
            job_role_id=None,
            job_role_title=profile.designation if profile else None,
            department_name=dept_name,
            overall_match_percentage=100.0,
            total_required_skills=0,
            skills_met=0,
            skills_with_gaps=0,
            skills=[]
        )

    job_role = db.query(JobRole).filter(JobRole.id == profile.job_role_id).first()
    role_title = job_role.title if job_role else "Assigned Role"
    dept_name = profile.department.name if profile.department else None

    # Fetch requirements for user's job role
    requirements = db.query(RoleSkillRequirement).filter(
        RoleSkillRequirement.role_id == profile.job_role_id
    ).all()

    # Fetch user's current employee skills
    emp_skills = db.query(EmployeeSkill).filter(
        EmployeeSkill.profile_id == profile.id
    ).all()
    user_skill_levels = {es.skill_id: es.current_level for es in emp_skills}

    items: List[SkillCompetencyItem] = []
    total_required = len(requirements)
    skills_met = 0
    skills_with_gaps = 0
    total_required_points = 0
    earned_points = 0

    for req in requirements:
        skill = req.skill
        current_lvl = user_skill_levels.get(req.skill_id, 0)
        gap = calculate_gap(req.required_level, current_lvl)
        classification = classify_gap(gap)
        priority = determine_priority(req.importance, classification)
        explanation = generate_gap_explanation(
            skill_name=skill.name if skill else "Skill",
            role_title=role_title,
            current_level=current_lvl,
            required_level=req.required_level,
            importance=req.importance,
            gap=gap,
            classification=classification,
            priority=priority
        )

        if gap <= 0:
            skills_met += 1
        else:
            skills_with_gaps += 1

        total_required_points += req.required_level
        earned_points += min(current_lvl, req.required_level)

        items.append(SkillCompetencyItem(
            skill_id=req.skill_id,
            skill_name=skill.name if skill else "Unknown",
            skill_category=skill.category if skill else SkillCategory.TECHNICAL,
            current_level=current_lvl,
            current_level_label=LEVEL_LABELS.get(current_lvl, str(current_lvl)),
            required_level=req.required_level,
            required_level_label=LEVEL_LABELS.get(req.required_level, str(req.required_level)),
            gap=gap,
            gap_classification=classification,
            importance=req.importance,
            priority=priority,
            explanation=explanation
        ))

    match_pct = 100.0 if total_required_points == 0 else round((earned_points / total_required_points) * 100, 1)

    return CompetencyOverviewResponse(
        user_id=user.id,
        job_role_id=profile.job_role_id,
        job_role_title=role_title,
        department_name=dept_name,
        overall_match_percentage=match_pct,
        total_required_skills=total_required,
        skills_met=skills_met,
        skills_with_gaps=skills_with_gaps,
        skills=items
    )

def get_employee_competency_summary(db: Session, user: User) -> CompetencySummaryResponse:
    """Compute high-level summary metrics for employee competency."""
    overview = get_employee_competency_overview(db, user)

    low_cnt = sum(1 for s in overview.skills if s.gap_classification == "LOW")
    med_cnt = sum(1 for s in overview.skills if s.gap_classification == "MEDIUM")
    high_cnt = sum(1 for s in overview.skills if s.gap_classification == "HIGH")
    high_priority_cnt = sum(1 for s in overview.skills if s.priority in ["HIGH", "CRITICAL"])

    return CompetencySummaryResponse(
        job_role_title=overview.job_role_title,
        total_required_skills=overview.total_required_skills,
        skills_met=overview.skills_met,
        skills_with_gaps=overview.skills_with_gaps,
        low_gaps_count=low_cnt,
        medium_gaps_count=med_cnt,
        high_gaps_count=high_cnt,
        high_priority_gaps_count=high_priority_cnt,
        overall_match_percentage=overview.overall_match_percentage
    )

def get_employee_skill_gaps(db: Session, user: User) -> CompetencyGapsResponse:
    """Retrieve filtered skill gaps (gap > 0) for current employee, sorted by priority."""
    overview = get_employee_competency_overview(db, user)
    gaps = [s for s in overview.skills if s.gap > 0]
    
    # Sort by priority rank descending, then gap descending
    gaps.sort(key=lambda s: (PRIORITY_RANK.get(s.priority, 0), s.gap), reverse=True)

    return CompetencyGapsResponse(
        total_gaps_count=len(gaps),
        gaps=gaps
    )

def get_admin_competency_overview(db: Session) -> AdminCompetencyOverviewResponse:
    """Compute aggregate workforce competency metrics across all employees for Administrator console."""
    employees = db.query(User).filter(User.role == UserRole.EMPLOYEE).all()
    total_employees = len(employees)

    employees_with_gaps = 0
    high_priority_gaps_total = 0

    # Skill gap aggregation: skill_id -> list of gap integers
    skill_gap_tracker: Dict[str, Dict[str, Any]] = {}
    
    # Department tracker: dept_id -> {name, code, total_emp, emp_with_gaps, total_match_pct}
    dept_tracker: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
        "name": "", "code": "", "total_employees": 0, "employees_with_gaps": 0, "match_pcts": []
    })

    # Role tracker: role_id -> {title, code, total_emp, requirements_cnt, total_gaps}
    role_tracker: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
        "title": "", "code": "", "total_employees": 0, "requirements_cnt": 0, "total_gaps": 0
    })

    for emp in employees:
        overview = get_employee_competency_overview(db, emp)
        profile = db.query(Profile).filter(Profile.user_id == emp.id).first()

        dept_id = profile.department_id if profile and profile.department_id else None
        role_id = profile.job_role_id if profile and profile.job_role_id else None

        if dept_id and profile.department:
            d_info = dept_tracker[dept_id]
            d_info["name"] = profile.department.name
            d_info["code"] = profile.department.code
            d_info["total_employees"] += 1
            d_info["match_pcts"].append(overview.overall_match_percentage)

        if role_id and profile.job_role:
            r_info = role_tracker[role_id]
            r_info["title"] = profile.job_role.title
            r_info["code"] = profile.job_role.code
            r_info["total_employees"] += 1
            r_info["requirements_cnt"] = overview.total_required_skills

        if overview.skills_with_gaps > 0:
            employees_with_gaps += 1
            if dept_id:
                dept_tracker[dept_id]["employees_with_gaps"] += 1

        for item in overview.skills:
            if item.priority in ["HIGH", "CRITICAL"]:
                high_priority_gaps_total += 1

            if role_id:
                if item.gap > 0:
                    role_tracker[role_id]["total_gaps"] += 1

            if item.gap > 0:
                if item.skill_id not in skill_gap_tracker:
                    skill_gap_tracker[item.skill_id] = {
                        "skill_name": item.skill_name,
                        "category": item.skill_category,
                        "importance": item.importance,
                        "gaps": []
                    }
                skill_gap_tracker[item.skill_id]["gaps"].append(item.gap)

    # Build most common skill gaps list
    common_gaps: List[CommonSkillGapItem] = []
    for s_id, s_data in skill_gap_tracker.items():
        gaps_list = s_data["gaps"]
        avg_gap = round(sum(gaps_list) / len(gaps_list), 1) if gaps_list else 0.0
        common_gaps.append(CommonSkillGapItem(
            skill_id=s_id,
            skill_name=s_data["skill_name"],
            skill_category=s_data["category"],
            gap_count=len(gaps_list),
            average_gap=avg_gap,
            importance=s_data["importance"]
        ))
    common_gaps.sort(key=lambda x: (x.gap_count, x.average_gap), reverse=True)

    # Build department summary
    dept_summary: List[DepartmentCompetencySummaryItem] = []
    for d_id, d_data in dept_tracker.items():
        pcts = d_data["match_pcts"]
        avg_pct = round(sum(pcts) / len(pcts), 1) if pcts else 100.0
        dept_summary.append(DepartmentCompetencySummaryItem(
            department_id=d_id,
            department_name=d_data["name"],
            department_code=d_data["code"],
            total_employees=d_data["total_employees"],
            employees_with_gaps=d_data["employees_with_gaps"],
            average_match_percentage=avg_pct
        ))

    # Build role summary
    role_summary: List[RoleCompetencySummaryItem] = []
    for r_id, r_data in role_tracker.items():
        role_summary.append(RoleCompetencySummaryItem(
            role_id=r_id,
            role_title=r_data["title"],
            role_code=r_data["code"],
            total_employees=r_data["total_employees"],
            total_requirements=r_data["requirements_cnt"],
            total_gaps=r_data["total_gaps"]
        ))

    return AdminCompetencyOverviewResponse(
        total_employees=total_employees,
        employees_with_gaps=employees_with_gaps,
        high_priority_gaps=high_priority_gaps_total,
        most_common_skill_gaps=common_gaps,
        department_summary=dept_summary,
        role_summary=role_summary
    )
