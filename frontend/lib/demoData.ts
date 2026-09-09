import {
  Profile, CompetencyOverview, CompetencySummary, RecommendationItem,
  LearningMaterial, AssessmentProgressResponse, AssessmentHistoryResponse,
  CompetencyProgressResponse, TrainingHistory
} from "./api";

export const DEMO_PROFILE: Profile = {
  id: "demo-profile-01",
  user_id: "demo-user-01",
  designation: "Senior Statistical Officer (SSO)",
  department: {
    id: "dept-01",
    name: "National Accounts & Survey Division (NASD)",
    code: "MOSPI-NASD",
    description: "Responsible for macro-economic aggregates and national survey frameworks."
  },
  job_role: {
    id: "role-01",
    title: "Senior Statistical Officer",
    code: "SSO-01",
    description: "Conducts stratified sampling, data quality checks, statistical modeling, and survey analysis."
  },
  education: "M.Sc. Statistics / Mathematical Sciences",
  years_of_experience: 6,
  current_assignment: "Periodic Labour Force Survey (PLFS) & Annual Survey of Industries (ASI) Estimation",
  professional_summary: "Experienced statistical officer specializing in survey methodology, sampling frameworks, and economic indicators validation.",
  skills: [
    {
      id: "es-1",
      skill_id: "sk-1",
      current_level: 4,
      source: "SELF_REPORTED",
      skill: { id: "sk-1", name: "Sampling Design & Methodology", category: "STATISTICAL" }
    },
    {
      id: "es-2",
      skill_id: "sk-2",
      current_level: 3,
      source: "EVIDENCE_EVALUATED",
      skill: { id: "sk-2", name: "Statistical Inference & Modeling", category: "STATISTICAL" }
    },
    {
      id: "es-3",
      skill_id: "sk-3",
      current_level: 2,
      source: "SELF_REPORTED",
      skill: { id: "sk-3", name: "R & Python for Data Analytics", category: "TECHNICAL" }
    },
    {
      id: "es-4",
      skill_id: "sk-4",
      current_level: 4,
      source: "EVIDENCE_EVALUATED",
      skill: { id: "sk-4", name: "Official Statistics & MOSPI Standards", category: "DIGITAL_GOVERNANCE" }
    },
    {
      id: "es-5",
      skill_id: "sk-5",
      current_level: 2,
      source: "SELF_REPORTED",
      skill: { id: "sk-5", name: "Data Quality & Anomaly Detection", category: "TECHNICAL" }
    },
    {
      id: "es-6",
      skill_id: "sk-6",
      current_level: 3,
      source: "SELF_REPORTED",
      skill: { id: "sk-6", name: "Time Series & Economic Indicators", category: "STATISTICAL" }
    }
  ]
};

export const DEMO_COMPETENCY: CompetencyOverview = {
  user_id: "demo-user-01",
  job_role_id: "role-01",
  job_role_title: "Senior Statistical Officer",
  department_name: "National Accounts & Survey Division (NASD)",
  overall_match_percentage: 78,
  total_required_skills: 6,
  skills_met: 4,
  skills_with_gaps: 2,
  skills: [
    {
      skill_id: "sk-1",
      skill_name: "Sampling Design & Methodology",
      skill_category: "STATISTICAL",
      current_level: 4,
      current_level_label: "Advanced",
      required_level: 4,
      required_level_label: "Advanced",
      gap: 0,
      gap_classification: "NO_GAP",
      importance: "CRITICAL",
      priority: "NONE",
      explanation: "Current competence level (Level 4 - Advanced) matches official cadre benchmark requirements."
    },
    {
      skill_id: "sk-2",
      skill_name: "Statistical Inference & Modeling",
      skill_category: "STATISTICAL",
      current_level: 3,
      current_level_label: "Intermediate",
      required_level: 4,
      required_level_label: "Advanced",
      gap: 1,
      gap_classification: "LOW",
      importance: "HIGH",
      priority: "MEDIUM",
      explanation: "Cadre standard requires Level 4 (Advanced) for complex survey weighting and variance estimation; currently at Level 3."
    },
    {
      skill_id: "sk-3",
      skill_name: "R & Python for Data Analytics",
      skill_category: "TECHNICAL",
      current_level: 2,
      current_level_label: "Basic",
      required_level: 4,
      required_level_label: "Advanced",
      gap: 2,
      gap_classification: "MEDIUM",
      importance: "CRITICAL",
      priority: "CRITICAL",
      explanation: "Critical deficit: Role mandates automated data ingestion, cleaning, and reproducible analytical pipelines using R or Python."
    },
    {
      skill_id: "sk-4",
      skill_name: "Official Statistics & MOSPI Standards",
      skill_category: "DIGITAL_GOVERNANCE",
      current_level: 4,
      current_level_label: "Advanced",
      required_level: 3,
      required_level_label: "Intermediate",
      gap: 0,
      gap_classification: "NO_GAP",
      importance: "HIGH",
      priority: "NONE",
      explanation: "Exceeds standard benchmark. Demonstrates strong command over NSSO/CSO metadata and statistical codes."
    },
    {
      skill_id: "sk-5",
      skill_name: "Data Quality & Anomaly Detection",
      skill_category: "TECHNICAL",
      current_level: 2,
      current_level_label: "Basic",
      required_level: 3,
      required_level_label: "Intermediate",
      gap: 1,
      gap_classification: "LOW",
      importance: "HIGH",
      priority: "HIGH",
      explanation: "Needs improvement in automated outlier identification algorithms and survey imputation protocols."
    },
    {
      skill_id: "sk-6",
      skill_name: "Time Series & Economic Indicators",
      skill_category: "STATISTICAL",
      current_level: 3,
      current_level_label: "Intermediate",
      required_level: 3,
      required_level_label: "Intermediate",
      gap: 0,
      gap_classification: "NO_GAP",
      importance: "MEDIUM",
      priority: "NONE",
      explanation: "Meets role expectations for CPI, IIP, and seasonal adjustment methods."
    }
  ]
};

export const DEMO_SUMMARY: CompetencySummary = {
  job_role_title: "Senior Statistical Officer",
  total_required_skills: 6,
  skills_met: 4,
  skills_with_gaps: 2,
  low_gaps_count: 1,
  medium_gaps_count: 1,
  high_gaps_count: 0,
  high_priority_gaps_count: 2,
  overall_match_percentage: 78
};

export const DEMO_RECOMMENDATIONS: RecommendationItem[] = [
  {
    course: {
      id: "crs-101",
      title: "R for Official Statistical Survey Analytics",
      description: "Master tidyverse, survey weighting, stratification analysis, and automated PDF report generation in R.",
      provider: "iGOT Karmayogi",
      skill_id: "sk-3",
      skill_name: "R & Python for Data Analytics",
      difficulty: "INTERMEDIATE",
      duration_hours: 24,
      url: "https://igotkarmayogi.gov.in",
      active: true
    },
    skill_id: "sk-3",
    skill_name: "R & Python for Data Analytics",
    current_level: 2,
    required_level: 4,
    gap: 2,
    gap_priority: "CRITICAL",
    match_score: 0.94,
    match_percentage: 94,
    match_reasons: [
      "Closes CRITICAL gap in R & Python Analytics (-2 levels)",
      "High relevance for MOSPI Senior Statistical Officer role",
      "Tailored difficulty progression (Level 2 → Level 3)"
    ],
    status: "IN_PROGRESS"
  },
  {
    course: {
      id: "crs-102",
      title: "Data Quality Assurance & Anomaly Detection in NSSO Surveys",
      description: "Comprehensive training on logical validation checks, edit rules, hot-deck imputation, and outlier treatment.",
      provider: "NSSTA (National Statistical Systems Training Academy)",
      skill_id: "sk-5",
      skill_name: "Data Quality & Anomaly Detection",
      difficulty: "INTERMEDIATE",
      duration_hours: 16,
      url: "http://mospi.gov.in/training-programmes",
      active: true
    },
    skill_id: "sk-5",
    skill_name: "Data Quality & Anomaly Detection",
    current_level: 2,
    required_level: 3,
    gap: 1,
    gap_priority: "HIGH",
    match_score: 0.88,
    match_percentage: 88,
    match_reasons: [
      "Closes HIGH priority gap in Data Quality & Anomaly Detection",
      "Official NSSTA accredited capacity building program",
      "Directly applies to current PLFS / ASI assignments"
    ],
    status: "NOT_STARTED"
  },
  {
    course: {
      id: "crs-103",
      title: "Advanced Survey Variance Estimation & Bootstrap Techniques",
      description: "Linearization, Jackknife, and Balanced Repeated Replication (BRR) methods for complex multi-stage samples.",
      provider: "SWAYAM",
      skill_id: "sk-2",
      skill_name: "Statistical Inference & Modeling",
      difficulty: "ADVANCED",
      duration_hours: 30,
      url: "https://swayam.gov.in",
      active: true
    },
    skill_id: "sk-2",
    skill_name: "Statistical Inference & Modeling",
    current_level: 3,
    required_level: 4,
    gap: 1,
    gap_priority: "MEDIUM",
    match_score: 0.82,
    match_percentage: 82,
    match_reasons: [
      "Advances Statistical Inference from Intermediate to Advanced",
      "Aligned with National Accounts Division guidelines"
    ],
    status: "NOT_STARTED"
  },
  {
    course: {
      id: "crs-104",
      title: "Foundations of Official Statistics & National Data Architecture",
      description: "Indian statistical system heritage, Collection of Statistics Act 2008, and NSO data governance norms.",
      provider: "iGOT Karmayogi",
      skill_id: "sk-4",
      skill_name: "Official Statistics & MOSPI Standards",
      difficulty: "BEGINNER",
      duration_hours: 10,
      url: "https://igotkarmayogi.gov.in",
      active: true
    },
    skill_id: "sk-4",
    skill_name: "Official Statistics & MOSPI Standards",
    current_level: 4,
    required_level: 3,
    gap: 0,
    gap_priority: "NONE",
    match_score: 0.65,
    match_percentage: 65,
    match_reasons: [
      "Core foundational orientation completed with distinction",
      "Reference resource for cadre governance"
    ],
    status: "COMPLETED"
  }
];

export const DEMO_MATERIALS: LearningMaterial[] = [
  {
    id: "mat-01",
    title: "NSSO 78th Round Survey Sampling Methodology & Concepts",
    file_name: "NSSO_78_Sampling_Methodology.pdf",
    file_type: "pdf",
    file_size: 2450000,
    content_text: "Stratified multi-stage design where first stage units (FSUs) are census villages in rural sector and Urban Frame Survey (UFS) blocks in urban sector. Second stage units (SSUs) are households.",
    uploader_id: "demo-user-01",
    chunk_count: 28,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "mat-02",
    title: "Consumer Price Index (CPI) Compilation Manual & Imputation Rules",
    file_name: "CPI_Compilation_Handbook_2026.pdf",
    file_type: "pdf",
    file_size: 1820000,
    content_text: "Compilation of elementary price indices using Jevons formula (geometric mean of price relatives) and aggregation to state and all-India levels using Laspeyres weighted formula.",
    uploader_id: "demo-user-01",
    chunk_count: 19,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: "mat-03",
    title: "Python Data Quality & Automated Survey Validation Pipeline",
    file_name: "Automated_Survey_Validation_NSSO.pptx",
    file_type: "pptx",
    file_size: 3200000,
    content_text: "Overview of pandas, pydantic validation constraints, and Great Expectations checks for field enumerator data transmission integrity.",
    uploader_id: "demo-user-01",
    chunk_count: 14,
    created_at: new Date(Date.now() - 86400000 * 12).toISOString()
  }
];

export const DEMO_PROGRESS: AssessmentProgressResponse = {
  user_id: "demo-user-01",
  total_assessments_taken: 12,
  assessments_passed: 10,
  pass_rate_percentage: 83.3,
  average_score: 86.5,
  learning_streak_days: 6,
  current_overall_match_percentage: 78,
  skills_count: 6
};

export const DEMO_ASSESSMENT_HISTORY: AssessmentHistoryResponse = {
  total_records: 4,
  history: [
    {
      id: "hist-1",
      skill_id: "sk-1",
      skill_name: "Sampling Design & Methodology",
      old_level: 3,
      new_level: 4,
      score: 92,
      evidence_source: "AI Quiz: NSSO 78th Round Sampling",
      adaptive_next_difficulty: "Expert",
      reason: "High score (92% >= 80%) on advanced multi-stage sampling quiz demonstrated mastery of design effects and cluster weighting.",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: "hist-2",
      skill_id: "sk-4",
      skill_name: "Official Statistics & MOSPI Standards",
      old_level: 3,
      new_level: 4,
      score: 88,
      evidence_source: "AI Quiz: CPI Compilation Standards",
      adaptive_next_difficulty: "Advanced",
      reason: "Demonstrated thorough knowledge of Laspeyres and Jevons index formulations under National Accounts Division rules.",
      created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      id: "hist-3",
      skill_id: "sk-3",
      skill_name: "R & Python for Data Analytics",
      old_level: 1,
      new_level: 2,
      score: 80,
      evidence_source: "AI Quiz: Python Data Validation",
      adaptive_next_difficulty: "Intermediate",
      reason: "Passed basic vector operations and dataframe manipulation assessment.",
      created_at: new Date(Date.now() - 86400000 * 10).toISOString()
    },
    {
      id: "hist-4",
      skill_id: "sk-2",
      skill_name: "Statistical Inference & Modeling",
      old_level: 2,
      new_level: 3,
      score: 84,
      evidence_source: "Course Evaluation: NSSTA Inference",
      adaptive_next_difficulty: "Advanced",
      reason: "Completed course assessment on hypothesis testing, confidence intervals, and p-value interpretations.",
      created_at: new Date(Date.now() - 86400000 * 18).toISOString()
    }
  ]
};

export const DEMO_COMPETENCY_PROGRESS: CompetencyProgressResponse = {
  user_id: "demo-user-01",
  overall_match_percentage: 78,
  skills_progress: [
    {
      skill_id: "sk-1",
      skill_name: "Sampling Design & Methodology",
      category: "STATISTICAL",
      current_level: 4,
      current_level_label: "Advanced",
      required_level: 4,
      required_level_label: "Advanced",
      gap: 0,
      total_evaluations: 4,
      last_evaluated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      history: [DEMO_ASSESSMENT_HISTORY.history[0]]
    },
    {
      skill_id: "sk-2",
      skill_name: "Statistical Inference & Modeling",
      category: "STATISTICAL",
      current_level: 3,
      current_level_label: "Intermediate",
      required_level: 4,
      required_level_label: "Advanced",
      gap: 1,
      total_evaluations: 3,
      last_evaluated_at: new Date(Date.now() - 86400000 * 18).toISOString(),
      history: [DEMO_ASSESSMENT_HISTORY.history[3]]
    },
    {
      skill_id: "sk-3",
      skill_name: "R & Python for Data Analytics",
      category: "TECHNICAL",
      current_level: 2,
      current_level_label: "Basic",
      required_level: 4,
      required_level_label: "Advanced",
      gap: 2,
      total_evaluations: 2,
      last_evaluated_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      history: [DEMO_ASSESSMENT_HISTORY.history[2]]
    },
    {
      skill_id: "sk-4",
      skill_name: "Official Statistics & MOSPI Standards",
      category: "DIGITAL_GOVERNANCE",
      current_level: 4,
      current_level_label: "Advanced",
      required_level: 3,
      required_level_label: "Intermediate",
      gap: 0,
      total_evaluations: 3,
      last_evaluated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      history: [DEMO_ASSESSMENT_HISTORY.history[1]]
    },
    {
      skill_id: "sk-5",
      skill_name: "Data Quality & Anomaly Detection",
      category: "TECHNICAL",
      current_level: 2,
      current_level_label: "Basic",
      required_level: 3,
      required_level_label: "Intermediate",
      gap: 1,
      total_evaluations: 1,
      last_evaluated_at: new Date(Date.now() - 86400000 * 25).toISOString(),
      history: []
    },
    {
      skill_id: "sk-6",
      skill_name: "Time Series & Economic Indicators",
      category: "STATISTICAL",
      current_level: 3,
      current_level_label: "Intermediate",
      required_level: 3,
      required_level_label: "Intermediate",
      gap: 0,
      total_evaluations: 2,
      last_evaluated_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      history: []
    }
  ]
};

export const DEMO_TRAINING_HISTORY: TrainingHistory[] = [
  {
    id: "th-1",
    course_name: "Foundations of Official Statistics & National Data Architecture",
    provider: "iGOT Karmayogi",
    completion_date: "2026-07-15",
    duration_hours: 10,
    status: "COMPLETED"
  },
  {
    id: "th-2",
    course_name: "Field Survey Management & Quality Control Practices",
    provider: "NSSTA",
    completion_date: "2026-06-20",
    duration_hours: 18,
    status: "COMPLETED"
  },
  {
    id: "th-3",
    course_name: "R for Official Statistical Survey Analytics",
    provider: "iGOT Karmayogi",
    duration_hours: 24,
    status: "IN_PROGRESS"
  }
];
