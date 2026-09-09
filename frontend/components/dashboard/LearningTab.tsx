"use client";

import { useState } from "react";
import { RecommendationItem, TrainingHistory } from "@/lib/api";
import {
  GraduationCap, BookOpen, Sparkles, Clock, CheckCircle2,
  ExternalLink, Play, Check, Filter, Loader2, Award, Building2
} from "lucide-react";

interface LearningTabProps {
  recommendations: RecommendationItem[];
  training: TrainingHistory[];
  recFilter: string;
  onFilterChange: (filter: string) => void;
  onStartCourse: (courseId: string) => Promise<void>;
  onCompleteCourse: (courseId: string) => Promise<void>;
  actionProcessing: string | null;
}

const PRIORITY_BADGES: Record<string, string> = {
  NONE: "bg-slate-100 text-slate-600 border-slate-200",
  LOW: "bg-blue-50 text-blue-700 border-blue-200",
  MEDIUM: "bg-amber-50 text-amber-800 border-amber-200",
  HIGH: "bg-orange-50 text-orange-800 border-orange-200",
  CRITICAL: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-bold",
};

export default function LearningTab({
  recommendations,
  training,
  recFilter,
  onFilterChange,
  onStartCourse,
  onCompleteCourse,
  actionProcessing
}: LearningTabProps) {
  const [providerFilter, setProviderFilter] = useState<string>("ALL");

  const providers = Array.from(new Set(recommendations.map(r => r.course.provider).filter(Boolean)));

  const filteredRecs = recommendations.filter(r => {
    if (providerFilter !== "ALL" && r.course.provider !== providerFilter) return false;
    return true;
  });

  const completedCourses = training.filter(t => t.status === "COMPLETED");

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Personalized Learning & Capacity Building</h3>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold">
                {filteredRecs.length} Courses
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              AI hybrid multi-factor ranking matching active role skill gaps, official mandate, and difficulty fit (iGOT Karmayogi, NSSTA, SWAYAM).
            </p>
          </div>

          {/* Difficulty / Priority Filter */}
          <div className="flex items-center gap-1.5 flex-wrap bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
            {[
              { id: "ALL", label: "All Priorities" },
              { id: "HIGH_PRIORITY", label: "Critical / High Gaps" },
              { id: "BEGINNER", label: "Beginner" },
              { id: "INTERMEDIATE", label: "Intermediate" },
              { id: "ADVANCED", label: "Advanced" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => onFilterChange(f.id)}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  recFilter === f.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Provider Filter Chips */}
        {providers.length > 1 && (
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-semibold">Provider:</span>
            <button
              onClick={() => setProviderFilter("ALL")}
              className={`px-2.5 py-0.5 rounded-md transition ${
                providerFilter === "ALL" ? "bg-slate-800 text-white font-semibold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Providers
            </button>
            {providers.map(p => (
              <button
                key={p}
                onClick={() => setProviderFilter(p)}
                className={`px-2.5 py-0.5 rounded-md transition ${
                  providerFilter === p ? "bg-slate-800 text-white font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Courses Grid */}
      {filteredRecs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecs.map(rec => {
            const isProc = actionProcessing === rec.course.id;
            return (
              <div
                key={rec.course.id}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-md font-mono font-bold text-[11px]">
                      {rec.course.provider}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {rec.gap_priority !== "NONE" && (
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${PRIORITY_BADGES[rec.gap_priority]}`}>
                          {rec.gap_priority} PRIORITY
                        </span>
                      )}
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold">
                        {rec.course.difficulty}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-base leading-snug">{rec.course.title}</h4>
                    {rec.course.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{rec.course.description}</p>
                    )}
                  </div>

                  {/* Benchmark & Target Skill Box */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">Target Skill:</span>
                      <span className="font-bold text-indigo-700">{rec.skill_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">Competency Jump:</span>
                      <span className="font-semibold text-slate-700">
                        L{rec.current_level} → <span className="text-emerald-600 font-bold">L{rec.required_level}</span>
                      </span>
                    </div>
                  </div>

                  {/* Match Relevance Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 font-medium flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Match Relevance
                      </span>
                      <span className="font-mono font-bold text-indigo-700 text-sm">{rec.match_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${rec.match_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Match Reasons */}
                  {rec.match_reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {rec.match_reasons.map((reason, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-medium">
                          ✓ {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer & Enrollment Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{rec.course.duration_hours} Hours</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {rec.course.url && (
                      <a
                        href={rec.course.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded hover:bg-slate-100 transition"
                        title="Open External Course Portal"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {rec.status === "COMPLETED" ? (
                      <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : rec.status === "IN_PROGRESS" ? (
                      <button
                        onClick={() => onCompleteCourse(rec.course.id)}
                        disabled={isProc}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-xs"
                      >
                        {isProc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Mark Completed
                      </button>
                    ) : (
                      <button
                        onClick={() => onStartCourse(rec.course.id)}
                        disabled={isProc}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-xs"
                      >
                        {isProc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Start Course
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center space-y-3 shadow-xs">
          <BookOpen className="w-12 h-12 text-indigo-500 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-slate-900">No Recommendations Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your priority or provider filters to explore courses across other competency areas.
          </p>
        </div>
      )}

      {/* Completed Training Records Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> Completed Official Training Records ({completedCourses.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">Verified Cadre Certifications</span>
        </div>

        {training.length > 0 ? (
          <div className="space-y-2">
            {training.map(t => (
              <div
                key={t.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs gap-2"
              >
                <div>
                  <div className="font-bold text-slate-900 text-sm">{t.course_name}</div>
                  <div className="text-slate-500 mt-0.5 flex items-center gap-2">
                    <span className="text-indigo-700 font-mono font-semibold">{t.provider}</span>
                    <span>•</span>
                    <span>{t.duration_hours} Training Hours</span>
                    {t.completion_date && (
                      <>
                        <span>•</span>
                        <span>Completed: {t.completion_date}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      t.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {t.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center">No official training records recorded yet.</p>
        )}
      </div>
    </div>
  );
}
