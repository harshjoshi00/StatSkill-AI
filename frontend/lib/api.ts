// Fix api.ts - remove `str` TypeScript errors, use `string` correctly
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface HealthResponse {
  status: string;
  app_name: string;
  environment: string;
  version: string;
  demo_mode: boolean;
  database: { connected: boolean; pgvector_enabled: boolean; engine: string };
  llm_provider: string;
  uptime_seconds: number;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  is_active: boolean;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Department { id: string; name: string; code: string; description?: string }
export interface JobRole { id: string; title: string; code: string; description?: string }
export interface Skill { id: string; name: string; description?: string; category: "STATISTICAL" | "TECHNICAL" | "DIGITAL_GOVERNANCE" | "BEHAVIOURAL" }
export interface EmployeeSkill { id: string; skill_id: string; skill: Skill; current_level: number; source: string }
export interface TrainingHistory { id: string; course_name: string; provider: string; completion_date?: string; duration_hours: number; certificate_url?: string; status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED" }
export interface Profile {
  id: string; user_id: string; designation?: string; department?: Department;
  job_role?: JobRole; education?: string; years_of_experience: number;
  current_assignment?: string; professional_summary?: string; skills: EmployeeSkill[];
}
export interface ProfileUpdateInput {
  designation?: string; department_id?: string; job_role_id?: string; education?: string;
  years_of_experience?: number; current_assignment?: string; professional_summary?: string;
  skills?: { skill_id: string; current_level: number; source?: string }[];
}

function getAuthHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("statskill_token") : null);
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  return headers;
}

export async function fetchHealthStatus(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/health/`, { cache: "no-store" });
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch { return null; }
}

export async function loginApi(email: string, password: string): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Login failed");
  return data;
}

export async function registerApi(first_name: string, last_name: string, email: string, password: string): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ first_name, last_name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Registration failed");
  return data;
}

export async function fetchMeApi(token?: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, { headers: getAuthHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch user");
  return data;
}

export async function fetchProfileApi(): Promise<Profile> {
  const res = await fetch(`${API_BASE_URL}/api/v1/profile`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch profile");
  return data;
}

export async function updateProfileApi(profileData: ProfileUpdateInput): Promise<Profile> {
  const res = await fetch(`${API_BASE_URL}/api/v1/profile`, {
    method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(profileData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to update profile");
  return data;
}

export async function fetchDepartmentsApi(): Promise<Department[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/departments`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch departments");
  return await res.json();
}

export async function fetchRolesApi(): Promise<JobRole[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/roles`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch roles");
  return await res.json();
}

export async function fetchSkillsApi(): Promise<Skill[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/skills`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch skills");
  return await res.json();
}

export async function fetchTrainingHistoryApi(): Promise<TrainingHistory[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/training-history`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch training history");
  return await res.json();
}

export async function addTrainingHistoryApi(training: Omit<TrainingHistory, "id">): Promise<TrainingHistory> {
  const res = await fetch(`${API_BASE_URL}/api/v1/training-history`, {
    method: "POST", headers: getAuthHeaders(), body: JSON.stringify(training),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to add training");
  return data;
}

export interface SkillCompetencyItem {
  skill_id: string;
  skill_name: string;
  skill_category: "STATISTICAL" | "TECHNICAL" | "DIGITAL_GOVERNANCE" | "BEHAVIOURAL";
  current_level: number;
  current_level_label: string;
  required_level: number;
  required_level_label: string;
  gap: number;
  gap_classification: "NO_GAP" | "LOW" | "MEDIUM" | "HIGH";
  importance: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  explanation: string;
}

export interface CompetencyOverview {
  user_id: string;
  job_role_id?: string;
  job_role_title?: string;
  department_name?: string;
  overall_match_percentage: number;
  total_required_skills: number;
  skills_met: number;
  skills_with_gaps: number;
  skills: SkillCompetencyItem[];
}

export interface CompetencySummary {
  job_role_title?: string;
  total_required_skills: number;
  skills_met: number;
  skills_with_gaps: number;
  low_gaps_count: number;
  medium_gaps_count: number;
  high_gaps_count: number;
  high_priority_gaps_count: number;
  overall_match_percentage: number;
}

export interface CompetencyGapsResponse {
  total_gaps_count: number;
  gaps: SkillCompetencyItem[];
}

export async function fetchCompetencyOverviewApi(): Promise<CompetencyOverview> {
  const res = await fetch(`${API_BASE_URL}/api/v1/competency`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch competency overview");
  return data;
}

export async function fetchCompetencySummaryApi(): Promise<CompetencySummary> {
  const res = await fetch(`${API_BASE_URL}/api/v1/competency/summary`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch competency summary");
  return data;
}

export async function fetchCompetencyGapsApi(): Promise<CompetencyGapsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/competency/gaps`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch competency gaps");
  return data;
}

export interface CommonSkillGapItem {
  skill_id: string;
  skill_name: string;
  skill_category: "STATISTICAL" | "TECHNICAL" | "DIGITAL_GOVERNANCE" | "BEHAVIOURAL";
  gap_count: number;
  average_gap: number;
  importance: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface DepartmentCompetencySummaryItem {
  department_id: string;
  department_name: string;
  department_code: string;
  total_employees: number;
  employees_with_gaps: number;
  average_match_percentage: number;
}

export interface RoleCompetencySummaryItem {
  role_id: string;
  role_title: string;
  role_code: string;
  total_employees: number;
  total_requirements: number;
  total_gaps: number;
}

export interface AdminCompetencyOverview {
  total_employees: number;
  employees_with_gaps: number;
  high_priority_gaps: number;
  most_common_skill_gaps: CommonSkillGapItem[];
  department_summary: DepartmentCompetencySummaryItem[];
  role_summary: RoleCompetencySummaryItem[];
}

export interface AdminAnalyticsResponse {
  total_employees: number;
  total_departments: number;
  total_roles: number;
  total_skills: number;
  average_competency_match: number;
  total_open_skill_gaps: number;
  high_critical_gaps: number;
  training_completed_count: number;
  training_completion_rate: number;
  total_quiz_attempts: number;
  average_quiz_score: number;
  quiz_pass_rate: number;
  top_missing_skills: CommonSkillGapItem[];
  department_breakdown: DepartmentCompetencySummaryItem[];
  role_breakdown: RoleCompetencySummaryItem[];
  training_effectiveness_summary: Record<string, any>;
}

export interface TrainingEffectivenessCourseItem {
  course_id: string;
  course_title: string;
  provider: string;
  enrolled_count: number;
  completed_count: number;
  completion_rate: number;
  avg_quiz_score: number;
  competency_gain_avg: number;
  effectiveness_score: number;
}

export interface TrainingEffectivenessResponse {
  total_courses: number;
  total_completions: number;
  overall_avg_gain: number;
  courses: TrainingEffectivenessCourseItem[];
}

export interface EmployeeRiskPrediction {
  user_id: string;
  employee_name: string;
  email: string;
  department_name?: string;
  job_role_title?: string;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  risk_probability: number;
  overall_match_pct: number;
  open_gaps_count: number;
  high_critical_gaps_count: number;
  quiz_pass_rate: number;
  contributing_factors: string[];
  recommended_action: string;
}

export interface AdminPredictionsResponse {
  model_type: string;
  model_accuracy: number;
  total_predictions: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  feature_importances: Record<string, number>;
  predictions: EmployeeRiskPrediction[];
}

export interface WorkforceSummaryResponse {
  total_employees: number;
  workforce_readiness_score: number;
  top_critical_skill_gaps: CommonSkillGapItem[];
  high_risk_employee_pct: number;
  training_completion_pct: number;
  key_recommendations: string[];
}

export async function fetchAdminAnalyticsApi(): Promise<AdminAnalyticsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/analytics`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch admin analytics");
  return data;
}

export async function fetchAdminCompetencyOverviewApi(): Promise<AdminCompetencyOverview> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/competency-overview`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch admin competency overview");
  return data;
}

export async function fetchTrainingEffectivenessApi(): Promise<TrainingEffectivenessResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/training-effectiveness`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch training effectiveness");
  return data;
}

export async function fetchAdminPredictionsApi(): Promise<AdminPredictionsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/predictions`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch admin predictions");
  return data;
}

export async function fetchWorkforceSummaryApi(): Promise<WorkforceSummaryResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/admin/workforce-summary`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch workforce summary");
  return data;
}

// ──────────────────────────────────────────────────────────────────────────
// Phase 4: AI Skill Extraction & Semantic Matching
// ──────────────────────────────────────────────────────────────────────────
export interface SkillMatchItem {
  extracted_skill: string;
  matched_skill_id: string | null;
  matched_skill_name: string | null;
  matched_skill_category: string | null;
  similarity_score: number;
  confidence: number;
  source: "EMBEDDING" | "KEYWORD";
  above_threshold: boolean;
}

export interface ExtractResponse {
  input_text_length: number;
  phrases_extracted: number;
  extracted_phrases?: number;
  matches_above_threshold: number;
  total_matched?: number;
  model_used: string;
  matching_engine?: string;
  suggestions_saved: number;
  matches: SkillMatchItem[];
}

export interface AiSkillSuggestion {
  id: string;
  user_id: string;
  extracted_skill: string;
  matched_skill_id: string | null;
  matched_skill_name: string | null;
  confidence: number;
  similarity_score: string | null;
  source_text_snippet?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  suggested_level: null;
}

export interface SuggestionsListResponse {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  suggestions: AiSkillSuggestion[];
}

export interface AcceptSuggestionResponse {
  suggestion_id: string;
  skill_id: string;
  skill_name: string;
  current_level: number;
  source: string;
  message: string;
}

export async function extractSkillsApi(
  text: string,
  options?: { threshold?: number; save_suggestions?: boolean }
): Promise<ExtractResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ai/skills/extract`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ text, ...options }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Skill extraction failed");
  return data;
}

export async function matchSkillsApi(phrases: string[]): Promise<{ model_used: string; matches: SkillMatchItem[] }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ai/skills/match`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ phrases }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Skill matching failed");
  return data;
}

export async function fetchAiSuggestionsApi(): Promise<SuggestionsListResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ai/skills/suggestions`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch suggestions");
  return data;
}

export async function acceptSuggestionApi(id: string, current_level: number): Promise<AcceptSuggestionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ai/skills/suggestions/${id}/accept`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ current_level }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to accept suggestion");
  return data;
}

export async function rejectSuggestionApi(id: string): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ai/skills/suggestions/${id}/reject`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to reject suggestion");
  return data;
}

export interface TrainingCourse {
  id: string;
  title: string;
  description?: string;
  provider: string;
  skill_id: string;
  skill_name?: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  duration_hours: number;
  url?: string;
  active: boolean;
}

export interface RecommendationItem {
  course: TrainingCourse;
  skill_id: string;
  skill_name: string;
  current_level: number;
  required_level: number;
  gap: number;
  gap_priority: "HIGH" | "CRITICAL" | "MEDIUM" | "LOW" | "NONE";
  match_score: number;
  match_percentage: number;
  match_reasons: string[];
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

export interface RecommendationListResponse {
  recommendations: RecommendationItem[];
  total_recommended: number;
  high_priority_count: number;
}

export interface CourseActionResponse {
  message: string;
  course_id: string;
  status: string;
}

export async function fetchRecommendationsApi(filters?: {
  priority?: string;
  skill_id?: string;
  difficulty?: string;
  limit?: number;
}): Promise<RecommendationListResponse> {
  const params = new URLSearchParams();
  if (filters?.priority) params.append("priority", filters.priority);
  if (filters?.skill_id) params.append("skill_id", filters.skill_id);
  if (filters?.difficulty) params.append("difficulty", filters.difficulty);
  if (filters?.limit) params.append("limit", filters.limit.toString());

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE_URL}/api/v1/recommendations${query}`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch recommendations");
  return data;
}

export async function fetchRecommendationsBySkillApi(skillId: string): Promise<RecommendationListResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/recommendations/${skillId}`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch skill recommendations");
  return data;
}

export async function fetchTrainingCoursesApi(): Promise<TrainingCourse[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/training-courses`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch training courses");
  return data;
}

export async function startCourseApi(courseId: string): Promise<CourseActionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/recommendations/${courseId}/start`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to start course");
  return data;
}

export async function completeCourseApi(courseId: string): Promise<CourseActionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/recommendations/${courseId}/complete`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to complete course");
  return data;
}

// ──────────────────────────────────────────────────────────────────────────
// Phase 6: RAG Learning Material & AI Quiz Generation
// ──────────────────────────────────────────────────────────────────────────

export interface LearningMaterial {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  content_text: string;
  uploader_id: string;
  course_id?: string;
  chunk_count: number;
  created_at?: string;
}

export interface MaterialUploadResponse {
  message: string;
  material: LearningMaterial;
  chunks_created: number;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  difficulty: string;
  source_reference?: string;
}

export interface Quiz {
  id: string;
  material_id: string;
  material_title: string;
  title: string;
  description?: string;
  num_questions: number;
  is_demo: boolean;
  questions: QuizQuestion[];
  created_at?: string;
}

export interface QuizAnswerResult {
  question_id: string;
  question_text: string;
  options: string[];
  selected_option: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
  difficulty: string;
  source_reference?: string;
}

export interface RecommendedCourseSummary {
  id: string;
  title: string;
  provider: string;
  difficulty: string;
  duration_hours: number;
  url?: string;
}

export interface QuizAttemptResult {
  attempt_id: string;
  quiz_id: string;
  quiz_title: string;
  user_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  submitted_at?: string;
  answers: QuizAnswerResult[];
  competency_improvement_summary: string;
  recommended_courses: RecommendedCourseSummary[];
}

export async function uploadMaterialApi(formData: FormData): Promise<MaterialUploadResponse> {
  const token = typeof window !== "undefined" ? localStorage.getItem("statskill_token") : null;
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/api/v1/learning/materials/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to upload learning material");
  return data;
}

export async function fetchMaterialsApi(): Promise<LearningMaterial[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/learning/materials`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch learning materials");
  return data;
}

export async function createQuizApi(
  materialId: string,
  options?: { num_questions?: number; difficulty?: string; topic?: string }
): Promise<Quiz> {
  const res = await fetch(`${API_BASE_URL}/api/v1/learning/materials/${materialId}/quiz`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(options || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to generate AI quiz");
  return data;
}

export async function fetchQuizApi(quizId: string): Promise<Quiz> {
  const res = await fetch(`${API_BASE_URL}/api/v1/quizzes/${quizId}`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch quiz details");
  return data;
}

export async function submitQuizApi(
  quizId: string,
  answers: { question_id: string; selected_option: string }[]
): Promise<QuizAttemptResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/quizzes/${quizId}/submit`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ answers }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to submit quiz attempt");
  return data;
}

// Phase 7: Assessment, Adaptive Learning & Continuous Competency Update
// ──────────────────────────────────────────────────────────────────────────

export interface AssessmentEvaluateInput {
  attempt_id: string;
  skill_id?: string;
}

export interface AssessmentEvaluateResponse {
  attempt_id: string;
  skill_id: string;
  skill_name: string;
  old_level: number;
  new_level: number;
  level_changed: boolean;
  score: number;
  evidence_source: string;
  adaptive_next_difficulty: string;
  reason: string;
  updated_overall_match_percentage: number;
  updated_skills_with_gaps: number;
}

export interface AssessmentProgressResponse {
  user_id: string;
  total_assessments_taken: number;
  assessments_passed: number;
  pass_rate_percentage: number;
  average_score: number;
  learning_streak_days: number;
  current_overall_match_percentage: number;
  skills_count: number;
}

export interface CompetencyHistoryRecord {
  id: string;
  skill_id: string;
  skill_name: string;
  old_level: number;
  new_level: number;
  score: number;
  evidence_source: string;
  adaptive_next_difficulty: string;
  reason: string;
  created_at: string;
}

export interface AssessmentHistoryResponse {
  total_records: number;
  history: CompetencyHistoryRecord[];
}

export interface SkillProgressItem {
  skill_id: string;
  skill_name: string;
  category: string;
  current_level: number;
  current_level_label: string;
  required_level: number;
  required_level_label: string;
  gap: number;
  total_evaluations: number;
  last_evaluated_at?: string;
  history: CompetencyHistoryRecord[];
}

export interface CompetencyProgressResponse {
  user_id: string;
  overall_match_percentage: number;
  skills_progress: SkillProgressItem[];
}

export async function fetchAssessmentProgressApi(): Promise<AssessmentProgressResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/assessment/progress`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch assessment progress");
  return data;
}

export async function evaluateAssessmentApi(payload: AssessmentEvaluateInput): Promise<AssessmentEvaluateResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/assessment/evaluate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to evaluate assessment");
  return data;
}

export async function fetchAssessmentHistoryApi(): Promise<AssessmentHistoryResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/assessment/history`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch assessment history");
  return data;
}

export async function fetchCompetencyProgressApi(): Promise<CompetencyProgressResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/competency/progress`, { headers: getAuthHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch competency progress");
  return data;
}


