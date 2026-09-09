"use client";

import { AssessmentHistoryResponse, CompetencyProgressResponse } from "@/lib/api";
import { Clock, TrendingUp, ShieldCheck, Target, Award, Calendar, ChevronRight, CheckCircle2 } from "lucide-react";

interface EvidenceHistoryTabProps {
  history: AssessmentHistoryResponse | null;
  progress: CompetencyProgressResponse | null;
}

export default function EvidenceHistoryTab({
  history,
  progress
}: EvidenceHistoryTabProps) {
  const records = history?.history || [];
  const skillsProgress = progress?.skills_progress || [];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">Continuous Competency Audit Trail</h3>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold">
              Evidence Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official immutable audit trail tracking score-driven skill advancements, adaptive assessment milestones, and evaluation reasons.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs shrink-0">
          <div className="text-center">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Audit Records</span>
            <span className="font-black text-slate-900 text-base">{records.length}</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="text-center">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Skills Tracked</span>
            <span className="font-black text-emerald-600 text-base">{skillsProgress.length}</span>
          </div>
        </div>
      </div>

      {/* Chronological Audit Log */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-4 h-4 text-amber-500" /> Chronological Evidence Records
        </h4>

        {records.length > 0 ? (
          <div className="space-y-3">
            {records.map(rec => {
              const levelIncreased = rec.new_level > rec.old_level;
              return (
                <div
                  key={rec.id}
                  className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-4 text-xs space-y-2 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{rec.skill_name}</span>
                      <span className="bg-white text-slate-700 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-200 font-semibold">
                        Level {rec.old_level} →{" "}
                        <strong className={levelIncreased ? "text-emerald-700 font-bold" : "text-slate-900"}>
                          Level {rec.new_level}
                        </strong>
                      </span>
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold font-mono text-[10px] px-2 py-0.5 rounded">
                        Score: {rec.score}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(rec.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="text-slate-700 leading-relaxed text-xs">{rec.reason}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 font-medium">
                    <span>
                      Evidence Source: <strong className="text-slate-800">{rec.evidence_source}</strong>
                    </span>
                    <span>
                      Adaptive Next Difficulty:{" "}
                      <strong className="text-indigo-700">{rec.adaptive_next_difficulty}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-8 text-center">No competency evaluation records recorded yet.</p>
        )}
      </div>

      {/* Skill-by-Skill Progression Cards */}
      {skillsProgress.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Target className="w-4 h-4 text-indigo-600" /> Skill Competency Milestones & Evolution
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skillsProgress.map(sp => (
              <div
                key={sp.skill_id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{sp.skill_name}</h5>
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-semibold">{sp.category}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs font-bold text-indigo-700">
                      Level {sp.current_level} / {sp.required_level}
                    </span>
                    <div className="text-[10px] text-slate-500">{sp.current_level_label}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (sp.current_level / Math.max(1, sp.required_level)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>Gap: {sp.gap > 0 ? `${sp.gap} level(s)` : "Cadre Benchmark Met"}</span>
                    <span>Evaluations: {sp.total_evaluations}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
