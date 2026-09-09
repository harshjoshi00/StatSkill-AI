"use client";

import { useState, useEffect } from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from "recharts";
import { SkillCompetencyItem } from "@/lib/api";
import { Brain, CheckCircle2, AlertTriangle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface CompetencyRadarChartProps {
  skills: SkillCompetencyItem[];
  jobRoleTitle?: string;
  departmentName?: string;
}

export default function CompetencyRadarChart({
  skills,
  jobRoleTitle,
  departmentName
}: CompetencyRadarChartProps) {
  const [mounted, setMounted] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format data for Recharts Radar
  const chartData = skills.map(s => ({
    subject: s.skill_name.length > 22 ? `${s.skill_name.slice(0, 20)}...` : s.skill_name,
    fullName: s.skill_name,
    category: s.skill_category,
    Current: s.current_level,
    Required: s.required_level,
    gap: s.gap,
    fullMark: 5
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl shadow-xl text-xs space-y-1.5 z-50">
          <p className="font-bold text-slate-900 dark:text-white text-sm">{data.fullName}</p>
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-semibold">
            {data.category}
          </span>
          <div className="grid grid-cols-2 gap-3 pt-1 text-slate-700 dark:text-slate-300">
            <div>
              <span className="text-amber-700 dark:text-amber-400 font-semibold">Current Level:</span>{" "}
              <strong className="text-slate-900 dark:text-white">L{data.Current} / 5</strong>
            </div>
            <div>
              <span className="text-cyan-700 dark:text-cyan-400 font-semibold">Target Level:</span>{" "}
              <strong className="text-slate-900 dark:text-white">L{data.Required} / 5</strong>
            </div>
          </div>
          <div className="text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800">
            {data.gap > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Skill Deficit: -{data.gap} Level(s)
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Target Benchmark Met
              </span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#0e1422] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-6 transition-colors duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Competency Benchmark Radar</h2>
            <span className="bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold">
              MOSPI Cadre Standard
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Multidimensional radar comparing official competency level (0–5) with official requirements for{" "}
            <strong className="text-slate-800 dark:text-slate-200">{jobRoleTitle || "your role"}</strong>
            {departmentName ? ` in ${departmentName}` : ""}.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Current
          </span>
          <span className="text-slate-400">vs</span>
          <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-semibold">
            <span className="w-3 h-3 rounded-full bg-[#38bdf8] inline-block" /> Cadre Benchmark
          </span>
        </div>
      </div>

      {/* Radar Chart & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar Chart Container */}
        <div className="lg:col-span-7 h-[360px] flex items-center justify-center relative">
          {mounted && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                <PolarGrid stroke={isDark ? "#334155" : "#e2e8f0"} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: isDark ? "#94a3b8" : "#334155", fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 5]}
                  tick={{ fill: isDark ? "#64748b" : "#64748b", fontSize: 10 }}
                  stroke={isDark ? "#475569" : "#cbd5e1"}
                />
                <Radar
                  name="Current Level"
                  dataKey="Current"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.35}
                />
                <Radar
                  name="Required Level"
                  dataKey="Required"
                  stroke="#0284c7"
                  fill="#38bdf8"
                  fillOpacity={0.25}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
                  formatter={(value: string) => (
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{value}</span>
                  )}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-slate-400 flex items-center justify-center">
              Loading radar visualization...
            </div>
          )}
        </div>

        {/* Skill Breakdown List */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
            <span>Role Skills Status</span>
            <span>Current / Target</span>
          </div>

          {skills.map(s => {
            const hasGap = s.gap > 0;
            return (
              <div
                key={s.skill_id}
                className={`p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                  hasGap
                    ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                    {hasGap ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    )}
                    <span className="line-clamp-1">{s.skill_name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {s.skill_category} • {s.current_level_label}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold font-mono">
                    <span className={hasGap ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}>
                      L{s.current_level}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                    <span className="text-cyan-700 dark:text-cyan-400">L{s.required_level}</span>
                  </div>
                  <div className="text-[10px] font-bold mt-0.5">
                    {hasGap ? (
                      <span className="text-rose-600 dark:text-rose-400">-{s.gap} Gap</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Met</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
