"use client";

import { CheckCircle2, Layers, Activity } from "lucide-react";
import { CompetencyOverview } from "@/lib/api";

interface RightAnalyticsCardsProps {
  competency: CompetencyOverview | null;
  onViewGaps?: () => void;
  onOpenCourses?: () => void;
}

export default function RightAnalyticsCards({
  competency,
  onViewGaps,
  onOpenCourses
}: RightAnalyticsCardsProps) {
  const matchPct = competency?.overall_match_percentage ?? 78.0;
  const skills = competency?.skills || [];
  const skillGaps = skills.filter(s => s.gap > 0);

  // Sort skills for Competency Distribution (highest to lowest attainment)
  const sortedSkills = [...skills].sort((a, b) => {
    const pctA = a.current_level / Math.max(1, a.required_level);
    const pctB = b.current_level / Math.max(1, b.required_level);
    return pctB - pctA;
  });

  return (
    <div className="space-y-4">
      {/* 1. Overall Competency Benchmark Card */}
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs transition-colors duration-150">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Competency Benchmark</h3>
        </div>

        <div className="bg-[#f8fafc] dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 rounded-xl p-4 space-y-2">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            OVERALL CADRE READINESS
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Senior Statistical Officer (SSO)
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
              {matchPct.toFixed(1)}% Match
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              MoSPI Cadre Baseline Met
            </span>
          </div>
        </div>
      </div>

      {/* 2. Target Skill Deficits Card */}
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs transition-colors duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Target Skill Deficits</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full font-medium">
            {skillGaps.length} Gaps
          </span>
        </div>

        <div className="space-y-2.5">
          {skillGaps.length > 0 ? (
            skillGaps.map(gap => (
              <div
                key={gap.skill_id}
                onClick={onViewGaps}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/90 hover:border-cyan-300 dark:hover:border-cyan-500/50 hover:bg-cyan-50/20 dark:hover:bg-cyan-950/20 transition cursor-pointer group"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#38bdf8] shrink-0 mt-1" />
                  <div className="truncate">
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition truncate">
                      {gap.skill_name}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">
                      Level: L{gap.current_level} / L{gap.required_level} required
                    </div>
                  </div>
                </div>

                <div className="font-mono text-xs text-rose-500 dark:text-rose-400 font-semibold shrink-0 ml-2">
                  [Deficit: -{gap.gap}]
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No skill deficits detected.</p>
          )}
        </div>
      </div>

      {/* 3. Competency Distribution Card */}
      <div className="bg-white dark:bg-[#0e1422] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs transition-colors duration-150">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Competency Distribution</h3>
        </div>

        <div className="space-y-3">
          {sortedSkills.map((skill, idx) => {
            const pct = Math.min(100, Math.round((skill.current_level / Math.max(1, skill.required_level)) * 100));
            const isTop = idx === 0;

            return (
              <div key={skill.skill_id} className="flex items-center gap-3 text-xs">
                {/* Skill Name */}
                <span className="w-36 truncate text-slate-700 dark:text-slate-300 font-medium shrink-0" title={skill.skill_name}>
                  {skill.skill_name}
                </span>

                {/* Progress Bar */}
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTop ? "bg-[#38bdf8]" : "bg-[#475569] dark:bg-slate-600"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Percentage */}
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium w-12 text-right shrink-0">
                  {pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
