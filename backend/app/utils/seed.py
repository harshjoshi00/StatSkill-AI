import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, init_db
from app.core.security import get_password_hash
from app.models.user import (
    User, Profile, Department, JobRole, Skill, EmployeeSkill, TrainingHistory, RoleSkillRequirement,
    TrainingCourse, CourseDifficulty, UserRole, SkillCategory, SkillLevel, SkillSource, TrainingStatus, SkillImportance
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("statskill_seed")

DEPARTMENTS_DATA = [
    {"name": "National Statistical Office", "code": "NSO", "description": "Apex statistical authority under MOSPI for national data collection and standard setting."},
    {"name": "Economic Statistics Division", "code": "ESD", "description": "Responsible for Index of Industrial Production (IIP), CPI, and national macroeconomic indices."},
    {"name": "Social Statistics Division", "code": "SSD", "description": "Monitors Sustainable Development Goals (SDG) indicators and social statistics."},
    {"name": "Data & Technology Division", "code": "DTD", "description": "Manages IT infrastructure, statistical databases, and cloud systems."},
    {"name": "State Statistical Department", "code": "SSD_STATE", "description": "State-level Directorate of Economics & Statistics conducting regional field surveys."}
]

JOB_ROLES_DATA = [
    {"title": "Statistical Officer", "code": "SO", "description": "Supervises field operations, sample validation, and preliminary data processing."},
    {"title": "Senior Statistical Officer", "code": "SSO", "description": "Leads large-scale survey design, quality auditing, and macroeconomic estimation."},
    {"title": "Data Analyst", "code": "DA", "description": "Executes quantitative analysis, automated reporting, and SQL dataset queries."},
    {"title": "Statistical Investigator", "code": "SI", "description": "Conducts primary data collection, respondent interviews, and field validation."},
    {"title": "Data Scientist", "code": "DS", "description": "Builds predictive models, ML algorithms, and advanced statistical frameworks."},
    {"title": "IT Officer", "code": "ITO", "description": "Maintains database architectures, cloud APIs, and cybersecurity protocols."},
    {"title": "Research Officer", "code": "RO", "description": "Performs econometric research, method evaluation, and policy analysis."},
    {"title": "Survey Officer", "code": "SVO", "description": "Coordinates field teams, frame preparation, and sampling execution."}
]

SKILLS_DATA = [
    # Technical
    {"name": "Python", "category": SkillCategory.TECHNICAL, "description": "Python for statistical computing, pandas, numpy, and data processing."},
    {"name": "R", "category": SkillCategory.TECHNICAL, "description": "R language for statistical modeling, ggplot2, and survey analysis."},
    {"name": "SQL", "category": SkillCategory.TECHNICAL, "description": "Relational database querying, aggregations, and data extraction."},
    {"name": "Excel", "category": SkillCategory.TECHNICAL, "description": "Advanced spreadsheet modeling, pivot tables, and statistical formulas."},
    {"name": "Data Visualization", "category": SkillCategory.TECHNICAL, "description": "Designing dashboards, PowerBI/Tableau, and statistical graphics."},
    {"name": "Machine Learning", "category": SkillCategory.TECHNICAL, "description": "Supervised & unsupervised ML, decision trees, and predictive analytics."},
    {"name": "Artificial Intelligence", "category": SkillCategory.TECHNICAL, "description": "LLM applications, generative AI, RAG pipelines, and NLP."},
    {"name": "GIS", "category": SkillCategory.TECHNICAL, "description": "Geographic Information Systems for spatial statistical analysis."},
    {"name": "Cloud Computing", "category": SkillCategory.TECHNICAL, "description": "Cloud deployment, containerization, and cloud database storage."},
    {"name": "APIs", "category": SkillCategory.TECHNICAL, "description": "RESTful API design, data integration, and JSON web services."},
    {"name": "Databases", "category": SkillCategory.TECHNICAL, "description": "PostgreSQL, schema design, indexing, and vector databases."},

    # Statistical
    {"name": "Survey Design", "category": SkillCategory.STATISTICAL, "description": "Designing questionnaires, sampling frames, and field protocols."},
    {"name": "Sampling", "category": SkillCategory.STATISTICAL, "description": "Stratified, cluster, multi-stage sampling techniques, and weighting."},
    {"name": "Statistical Analysis", "category": SkillCategory.STATISTICAL, "description": "Hypothesis testing, regression analysis, time series, and inference."},
    {"name": "Data Quality", "category": SkillCategory.STATISTICAL, "description": "Data cleaning, imputation techniques, validation rules, and auditing."},
    {"name": "National Accounts", "category": SkillCategory.STATISTICAL, "description": "GDP calculation, System of National Accounts (SNA), and input-output tables."},
    {"name": "Price Statistics", "category": SkillCategory.STATISTICAL, "description": "Consumer Price Index (CPI), Wholesale Price Index (WPI), and inflation modeling."},
    {"name": "Labour Statistics", "category": SkillCategory.STATISTICAL, "description": "Periodic Labour Force Survey (PLFS), employment metrics, and workforce analysis."},
    {"name": "SDG Indicators", "category": SkillCategory.STATISTICAL, "description": "National Indicator Framework (NIF) for monitoring United Nations SDGs."},

    # Digital Governance
    {"name": "Cybersecurity", "category": SkillCategory.DIGITAL_GOVERNANCE, "description": "Information security standards, data encryption, and threat prevention."},
    {"name": "Data Privacy", "category": SkillCategory.DIGITAL_GOVERNANCE, "description": "Digital Personal Data Protection Act compliance, anonymization, and consent."},
    {"name": "Government Cloud", "category": SkillCategory.DIGITAL_GOVERNANCE, "description": "MeitY empanelled cloud infrastructure (GI Cloud / MeghRaj)."},
    {"name": "Digital Governance", "category": SkillCategory.DIGITAL_GOVERNANCE, "description": "National Data Governance Policy and e-Governance architecture."},

    # Behavioural
    {"name": "Communication", "category": SkillCategory.BEHAVIOURAL, "description": "Clear technical report writing, public presentation, and briefing notes."},
    {"name": "Leadership", "category": SkillCategory.BEHAVIOURAL, "description": "Team management, field survey direction, and mentorship."},
    {"name": "Project Management", "category": SkillCategory.BEHAVIOURAL, "description": "Survey timelines, resource allocation, and milestone monitoring."},
    {"name": "Decision Making", "category": SkillCategory.BEHAVIOURAL, "description": "Evidence-based decision making and strategic planning."},
    {"name": "Ethics", "category": SkillCategory.BEHAVIOURAL, "description": "Official statistical ethics, impartiality, confidentiality, and integrity."}
]

ROLE_REQUIREMENTS_DATA = [
    ("SO", "Survey Design", 4, SkillImportance.HIGH),
    ("SO", "Sampling", 4, SkillImportance.HIGH),
    ("SO", "Statistical Analysis", 4, SkillImportance.CRITICAL),
    ("SO", "Data Quality", 4, SkillImportance.CRITICAL),
    ("SO", "Python", 3, SkillImportance.HIGH),
    ("SO", "SQL", 3, SkillImportance.MEDIUM),
    ("SO", "Excel", 4, SkillImportance.MEDIUM),
    ("SO", "Communication", 4, SkillImportance.MEDIUM),

    ("SSO", "Survey Design", 5, SkillImportance.CRITICAL),
    ("SSO", "Sampling", 5, SkillImportance.CRITICAL),
    ("SSO", "Statistical Analysis", 5, SkillImportance.CRITICAL),
    ("SSO", "National Accounts", 4, SkillImportance.HIGH),
    ("SSO", "R", 4, SkillImportance.HIGH),
    ("SSO", "Leadership", 4, SkillImportance.CRITICAL),

    ("DA", "Python", 4, SkillImportance.CRITICAL),
    ("DA", "SQL", 4, SkillImportance.CRITICAL),
    ("DA", "Data Visualization", 4, SkillImportance.HIGH),
    ("DA", "Statistical Analysis", 3, SkillImportance.HIGH),
    ("DA", "Excel", 4, SkillImportance.MEDIUM),

    ("SI", "Survey Design", 3, SkillImportance.MEDIUM),
    ("SI", "Data Quality", 4, SkillImportance.CRITICAL),
    ("SI", "Excel", 3, SkillImportance.MEDIUM),
    ("SI", "Communication", 4, SkillImportance.HIGH),

    ("DS", "Machine Learning", 4, SkillImportance.CRITICAL),
    ("DS", "Python", 5, SkillImportance.CRITICAL),
    ("DS", "Artificial Intelligence", 4, SkillImportance.HIGH),
    ("DS", "SQL", 4, SkillImportance.HIGH),
    ("DS", "Statistical Analysis", 5, SkillImportance.CRITICAL),

    ("ITO", "Databases", 4, SkillImportance.CRITICAL),
    ("ITO", "Cybersecurity", 4, SkillImportance.CRITICAL),
    ("ITO", "Cloud Computing", 4, SkillImportance.HIGH),
    ("ITO", "APIs", 4, SkillImportance.HIGH),

    ("RO", "Statistical Analysis", 5, SkillImportance.CRITICAL),
    ("RO", "R", 4, SkillImportance.HIGH),
    ("RO", "Price Statistics", 4, SkillImportance.HIGH),
    ("RO", "National Accounts", 4, SkillImportance.HIGH),

    ("SVO", "Survey Design", 4, SkillImportance.CRITICAL),
    ("SVO", "Sampling", 4, SkillImportance.CRITICAL),
    ("SVO", "Project Management", 4, SkillImportance.HIGH),
]

def seed_database(db: Session = None):
    """Seed initial master data, demo accounts, skills, and training logs."""
    close_session = False
    if db is None:
        init_db()
        db = SessionLocal()
        close_session = True

    try:
        logger.info("Seeding departments...")
        dept_map = {}
        for d in DEPARTMENTS_DATA:
            existing = db.query(Department).filter(Department.code == d["code"]).first()
            if not existing:
                existing = Department(**d)
                db.add(existing)
                db.flush()
            dept_map[d["code"]] = existing.id

        logger.info("Seeding job roles...")
        role_map = {}
        for r in JOB_ROLES_DATA:
            existing = db.query(JobRole).filter(JobRole.code == r["code"]).first()
            if not existing:
                existing = JobRole(**r)
                db.add(existing)
                db.flush()
            role_map[r["code"]] = existing.id

        logger.info("Seeding skills...")
        skill_map = {}
        for s in SKILLS_DATA:
            existing = db.query(Skill).filter(Skill.name == s["name"]).first()
            if not existing:
                existing = Skill(**s)
                db.add(existing)
                db.flush()
            skill_map[s["name"]] = existing.id

        logger.info("Seeding role skill requirements...")
        for role_code, skill_name, req_level, importance in ROLE_REQUIREMENTS_DATA:
            role_id = role_map.get(role_code)
            skill_id = skill_map.get(skill_name)
            if role_id and skill_id:
                req = db.query(RoleSkillRequirement).filter(
                    RoleSkillRequirement.role_id == role_id,
                    RoleSkillRequirement.skill_id == skill_id
                ).first()
                if not req:
                    db.add(RoleSkillRequirement(
                        role_id=role_id,
                        skill_id=skill_id,
                        required_level=req_level,
                        importance=importance
                    ))
        db.flush()

        logger.info("Seeding training courses...")
        TRAINING_COURSES_DATA = [
            {"title": "Sampling Techniques & Survey Methodology [DEMO COURSE]", "description": "Fundamentals of probability sampling, stratified multi-stage frames, and MOSPI survey standards.", "provider": "iGOT Karmayogi", "skill_name": "Sampling", "difficulty": CourseDifficulty.BEGINNER, "duration_hours": 24, "url": "https://igotkarmayogi.gov.in/courses/sampling-101"},
            {"title": "Advanced Survey Design & Questionnaire Construction [DEMO COURSE]", "description": "Designing digital survey instruments, field validation rules, and non-response bias estimation.", "provider": "NSSTA", "skill_name": "Survey Design", "difficulty": CourseDifficulty.INTERMEDIATE, "duration_hours": 36, "url": "https://nssta.gov.in/courses/survey-design"},
            {"title": "Statistical Analysis & Hypothesis Testing with R [DEMO COURSE]", "description": "Parametric & non-parametric statistical inference, regression modeling, and survey weights.", "provider": "NSSTA", "skill_name": "Statistical Analysis", "difficulty": CourseDifficulty.INTERMEDIATE, "duration_hours": 40, "url": "https://nssta.gov.in/courses/stats-r"},
            {"title": "System of National Accounts & GDP Estimation [DEMO COURSE]", "description": "MOSPI methodology for quarterly GDP, Gross Value Added (GVA), and macroeconomic input-output tables.", "provider": "iGOT Karmayogi", "skill_name": "National Accounts", "difficulty": CourseDifficulty.ADVANCED, "duration_hours": 48, "url": "https://igotkarmayogi.gov.in/courses/sna-gdp"},
            {"title": "Price Statistics & Inflation Modeling (CPI/WPI) [DEMO COURSE]", "description": "Construction of Consumer Price Index (CPI), Laspeyres basket weighting, and price auditing.", "provider": "NSSTA", "skill_name": "Price Statistics", "difficulty": CourseDifficulty.INTERMEDIATE, "duration_hours": 30, "url": "https://nssta.gov.in/courses/cpi-wpi"},
            {"title": "Periodic Labour Force Survey (PLFS) Analytics [DEMO COURSE]", "description": "Analyzing employment metrics, activity status codes, and workforce participation rates.", "provider": "iGOT Karmayogi", "skill_name": "Labour Statistics", "difficulty": CourseDifficulty.INTERMEDIATE, "duration_hours": 28, "url": "https://igotkarmayogi.gov.in/courses/plfs"},
            {"title": "SDG National Indicator Framework & Monitoring [DEMO COURSE]", "description": "Tracking UN Sustainable Development Goals indicators across Central and State ministries.", "provider": "NITI Aayog / MoSPI", "skill_name": "SDG Indicators", "difficulty": CourseDifficulty.BEGINNER, "duration_hours": 20, "url": "https://igotkarmayogi.gov.in/courses/sdg-nif"},
            {"title": "Data Quality Auditing & Imputation Methods [DEMO COURSE]", "description": "Hot-deck imputation, mean substitution, outlier detection, and statistical audit protocols.", "provider": "NSSTA", "skill_name": "Data Quality", "difficulty": CourseDifficulty.ADVANCED, "duration_hours": 32, "url": "https://nssta.gov.in/courses/data-quality"},
            {"title": "Python for Official Statistics & Data Processing [DEMO COURSE]", "description": "Automating statistical data workflows using Pandas, NumPy, and automated report generation.", "provider": "NSSTA", "skill_name": "Python", "difficulty": CourseDifficulty.BEGINNER, "duration_hours": 40, "url": "https://nssta.gov.in/courses/python-stats"},
            {"title": "SQL Querying & Statistical Relational Databases [DEMO COURSE]", "description": "Complex SQL joins, window functions, aggregation, and querying large NSSO datasets.", "provider": "SWAYAM", "skill_name": "SQL", "difficulty": CourseDifficulty.INTERMEDIATE, "duration_hours": 30, "url": "https://swayam.gov.in/courses/sql-data"},
            {"title": "Advanced Spreadsheet Modeling & Pivot Analysis [DEMO COURSE]", "description": "Excel statistical formulas, VLOOKUP/XLOOKUP, macros, and survey tabulations.", "provider": "iGOT Karmayogi", "skill_name": "Excel", "difficulty": CourseDifficulty.BEGINNER, "duration_hours": 18, "url": "https://igotkarmayogi.gov.in/courses/excel-adv"},
            {"title": "Data Visualization & Dashboard Design [DEMO COURSE]", "description": "Interactive data charts, geospatial statistical graphics, PowerBI & Tableau for officials.", "provider": "SWAYAM", "skill_name": "Data Visualization", "difficulty": CourseDifficulty.INTERMEDIATE, "duration_hours": 25, "url": "https://swayam.gov.in/courses/datavis"},
            {"title": "Machine Learning for Predictive Statistical Modeling [DEMO COURSE]", "description": "Decision trees, random forests, XGBoost, and supervised learning for survey forecasting.", "provider": "NPTEL", "skill_name": "Machine Learning", "difficulty": CourseDifficulty.ADVANCED, "duration_hours": 60, "url": "https://nptel.ac.in/courses/ml-stats"},
            {"title": "Geographic Information Systems (GIS) for Spatial Statistics [DEMO COURSE]", "description": "QGIS, spatial autocorrelation, choropleth mapping, and census enumeration block GIS.", "provider": "iGOT Karmayogi", "skill_name": "GIS", "difficulty": CourseDifficulty.INTERMEDIATE, "duration_hours": 35, "url": "https://igotkarmayogi.gov.in/courses/gis-stats"},
            {"title": "Digital Personal Data Protection (DPDP) Act Compliance [DEMO COURSE]", "description": "Data privacy laws, consent frameworks, respondent anonymization, and government data security.", "provider": "MeitY / iGOT", "skill_name": "Data Privacy", "difficulty": CourseDifficulty.BEGINNER, "duration_hours": 15, "url": "https://igotkarmayogi.gov.in/courses/dpdp-act"},
            {"title": "Government Cloud Infrastructure & MeghRaj Standards [DEMO COURSE]", "description": "Cloud hosting security, National Informatics Centre (NIC) MeghRaj standards, and API access.", "provider": "MeitY", "skill_name": "Government Cloud", "difficulty": CourseDifficulty.INTERMEDIATE, "duration_hours": 22, "url": "https://igotkarmayogi.gov.in/courses/meghraj"},
            {"title": "Information Security & Cybersecurity for Public Officials [DEMO COURSE]", "description": "Threat awareness, password policies, phishing defense, and secure data transfers.", "provider": "iGOT Karmayogi", "skill_name": "Cybersecurity", "difficulty": CourseDifficulty.BEGINNER, "duration_hours": 12, "url": "https://igotkarmayogi.gov.in/courses/cybersecurity"},
            {"title": "Effective Official Communication & Briefing Preparation [DEMO COURSE]", "description": "Drafting policy notes, technical statistical summaries, and executive briefing presentations.", "provider": "iGOT Karmayogi", "skill_name": "Communication", "difficulty": CourseDifficulty.BEGINNER, "duration_hours": 16, "url": "https://igotkarmayogi.gov.in/courses/official-comm"},
            {"title": "Field Team Leadership & Survey Administration [DEMO COURSE]", "description": "Directing field enumerators, conflict resolution, field audit supervision, and team morale.", "provider": "iGOT Karmayogi", "skill_name": "Leadership", "difficulty": CourseDifficulty.INTERMEDIATE, "duration_hours": 20, "url": "https://igotkarmayogi.gov.in/courses/leadership"},
            {"title": "Survey Project Management & Milestone Tracking [DEMO COURSE]", "description": "Gantt charts, field survey timelines, resource scheduling, and budget monitoring.", "provider": "iGOT Karmayogi", "skill_name": "Project Management", "difficulty": CourseDifficulty.INTERMEDIATE, "duration_hours": 24, "url": "https://igotkarmayogi.gov.in/courses/proj-mgmt"}
        ]

        for tc in TRAINING_COURSES_DATA:
            skill_id = skill_map.get(tc["skill_name"])
            if skill_id:
                existing_c = db.query(TrainingCourse).filter(TrainingCourse.title == tc["title"]).first()
                if not existing_c:
                    db.add(TrainingCourse(
                        title=tc["title"],
                        description=tc["description"],
                        provider=tc["provider"],
                        skill_id=skill_id,
                        difficulty=tc["difficulty"],
                        duration_hours=tc["duration_hours"],
                        url=tc["url"],
                        active=True
                    ))
        db.flush()

        # Seed Demo Employee Account (also support legacy employee@statskill.local)
        for emp_email in ["employee@statskill.gov.in", "employee@statskill.local"]:
            emp_user = db.query(User).filter(User.email == emp_email).first()
            if not emp_user:
                logger.info(f"Creating demo employee account ({emp_email})...")
                emp_user = User(
                    email=emp_email,
                    password_hash=get_password_hash("Employee@123"),
                    first_name="Rajesh",
                    last_name="Kumar",
                    role=UserRole.EMPLOYEE,
                    is_active=True
                )
                db.add(emp_user)
                db.flush()

                emp_profile = Profile(
                    user_id=emp_user.id,
                    designation="Statistical Officer",
                    department_id=dept_map.get("NSO"),
                    job_role_id=role_map.get("SO"),
                    education="M.Sc. Statistics (Delhi University)",
                    years_of_experience=6,
                    current_assignment="Periodic Labour Force Survey (PLFS) Sample Verification",
                    professional_summary="Statistical officer specializing in field sampling, survey frame preparation, and statistical analysis."
                )
                db.add(emp_profile)
                db.flush()

                # Add demo skills for employee
                initial_emp_skills = [
                    ("Survey Design", 3),
                    ("Sampling", 3),
                    ("Statistical Analysis", 3),
                    ("Python", 2),
                    ("SQL", 2),
                    ("Excel", 4),
                    ("Communication", 4)
                ]
                for skill_name, level in initial_emp_skills:
                    if skill_name in skill_map:
                        db.add(EmployeeSkill(
                            profile_id=emp_profile.id,
                            skill_id=skill_map[skill_name],
                            current_level=level,
                            source=SkillSource.SELF_ASSESSMENT
                        ))

                # Add demo training history
                db.add(TrainingHistory(
                    user_id=emp_user.id,
                    course_name="Sampling Techniques & Survey Methodology",
                    provider="iGOT Karmayogi",
                    completion_date="2025-11-15",
                    duration_hours=24,
                    certificate_url="https://igotkarmayogi.gov.in/certificates/sample-101",
                    status=TrainingStatus.COMPLETED
                ))
                db.add(TrainingHistory(
                    user_id=emp_user.id,
                    course_name="Python for Statistical Computing Fundamentals",
                    provider="NSSTA",
                    completion_date="2026-02-10",
                    duration_hours=40,
                    certificate_url="https://nssta.gov.in/certificates/python-stats",
                    status=TrainingStatus.COMPLETED
                ))

        # Seed Demo Admin Account
        for admin_email in ["admin@statskill.gov.in", "admin@statskill.local"]:
            admin_user = db.query(User).filter(User.email == admin_email).first()
            if not admin_user:
                logger.info(f"Creating demo admin account ({admin_email})...")
                admin_user = User(
                    email=admin_email,
                    password_hash=get_password_hash("Admin@123"),
                    first_name="Dr. Sunita",
                    last_name="Sharma",
                    role=UserRole.ADMIN,
                    is_active=True
                )
                db.add(admin_user)
                db.flush()

                admin_profile = Profile(
                    user_id=admin_user.id,
                    designation="Director General / Cadre Manager",
                    department_id=dept_map.get("NSO"),
                    job_role_id=role_map.get("SSO"),
                    education="Ph.D. Econometrics",
                    years_of_experience=18,
                    current_assignment="MOSPI Workforce Capacity Development & iGOT Strategy",
                    professional_summary="Senior administrator leading capacity building and technology adoption across official statistics."
                )
                db.add(admin_profile)

        db.commit()
        logger.info("Database seeding completed successfully.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise e
    finally:
        if close_session:
            db.close()

if __name__ == "__main__":
    seed_database()
