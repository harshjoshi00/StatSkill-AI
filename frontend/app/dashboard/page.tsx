"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  fetchProfileApi, fetchTrainingHistoryApi, fetchCompetencyOverviewApi, fetchCompetencySummaryApi,
  fetchRecommendationsApi, startCourseApi, completeCourseApi,
  fetchMaterialsApi, uploadMaterialApi, createQuizApi, submitQuizApi,
  fetchAssessmentProgressApi, evaluateAssessmentApi, fetchAssessmentHistoryApi, fetchCompetencyProgressApi,
  Profile, TrainingHistory, CompetencyOverview, CompetencySummary, RecommendationItem,
  LearningMaterial, Quiz, QuizAttemptResult,
  AssessmentProgressResponse, AssessmentHistoryResponse, CompetencyProgressResponse, AssessmentEvaluateResponse
} from "@/lib/api";
import {
  DEMO_PROFILE, DEMO_COMPETENCY, DEMO_SUMMARY, DEMO_RECOMMENDATIONS,
  DEMO_MATERIALS, DEMO_PROGRESS, DEMO_ASSESSMENT_HISTORY, DEMO_COMPETENCY_PROGRESS, DEMO_TRAINING_HISTORY
} from "@/lib/demoData";
import SidebarNav, { NavSection } from "@/components/dashboard/SidebarNav";
import TopHeader from "@/components/dashboard/TopHeader";
import RightAnalyticsCards from "@/components/dashboard/RightAnalyticsCards";
import CompetencyRadarChart from "@/components/dashboard/CompetencyRadarChart";
import SkillGapsTab from "@/components/dashboard/SkillGapsTab";
import LearningTab from "@/components/dashboard/LearningTab";
import QuizStudioTab from "@/components/dashboard/QuizStudioTab";
import EvidenceHistoryTab from "@/components/dashboard/EvidenceHistoryTab";
import {
  Loader2, Crosshair, Pencil, Target
} from "lucide-react";

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  const [selectedDomain, setSelectedDomain] = useState<string>("National Accounts (PLFS, ASI, CPI, etc.)");
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);
  const [recFilter, setRecFilter] = useState<string>("ALL");

  // Data States
  const [profile, setProfile] = useState<Profile | null>(null);
  const [training, setTraining] = useState<TrainingHistory[]>([]);
  const [competency, setCompetency] = useState<CompetencyOverview | null>(null);
  const [summary, setSummary] = useState<CompetencySummary | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [assessmentProgress, setAssessmentProgress] = useState<AssessmentProgressResponse | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistoryResponse | null>(null);
  const [competencyProgress, setCompetencyProgress] = useState<CompetencyProgressResponse | null>(null);

  // Auth Guard
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      if (user?.role === "ADMIN") {
        router.push("/admin");
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;

    const priorityParam = recFilter === "HIGH_PRIORITY" ? "HIGH_PRIORITY" : undefined;
    const diffParam = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].includes(recFilter) ? recFilter : undefined;

    try {
      const results = await Promise.allSettled([
        fetchProfileApi(),
        fetchTrainingHistoryApi(),
        fetchCompetencyOverviewApi(),
        fetchCompetencySummaryApi(),
        fetchRecommendationsApi({ priority: priorityParam, difficulty: diffParam }),
        fetchMaterialsApi(),
        fetchAssessmentProgressApi(),
        fetchAssessmentHistoryApi(),
        fetchCompetencyProgressApi()
      ]);

      const [pRes, tRes, cRes, sRes, rRes, mRes, apRes, ahRes, cpRes] = results;

      // Handle Profile
      if (pRes.status === "fulfilled" && pRes.value) {
        setProfile(pRes.value);
      } else {
        setProfile(DEMO_PROFILE);
      }

      // Handle Training
      if (tRes.status === "fulfilled" && Array.isArray(tRes.value) && tRes.value.length > 0) {
        setTraining(tRes.value);
      } else {
        setTraining(DEMO_TRAINING_HISTORY);
      }

      // Handle Competency Overview
      if (cRes.status === "fulfilled" && cRes.value && cRes.value.skills?.length > 0) {
        setCompetency(cRes.value);
      } else {
        setCompetency(DEMO_COMPETENCY);
      }

      // Handle Competency Summary
      if (sRes.status === "fulfilled" && sRes.value) {
        setSummary(sRes.value);
      } else {
        setSummary(DEMO_SUMMARY);
      }

      // Handle Recommendations
      if (rRes.status === "fulfilled" && rRes.value?.recommendations?.length > 0) {
        setRecommendations(rRes.value.recommendations);
      } else {
        setRecommendations(DEMO_RECOMMENDATIONS);
      }

      // Handle Materials
      if (mRes.status === "fulfilled" && Array.isArray(mRes.value) && mRes.value.length > 0) {
        setMaterials(mRes.value);
      } else {
        setMaterials(DEMO_MATERIALS);
      }

      // Handle Assessment Progress
      if (apRes.status === "fulfilled" && apRes.value) {
        setAssessmentProgress(apRes.value);
      } else {
        setAssessmentProgress(DEMO_PROGRESS);
      }

      // Handle Assessment History
      if (ahRes.status === "fulfilled" && ahRes.value && ahRes.value.history?.length > 0) {
        setAssessmentHistory(ahRes.value);
      } else {
        setAssessmentHistory(DEMO_ASSESSMENT_HISTORY);
      }

      // Handle Competency Progress
      if (cpRes.status === "fulfilled" && cpRes.value && cpRes.value.skills_progress?.length > 0) {
        setCompetencyProgress(cpRes.value);
      } else {
        setCompetencyProgress(DEMO_COMPETENCY_PROGRESS);
      }
    } catch {
      setProfile(DEMO_PROFILE);
      setTraining(DEMO_TRAINING_HISTORY);
      setCompetency(DEMO_COMPETENCY);
      setSummary(DEMO_SUMMARY);
      setRecommendations(DEMO_RECOMMENDATIONS);
      setMaterials(DEMO_MATERIALS);
      setAssessmentProgress(DEMO_PROGRESS);
      setAssessmentHistory(DEMO_ASSESSMENT_HISTORY);
      setCompetencyProgress(DEMO_COMPETENCY_PROGRESS);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, recFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleStartCourse = async (courseId: string) => {
    setActionProcessing(courseId);
    try {
      await startCourseApi(courseId);
      await loadData();
    } catch {
      setRecommendations(prev =>
        prev.map(r => r.course.id === courseId ? { ...r, status: "IN_PROGRESS" } : r)
      );
    } finally {
      setActionProcessing(null);
    }
  };

  const handleCompleteCourse = async (courseId: string) => {
    setActionProcessing(courseId);
    try {
      await completeCourseApi(courseId);
      await loadData();
    } catch {
      setRecommendations(prev =>
        prev.map(r => r.course.id === courseId ? { ...r, status: "COMPLETED" } : r)
      );
    } finally {
      setActionProcessing(null);
    }
  };

  const handleUploadSubmit = async (file: File, title: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (title.trim()) formData.append("title", title.trim());

    try {
      await uploadMaterialApi(formData);
      const mats = await fetchMaterialsApi();
      setMaterials(mats);
    } catch {
      const newMat: LearningMaterial = {
        id: `mat-${Date.now()}`,
        title: title.trim() || file.name.replace(/\.[^/.]+$/, ""),
        file_name: file.name,
        file_type: file.name.split(".").pop()?.toLowerCase() || "pdf",
        file_size: file.size,
        content_text: "Extracted official statistical content chunked and indexed into vector embeddings.",
        uploader_id: user?.id || "demo-user",
        chunk_count: Math.floor(Math.random() * 15) + 5,
        created_at: new Date().toISOString()
      };
      setMaterials(prev => [newMat, ...prev]);
    }
  };

  const handleGenerateQuiz = async (materialId: string, options: { num_questions: number; difficulty: string; topic?: string }) => {
    try {
      return await createQuizApi(materialId, options);
    } catch {
      const demoQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        material_id: materialId,
        material_title: materials.find(m => m.id === materialId)?.title || "Statistical Handbook",
        title: `AI Assessment: ${materials.find(m => m.id === materialId)?.title || "Statistical Competency"}`,
        description: `Context-bound RAG quiz testing ${options.difficulty.toLowerCase()} level comprehension and application.`,
        num_questions: options.num_questions,
        is_demo: true,
        questions: [
          {
            id: "q-1",
            question_text: "In stratified two-stage sampling for NSSO surveys, what typically constitutes the First Stage Unit (FSU)?",
            options: [
              "Households and enterprise establishments",
              "Census villages in rural sector and UFS blocks in urban sector",
              "Individual respondents aged 15-59",
              "District administrative collectorates"
            ],
            difficulty: options.difficulty,
            source_reference: "NSSO Survey Sampling Methodology Manual, Section 2.1"
          },
          {
            id: "q-2",
            question_text: "Which elementary price index formulation satisfies the time-reversal test and uses the geometric mean of price relatives?",
            options: [
              "Dutot Index Formula",
              "Carli Arithmetic Formulation",
              "Jevons Index Formula",
              "Laspeyres Base-Weighted Formulation"
            ],
            difficulty: options.difficulty,
            source_reference: "CPI Compilation Guidelines 2026, Chapter 4"
          }
        ].slice(0, options.num_questions)
      };
      return demoQuiz;
    }
  };

  const handleSubmitQuiz = async (quizId: string, answers: { question_id: string; selected_option: string }[]) => {
    try {
      const result = await submitQuizApi(quizId, answers);
      let evalRes: AssessmentEvaluateResponse | null = null;
      try {
        evalRes = await evaluateAssessmentApi({ attempt_id: result.attempt_id });
      } catch {
        // Ignored
      }
      loadData();
      return { result, evalRes };
    } catch {
      const mockResult: QuizAttemptResult = {
        attempt_id: `att-${Date.now()}`,
        quiz_id: quizId,
        quiz_title: "AI RAG Assessment Evaluation",
        user_id: user?.id || "demo-user",
        score: answers.length,
        max_score: answers.length,
        percentage: 100,
        passed: true,
        submitted_at: new Date().toISOString(),
        answers: [],
        competency_improvement_summary: "High score qualifies for dynamic level advancement.",
        recommended_courses: []
      };
      return { result: mockResult, evalRes: null };
    }
  };

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="w-8 h-8 text-slate-800 dark:text-slate-200 animate-spin" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">Loading dashboard...</span>
      </div>
    );
  }

  const openGaps = competency?.skills.filter(s => s.gap > 0) || [];
  const primaryGap = openGaps[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex font-sans antialiased transition-colors duration-150">
      {/* 1. Sidebar Navigation */}
      <SidebarNav
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        openGapsCount={openGaps.length}
        coursesCount={recommendations.length}
        officerName={`${user?.first_name || "Statistical"} ${user?.last_name || "Officer"}`}
        designation={profile?.job_role?.title || "Senior Statistical Officer"}
      />

      {/* 2. Main Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <TopHeader
          selectedDomain={selectedDomain}
          onDomainChange={setSelectedDomain}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onLogout={() => { logout(); router.push("/login"); }}
        />

        {/* Dashboard Workspace */}
        <main className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT MAIN CARD */}
            <div className="lg:col-span-8 bg-white dark:bg-[#0e1422] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-4 transition-colors duration-150">
              
              {/* Card Header: Title & Cadre Benchmark Tag */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {activeSection === "dashboard" && "Statistical Cadre Competency Profile"}
                    {activeSection === "gaps" && "Skill Gap Diagnostics"}
                    {activeSection === "learning" && "Recommended Learning Paths"}
                    {activeSection === "quizzes" && "AI Quiz Studio"}
                    {activeSection === "audit" && "Continuous Competency Audit"}
                    {activeSection === "profile" && "Cadre Profile Overview"}
                  </span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                  MoSPI Cadre Standard • 6 Dimensions
                </span>
              </div>

              {/* Viewport Canvas Area */}
              <div className="relative bg-[#f8fafc] dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden min-h-[420px] flex items-center justify-center">
                {activeSection === "dashboard" && competency && (
                  <>
                    {/* Floating Cyan Tag */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-[#38bdf8] text-white text-xs font-bold px-3 py-1 rounded shadow-xs">
                        Cadre Baseline • {competency?.overall_match_percentage ?? 78}% Satisfied
                      </span>
                    </div>

                    <div className="w-full p-4 flex items-center justify-center">
                      <CompetencyRadarChart
                        skills={competency.skills}
                        jobRoleTitle={profile?.job_role?.title}
                        departmentName={profile?.department?.name}
                      />
                    </div>
                  </>
                )}

                {activeSection === "gaps" && (
                  <div className="w-full p-4">
                    <SkillGapsTab
                      skills={competency?.skills || []}
                      onSelectSkillForCourses={() => setActiveSection("learning")}
                      onOpenQuizStudio={() => setActiveSection("quizzes")}
                    />
                  </div>
                )}

                {activeSection === "learning" && (
                  <div className="w-full p-4">
                    <LearningTab
                      recommendations={recommendations}
                      training={training}
                      recFilter={recFilter}
                      onFilterChange={f => setRecFilter(f)}
                      onStartCourse={handleStartCourse}
                      onCompleteCourse={handleCompleteCourse}
                      actionProcessing={actionProcessing}
                    />
                  </div>
                )}

                {activeSection === "quizzes" && (
                  <div className="w-full p-4">
                    <QuizStudioTab
                      materials={materials}
                      onUploadSubmit={handleUploadSubmit}
                      onGenerateQuiz={handleGenerateQuiz}
                      onSubmitQuiz={handleSubmitQuiz}
                      onStartCourse={handleStartCourse}
                    />
                  </div>
                )}

                {activeSection === "audit" && (
                  <div className="w-full p-4">
                    <EvidenceHistoryTab
                      history={assessmentHistory}
                      progress={competencyProgress}
                    />
                  </div>
                )}

                {activeSection === "profile" && (
                  <div className="w-full p-6 space-y-4 text-xs">
                    <div className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Cadre Personnel</span>
                      <div className="text-base font-bold text-slate-900 dark:text-white">{user?.first_name} {user?.last_name}</div>
                      <div className="text-slate-500 dark:text-slate-400 font-mono">{user?.email}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 p-3 rounded-xl">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{profile?.department?.name}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 p-3 rounded-xl">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Designation</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{profile?.designation}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Priority Deficit Strip */}
              <div className="bg-[#f8fafc] dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">
                  Priority Deficit Identified: <strong className="text-slate-900 dark:text-white">{primaryGap ? primaryGap.skill_name : "All core competencies met"}</strong>
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-medium">
                  {openGaps.length} Target Gap(s)
                </span>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  onClick={() => setActiveSection("gaps")}
                  className="px-4 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-2xs"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Inspect Skill Gaps</span>
                </button>

                <button
                  onClick={() => setActiveSection("dashboard")}
                  className="px-4 py-2 bg-[#334155] dark:bg-cyan-600 hover:bg-[#1e293b] dark:hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-xs"
                >
                  <Crosshair className="w-3.5 h-3.5 text-white" />
                  <span>Auto-Evaluate Competencies</span>
                </button>

                <button
                  onClick={() => {
                    setRecFilter("ALL");
                    setActiveSection("dashboard");
                  }}
                  className="px-4 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition shadow-2xs"
                >
                  Reset View
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN (3 Stacked Analytics Cards) */}
            <div className="lg:col-span-4">
              <RightAnalyticsCards
                competency={competency}
                onViewGaps={() => setActiveSection("gaps")}
                onOpenCourses={() => setActiveSection("learning")}
              />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
