"use client";

import { Brain, Target, Award, BookOpen, TrendingUp, CheckCircle, AlertTriangle, Flame, Clock } from "lucide-react";
import { CompetencyOverview, CompetencySummary, AssessmentProgressResponse, TrainingHistory } from "@/lib/api";

interface MetricKpisProps {
  competency: CompetencyOverview | null;
  summary: CompetencySummary | null;
  progress: AssessmentProgressResponse | null;
  training: TrainingHistory[];
}

export default function MetricKpis({
  competency,
  summary,
  progress,
  training
}: MetricKpisProps) {
  const matchPct = competency?.overall_match_percentage ?? progress?.current_overall_match_percentage ?? 0;
  const skillsMet = summary?.skills_met ?? competency?.skills_met ?? 0;
  const skillsWithGaps = summary?.skills_with_gaps ?? competency?.skills_with_gaps ?? 0;
  const totalSkills = competency?.total_required_skills ?? (skillsMet + skillsWithGaps);

  const streakDays = progress?.learning_streak_days ?? 0;
  const passRate = progress?.pass_rate_percentage ?? 0;
  const totalAssessments = progress?.total_assessments_taken ?? 0;

  const completedCourses = training.filter(t => t.status === "COMPLETED");
  const totalHours = completedCourses.reduce((sum, c) => sum + (c.duration_hours || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Cadre Competency Benchmark Match */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Role Competency</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Brain className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight">{matchPct}%</span>
          <span className="text-xs text-slate-500 font-medium">Cadre Match</span>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(5, matchPct))}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Target: 100% standard</span>
            <span className="text-indigo-600 font-bold">{matchPct >= 80 ? "Cadre Ready" : "Targeted Upskilling"}</span>
          </div>
        </div>
      </div>

      {/* 2. Role Skills Breakdown (Met vs Gaps) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Skills Portfolio</span>
          <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight">{skillsMet}</span>
          <span className="text-xs text-slate-500 font-medium">/ {totalSkills} Met</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md font-bold text-[11px]">
            <CheckCircle className="w-3 h-3" />
            <span>{skillsMet} Met</span>
          </div>
          {skillsWithGaps > 0 ? (
            <div className="flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md font-bold text-[11px]">
              <AlertTriangle className="w-3 h-3" />
              <span>{skillsWithGaps} Gaps</span>
            </div>
          ) : (
            <div className="text-emerald-700 font-medium text-[11px]">No open gaps</div>
          )}
        </div>
      </div>

      {/* 3. Adaptive Learning Streak & Assessments */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Continuous Learning</span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight">{streakDays}</span>
          <span className="text-xs text-amber-700 font-bold flex items-center gap-1">
            Days Streak 🔥
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 font-medium">
          <span>{totalAssessments} Quizzes Taken</span>
          <span className="text-emerald-600 font-bold">{passRate.toFixed(0)}% Pass Rate</span>
        </div>
      </div>

      {/* 4. Training Capacity Building Hours */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Training Capacity</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 tracking-tight">{totalHours}</span>
          <span className="text-xs text-slate-500 font-medium">Hours Completed</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 font-medium">
          <span>{completedCourses.length} Programs Verified</span>
          <span className="text-indigo-600 font-semibold">iGOT & NSSTA</span>
        </div>
      </div>
    </div>
  );
}
