"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  fetchAdminAnalyticsApi,
  fetchAdminCompetencyOverviewApi,
  fetchTrainingEffectivenessApi,
  fetchAdminPredictionsApi,
  fetchWorkforceSummaryApi,
  AdminAnalyticsResponse,
  AdminCompetencyOverview,
  TrainingEffectivenessResponse,
  AdminPredictionsResponse,
  WorkforceSummaryResponse
} from "@/lib/api";
import {
  Sparkles, LogOut, Shield, Users, Building2, Layers,
  BookOpen, TrendingUp, Brain, BarChart3, Target, Loader2,
  AlertCircle, AlertTriangle, CheckCircle2, Award, Zap, ChevronRight, Activity, Filter, RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminDashboardPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"overview" | "depts_roles" | "training" | "ml_predictions" | "skill_gaps">("overview");

  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [competencyOverview, setCompetencyOverview] = useState<AdminCompetencyOverview | null>(null);
  const [trainingEff, setTrainingEff] = useState<TrainingEffectivenessResponse | null>(null);
  const [predictions, setPredictions] = useState<AdminPredictionsResponse | null>(null);
  const [workforceSummary, setWorkforceSummary] = useState<WorkforceSummaryResponse | null>(null);

  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setError("");
      const [an, comp, tr, pred, wf] = await Promise.all([
        fetchAdminAnalyticsApi(),
        fetchAdminCompetencyOverviewApi(),
        fetchTrainingEffectivenessApi(),
        fetchAdminPredictionsApi(),
        fetchWorkforceSummaryApi()
      ]);
      setAnalytics(an);
      setCompetencyOverview(comp);
      setTrainingEff(tr);
      setPredictions(pred);
      setWorkforceSummary(wf);
    } catch (e: any) {
      setError(e.message || "Failed to load administrator console metrics");
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) { router.push("/login"); return; }
      if (user?.role !== "ADMIN") { router.push("/dashboard"); return; }
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      loadData();
    }
  }, [isAuthenticated, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (isLoading || loadingData) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-3">
      <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
      <span className="text-sm font-medium text-slate-300">Loading Workforce Analytics & Machine Learning Models...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-amber-400/10 p-2 rounded-lg border border-amber-400/20">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-lg">StatSkill AI</span>
              <span className="bg-amber-500/10 text-amber-400 text-xs font-semibold px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Admin Console
              </span>
            </div>
            <p className="text-[11px] text-slate-400">MOSPI Statistical Cadre Competency Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
            <span>Refresh</span>
          </button>
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />
          <span className="text-xs text-slate-400 hidden sm:block">
            {user?.first_name} {user?.last_name}
          </span>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-300 transition bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/50"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Title & Readiness Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 p-6 rounded-2xl border border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Workforce Intelligence & ML Prediction Console
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time database metrics, department readiness, training efficacy, and explainable ML risk models.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-3 rounded-xl border border-indigo-500/20">
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase font-semibold">Cadre Readiness Score</div>
              <div className="text-2xl font-extrabold text-indigo-400">
                {analytics?.average_competency_match ?? 0}%
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Award className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-800 text-rose-300 text-sm px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Top 8 Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-indigo-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Officials</span>
              <Users className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-white">{analytics?.total_employees ?? 0}</div>
            <p className="text-[10px] text-slate-400 truncate">Total Cadre</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-cyan-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Depts</span>
              <Building2 className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-cyan-300">{analytics?.total_departments ?? 0}</div>
            <p className="text-[10px] text-slate-400 truncate">Departments</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Roles</span>
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-purple-300">{analytics?.total_roles ?? 0}</div>
            <p className="text-[10px] text-slate-400 truncate">Job Titles</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Avg Match</span>
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-emerald-300">{analytics?.average_competency_match ?? 0}%</div>
            <p className="text-[10px] text-slate-400 truncate">Competency</p>
          </div>

          <div className="bg-slate-800/80 border border-amber-900/60 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Skill Gaps</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-amber-300">{analytics?.total_open_skill_gaps ?? 0}</div>
            <p className="text-[10px] text-slate-400 truncate">Total Open Gaps</p>
          </div>

          <div className="bg-slate-800/80 border border-rose-900/60 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Critical</span>
              <Target className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-rose-300">{analytics?.high_critical_gaps ?? 0}</div>
            <p className="text-[10px] text-slate-400 truncate">High Priority</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-blue-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Trainings</span>
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-blue-300">{analytics?.training_completion_rate ?? 0}%</div>
            <p className="text-[10px] text-slate-400 truncate">Completion Rate</p>
          </div>

          <div className="bg-slate-800/80 border border-teal-900/60 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-teal-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Quiz Pass</span>
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-teal-300">{analytics?.quiz_pass_rate ?? 0}%</div>
            <p className="text-[10px] text-slate-400 truncate">Assessment Pass</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-800 gap-2 pb-1">
          {[
            { id: "overview", label: "Workforce Overview", icon: Activity },
            { id: "depts_roles", label: "Departments & Roles", icon: Building2 },
            { id: "training", label: "Training Effectiveness", icon: BookOpen },
            { id: "ml_predictions", label: "ML Risk Predictions", icon: Brain },
            { id: "skill_gaps", label: "Top Missing Skills", icon: Target },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-semibold text-xs transition border-b-2 whitespace-nowrap ${
                  isActive
                    ? "border-amber-400 text-amber-400 bg-slate-800/80"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === "ml_predictions" && (
                  <span className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0.5 rounded font-mono border border-purple-500/30">
                    {predictions?.model_type || "ML"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: WORKFORCE OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Executive Recommendations Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-white flex items-center gap-2 text-base">
                <Brain className="w-5 h-5 text-amber-400" /> Executive Strategic Insights & Recommendations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {workforceSummary?.key_recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Workforce Health Metrics
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50">
                      <div className="text-slate-400">Total Quiz Attempts</div>
                      <div className="text-lg font-bold text-white mt-1">{analytics?.total_quiz_attempts}</div>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50">
                      <div className="text-slate-400">Avg Quiz Score</div>
                      <div className="text-lg font-bold text-cyan-400 mt-1">{analytics?.average_quiz_score}%</div>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50">
                      <div className="text-slate-400">High Risk Officials</div>
                      <div className="text-lg font-bold text-rose-400 mt-1">{predictions?.high_risk_count ?? 0} ({workforceSummary?.high_risk_employee_pct}%)</div>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/50">
                      <div className="text-slate-400">Training Completed</div>
                      <div className="text-lg font-bold text-emerald-400 mt-1">{analytics?.training_completed_count}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recharts: Department Overview Bar Chart */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-white flex items-center gap-2 text-base">
                <BarChart3 className="w-5 h-5 text-cyan-400" /> Department Competency Match Comparison
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.department_breakdown || []} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="department_name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Bar dataKey="average_match_percentage" name="Avg Competency Match %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="employees_with_gaps" name="Officials With Skill Gaps" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEPARTMENTS & ROLES */}
        {activeTab === "depts_roles" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Summary Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-white flex items-center gap-2 text-base">
                <Building2 className="w-5 h-5 text-cyan-400" /> Department Readiness Breakdown
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Total Officials</th>
                      <th className="py-3 px-4">With Gaps</th>
                      <th className="py-3 px-4">Avg Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {competencyOverview?.department_summary.map((dept) => (
                      <tr key={dept.department_id} className="hover:bg-slate-750/50">
                        <td className="py-3 px-4 font-medium text-white">{dept.department_name}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{dept.department_code}</td>
                        <td className="py-3 px-4 text-slate-300 font-semibold">{dept.total_employees}</td>
                        <td className="py-3 px-4 font-bold text-amber-400">{dept.employees_with_gaps}</td>
                        <td className="py-3 px-4 font-bold text-indigo-400">{dept.average_match_percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Role Summary Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-white flex items-center gap-2 text-base">
                <Shield className="w-5 h-5 text-indigo-400" /> Job Role Skill Requirements & Deficits
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Job Role</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Assigned</th>
                      <th className="py-3 px-4">Required Skills</th>
                      <th className="py-3 px-4">Total Gaps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {competencyOverview?.role_summary.map((role) => (
                      <tr key={role.role_id} className="hover:bg-slate-750/50">
                        <td className="py-3 px-4 font-medium text-white">{role.role_title}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{role.role_code}</td>
                        <td className="py-3 px-4 text-slate-300 font-semibold">{role.total_employees}</td>
                        <td className="py-3 px-4 text-indigo-300 font-semibold">{role.total_requirements}</td>
                        <td className="py-3 px-4 font-bold text-rose-400">{role.total_gaps}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRAINING EFFECTIVENESS */}
        {activeTab === "training" && (
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white flex items-center gap-2 text-base">
                  <BookOpen className="w-5 h-5 text-blue-400" /> Course Efficacy & Competency Gain Analysis
                </h2>
                <span className="text-xs text-slate-400">
                  Overall Competency Gain: <strong className="text-emerald-400">+{trainingEff?.overall_avg_gain} level(s)</strong>
                </span>
              </div>

              {trainingEff && trainingEff.courses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-700">
                      <tr>
                        <th className="py-3 px-4">Course Title</th>
                        <th className="py-3 px-4">Provider</th>
                        <th className="py-3 px-4">Enrolled / Completed</th>
                        <th className="py-3 px-4">Completion %</th>
                        <th className="py-3 px-4">Avg Quiz Score</th>
                        <th className="py-3 px-4">Competency Gain</th>
                        <th className="py-3 px-4">Effectiveness Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {trainingEff.courses.map((course) => (
                        <tr key={course.course_id} className="hover:bg-slate-750/50">
                          <td className="py-3 px-4 font-semibold text-white">{course.course_title}</td>
                          <td className="py-3 px-4 text-slate-400">{course.provider}</td>
                          <td className="py-3 px-4 text-slate-300 font-mono">
                            {course.completed_count} / {course.enrolled_count}
                          </td>
                          <td className="py-3 px-4 font-bold text-blue-400">{course.completion_rate}%</td>
                          <td className="py-3 px-4 font-bold text-teal-300">{course.avg_quiz_score}%</td>
                          <td className="py-3 px-4 font-bold text-emerald-400">+{course.competency_gain_avg} lvl</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded font-bold text-[11px] ${
                              course.effectiveness_score >= 80 ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                              course.effectiveness_score >= 60 ? "bg-amber-950 text-amber-300 border border-amber-800" :
                              "bg-rose-950 text-rose-300 border border-rose-800"
                            }`}>
                              {course.effectiveness_score} / 100
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">No active training courses evaluated yet.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: ML RISK PREDICTIONS */}
        {activeTab === "ml_predictions" && (
          <div className="space-y-6">
            {/* Model Metadata Header */}
            <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-800/60 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h2 className="font-bold text-white text-base">
                    Explainable ML Workforce Training-Risk Engine
                  </h2>
                  <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-mono px-2 py-0.5 rounded">
                    {predictions?.model_type}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Predicts training priority risk based on competency match, gaps, assessment scores, and training history. Strictly separated from direct competency level edits.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Model Accuracy</span>
                  <span className="text-emerald-400 font-bold text-sm">{(predictions?.model_accuracy ?? 0) * 100}%</span>
                </div>
                <div className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">High Risk</span>
                  <span className="text-rose-400 font-bold text-sm">{predictions?.high_risk_count}</span>
                </div>
                <div className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Medium Risk</span>
                  <span className="text-amber-400 font-bold text-sm">{predictions?.medium_risk_count}</span>
                </div>
              </div>
            </div>

            {/* Predictions Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> Employee Training Priority & Risk Forecasts
              </h3>

              {predictions && predictions.predictions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-700">
                      <tr>
                        <th className="py-3 px-4">Official Name</th>
                        <th className="py-3 px-4">Department / Role</th>
                        <th className="py-3 px-4">Match %</th>
                        <th className="py-3 px-4">Open Gaps</th>
                        <th className="py-3 px-4">Risk Level</th>
                        <th className="py-3 px-4">Risk Prob</th>
                        <th className="py-3 px-4">Top Contributing Factors</th>
                        <th className="py-3 px-4">Recommended Intervention</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {predictions.predictions.map((p) => (
                        <tr key={p.user_id} className="hover:bg-slate-750/50">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{p.employee_name}</div>
                            <div className="text-[11px] text-slate-400">{p.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-200">{p.department_name || "Unassigned"}</div>
                            <div className="text-[11px] text-slate-400">{p.job_role_title || "Official"}</div>
                          </td>
                          <td className="py-3 px-4 font-bold text-indigo-400">{p.overall_match_pct}%</td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-900 px-2 py-0.5 rounded font-mono text-amber-300 font-bold border border-slate-700">
                              {p.open_gaps_count} gap(s)
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase ${
                              p.risk_level === "HIGH" ? "bg-rose-950 text-rose-300 border border-rose-800" :
                              p.risk_level === "MEDIUM" ? "bg-amber-950 text-amber-300 border border-amber-800" :
                              "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            }`}>
                              {p.risk_level} RISK
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-purple-300">
                            {(p.risk_probability * 100).toFixed(0)}%
                          </td>
                          <td className="py-3 px-4 space-y-1 max-w-xs">
                            {p.contributing_factors.map((factor, i) => (
                              <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1">
                                <span className="text-amber-400 font-bold">•</span>
                                <span>{factor}</span>
                              </div>
                            ))}
                          </td>
                          <td className="py-3 px-4 text-emerald-300 text-[11px] max-w-xs leading-relaxed">
                            {p.recommended_action}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">No employee predictions generated yet.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: TOP MISSING SKILLS */}
        {activeTab === "skill_gaps" && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2 text-base">
                <Target className="w-5 h-5 text-amber-400" /> Cadre-Wide Missing Skills & Deficit Severity
              </h2>
              <span className="text-xs text-slate-400">Ranked by affected official count</span>
            </div>

            {competencyOverview && competencyOverview.most_common_skill_gaps.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Skill Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Affected Officials</th>
                      <th className="py-3 px-4">Average Deficit</th>
                      <th className="py-3 px-4">Importance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {competencyOverview.most_common_skill_gaps.map((item) => (
                      <tr key={item.skill_id} className="hover:bg-slate-750/50">
                        <td className="py-3 px-4 font-semibold text-white">{item.skill_name}</td>
                        <td className="py-3 px-4 text-slate-400">{item.skill_category}</td>
                        <td className="py-3 px-4">
                          <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-bold">
                            {item.gap_count} official(s)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-rose-300 font-mono font-bold">-{item.average_gap} level(s)</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            item.importance === "CRITICAL" ? "bg-rose-950 text-rose-300 border border-rose-800" :
                            item.importance === "HIGH" ? "bg-purple-950 text-purple-300 border border-purple-800" :
                            "bg-indigo-950 text-indigo-300 border border-indigo-800"
                          }`}>
                            {item.importance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No missing skill gaps identified across the cadre.</p>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
