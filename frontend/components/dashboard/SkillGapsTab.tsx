"use client";

import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { SkillCompetencyItem } from "@/lib/api";
import { Target, AlertTriangle, Info, CheckCircle2, BookOpen, Brain, Filter, ChevronRight } from "lucide-react";

interface SkillGapsTabProps {
  skills: SkillCompetencyItem[];
  onSelectSkillForCourses?: (skillId: string) => void;
  onOpenQuizStudio?: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  NO_GAP: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60",
  LOW: "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/60",
  MEDIUM: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
  HIGH: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60",
};

const PRIORITY_BADGES: Record<string, string> = {
  NONE: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  LOW: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60",
  MEDIUM: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
  HIGH: "bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800/60",
  CRITICAL: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 animate-pulse font-bold",
};

export default function SkillGapsTab({
  skills,
  onSelectSkillForCourses,
  onOpenQuizStudio
}: SkillGapsTabProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allGaps = skills.filter(s => s.gap > 0);
  const filteredGaps = filterSeverity === "ALL"
    ? allGaps
    : allGaps.filter(s => s.gap_classification === filterSeverity || s.priority === filterSeverity);

  // Bar chart data
  const barChartData = skills.map(s => ({
    name: s.skill_name.length > 18 ? `${s.skill_name.slice(0, 16)}...` : s.skill_name,
    fullName: s.skill_name,
    "Current Level": s.current_level,
    "Required Target": s.required_level,
    gap: s.gap
  }));

  return (
    <div className="space-y-6">
      {/* Comparative Level Bar Chart */}
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-4 transition-colors duration-150">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> Cadre Competency Benchmark Comparison
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Side-by-side visualization of current official proficiency versus MOSPI role targets (0 = No Knowledge, 5 = Expert).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
              <span className="w-3 h-3 bg-amber-500 rounded-sm inline-block" /> Current Level
            </span>
            <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-semibold">
              <span className="w-3 h-3 bg-[#38bdf8] rounded-sm inline-block" /> Required Target
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 5]} stroke="#64748b" fontSize={11} ticks={[0, 1, 2, 3, 4, 5]} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl text-xs space-y-1 shadow-xl">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{data.fullName}</p>
                          <div className="text-amber-700 dark:text-amber-400">Current Level: <strong>L{data["Current Level"]}</strong></div>
                          <div className="text-cyan-600 dark:text-cyan-400">Required Target: <strong>L{data["Required Target"]}</strong></div>
                          <div className="text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                            Gap Deficit: <strong className={data.gap > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}>
                              {data.gap > 0 ? `-${data.gap} Level(s)` : "Met"}
                            </strong>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Current Level" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Required Target" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800/80 p-4 rounded-2xl shadow-xs transition-colors duration-150">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Identified Skill Gaps ({allGaps.length})</h3>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "ALL", label: `All Gaps (${allGaps.length})` },
            { id: "CRITICAL", label: "Critical Priority" },
            { id: "HIGH", label: "High Severity" },
            { id: "MEDIUM", label: "Medium Severity" },
            { id: "LOW", label: "Low Severity" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterSeverity(f.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                filterSeverity === f.id
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gap Cards Grid */}
      {filteredGaps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGaps.map(gap => (
            <div
              key={gap.skill_id}
              className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition duration-150"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      {gap.skill_name}
                    </h4>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-semibold mt-1 inline-block">
                      {gap.skill_category}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${SEVERITY_COLORS[gap.gap_classification]}`}>
                      {gap.gap_classification} SEVERITY
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${PRIORITY_BADGES[gap.priority]}`}>
                      PRIORITY: {gap.priority}
                    </span>
                  </div>
                </div>

                {/* Score Level Deficit Visual */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl text-center text-xs border border-slate-200/70 dark:border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Current Level</div>
                    <div className="font-bold text-amber-700 dark:text-amber-400 text-sm">{gap.current_level} / 5</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{gap.current_level_label}</div>
                  </div>
                  <div className="border-x border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Target Level</div>
                    <div className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">{gap.required_level} / 5</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{gap.required_level_label}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Deficit Delta</div>
                    <div className="font-bold text-rose-600 dark:text-rose-400 text-sm">-{gap.gap} Level(s)</div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Needs Training</div>
                  </div>
                </div>

                {/* Explainable Diagnosis */}
                <div className="bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-900 dark:text-cyan-300">
                    <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Explainable AI Rationale
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {gap.explanation}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {onSelectSkillForCourses && (
                  <button
                    onClick={() => onSelectSkillForCourses(gap.skill_id)}
                    className="flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> View Recommended Courses <ChevronRight className="w-3 h-3" />
                  </button>
                )}
                {onOpenQuizStudio && (
                  <button
                    onClick={onOpenQuizStudio}
                    className="flex items-center gap-1 text-xs bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg transition font-semibold ml-auto shadow-xs cursor-pointer"
                  >
                    <Brain className="w-3.5 h-3.5" /> Practice AI Quiz
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-10 text-center space-y-3 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Skill Gaps Detected for Selected Filter</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Your competency scores fully satisfy the cadre benchmark requirements under this category.
          </p>
        </div>
      )}
    </div>
  );
}
