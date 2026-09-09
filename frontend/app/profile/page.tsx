"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  fetchProfileApi, fetchTrainingHistoryApi, fetchSkillsApi,
  updateProfileApi, fetchDepartmentsApi, fetchRolesApi,
  extractSkillsApi, fetchAiSuggestionsApi, acceptSuggestionApi, rejectSuggestionApi,
  Profile, TrainingHistory, Skill, Department, JobRole,
  ExtractResponse, AiSkillSuggestion, SuggestionsListResponse,
} from "@/lib/api";
import {
  Sparkles, LogOut, User, Save, Loader2, CheckCircle, ChevronLeft,
  Brain, Lightbulb, X, Check, AlertTriangle, RefreshCw, Info
} from "lucide-react";


const SKILL_LEVEL_LABELS = ["No Knowledge", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"];

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [training, setTraining] = useState<TrainingHistory[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    designation: "", department_id: "", job_role_id: "",
    education: "", years_of_experience: 0,
    current_assignment: "", professional_summary: "",
    selectedSkills: {} as Record<string, number>
  });

  // AI Skill Discovery state
  const [aiText, setAiText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<ExtractResponse | null>(null);
  const [suggestions, setSuggestions] = useState<AiSkillSuggestion[]>([]);
  const [acceptLevels, setAcceptLevels] = useState<Record<string, number>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        fetchProfileApi(), fetchTrainingHistoryApi(),
        fetchSkillsApi(), fetchDepartmentsApi(), fetchRolesApi(),
        fetchAiSuggestionsApi()
      ]).then(([p, t, s, d, r, sug]) => {
        setProfile(p); setTraining(t); setAllSkills(s); setDepartments(d); setRoles(r);
        setSuggestions(sug.suggestions || []);
        const skillMap: Record<string, number> = {};
        p.skills.forEach(es => { skillMap[es.skill_id] = es.current_level; });
        setForm({
          designation: p.designation || "",
          department_id: p.department?.id || "",
          job_role_id: p.job_role?.id || "",
          education: p.education || "",
          years_of_experience: p.years_of_experience,
          current_assignment: p.current_assignment || "",
          professional_summary: p.professional_summary || "",
          selectedSkills: skillMap
        });
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const updated = await updateProfileApi({
        ...form,
        department_id: form.department_id || undefined,
        job_role_id: form.job_role_id || undefined,
        skills: Object.entries(form.selectedSkills).map(([skill_id, current_level]) => ({
          skill_id, current_level, source: "SELF_ASSESSMENT"
        }))
      });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleExtractSkills = async () => {
    if (!aiText.trim()) return;
    setExtracting(true);
    try {
      const res = await extractSkillsApi(aiText);
      setExtractResult(res);
      const updatedSug = await fetchAiSuggestionsApi();
      setSuggestions(updatedSug.suggestions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setExtracting(false);
    }
  };

  const handleAcceptSuggestion = async (sugId: string) => {
    const level = acceptLevels[sugId] ?? 1;
    setProcessingId(sugId);
    try {
      await acceptSuggestionApi(sugId, level);
      const [p, sug] = await Promise.all([fetchProfileApi(), fetchAiSuggestionsApi()]);
      setProfile(p);
      setSuggestions(sug.suggestions || []);
      const skillMap: Record<string, number> = {};
      p.skills.forEach(es => { skillMap[es.skill_id] = es.current_level; });
      setForm(prev => ({ ...prev, selectedSkills: skillMap }));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSuggestion = async (sugId: string) => {
    setProcessingId(sugId);
    try {
      await rejectSuggestionApi(sugId);
      const sug = await fetchAiSuggestionsApi();
      setSuggestions(sug.suggestions || []);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  const skillsByCategory = allSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="bg-slate-950 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <span className="font-bold text-white">StatSkill AI</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400 text-sm flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> My Profile
        </span>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1 transition">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Link>
          <button onClick={() => { logout(); router.push("/login"); }}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{user?.first_name} {user?.last_name}</h1>
            <p className="text-slate-400 text-sm">{user?.email} • {user?.role}</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
          </button>
        </div>

        {/* Professional Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">Professional Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Designation</label>
              <input type="text" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Education</label>
              <input type="text" value={form.education} onChange={e => setForm({ ...form, education: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Department</label>
              <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Job Role</label>
              <select value={form.job_role_id} onChange={e => setForm({ ...form, job_role_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select role</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Years of Experience</label>
              <input type="number" min={0} max={40} value={form.years_of_experience}
                onChange={e => setForm({ ...form, years_of_experience: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Current Assignment</label>
            <textarea rows={2} value={form.current_assignment} onChange={e => setForm({ ...form, current_assignment: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Professional Summary</label>
            <textarea rows={3} value={form.professional_summary} onChange={e => setForm({ ...form, professional_summary: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
        </div>

        {/* Skills Editor */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-5">
          <h2 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">Skill Self-Assessment</h2>
          {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
            <div key={cat} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{cat.replace("_", " ")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {catSkills.map(skill => {
                  const level = form.selectedSkills[skill.id] ?? 0;
                  return (
                    <div key={skill.id} className="bg-slate-900 border border-slate-700/50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300 font-medium">{skill.name}</span>
                        <span className="text-xs text-indigo-400 font-semibold">{SKILL_LEVEL_LABELS[level]}</span>
                      </div>
                      <input type="range" min={0} max={5} value={level}
                        onChange={e => setForm({ ...form, selectedSkills: { ...form.selectedSkills, [skill.id]: parseInt(e.target.value) } })}
                        className="w-full accent-indigo-500" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* AI Skill Discovery Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <h2 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">AI Skill Discovery</h2>
            </div>
            <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> Semantic Matching
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Paste your project experience, resume snippet, or assignment details. Our semantic matching engine will extract key skills and suggest matches. You must select your proficiency level before accepting.
          </p>

          <div className="space-y-3">
            <textarea
              rows={3}
              placeholder="e.g., Developed machine learning models using Python and PyTorch for statistical analysis and time series forecasting..."
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleExtractSkills}
                disabled={extracting || !aiText.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
              >
                {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                {extracting ? "Extracting & Matching..." : "Extract Skills with AI"}
              </button>
            </div>
          </div>

          {/* Extraction Results */}
          {extractResult && (
            <div className="mt-4 pt-4 border-t border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Extracted {extractResult.phrases_extracted} phrases ({extractResult.matches_above_threshold} matched)</span>
                <span className="text-slate-500">Source: {extractResult.model_used}</span>
              </div>

              {extractResult.matches.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No skills matched above threshold.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {extractResult.matches.map(m => (
                    <div key={m.extracted_skill} className="bg-slate-900/90 border border-slate-700/60 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{m.matched_skill_name || m.extracted_skill}</span>
                          {m.above_threshold ? (
                            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/50 px-1.5 py-0.5 rounded font-mono">Matched</span>
                          ) : (
                            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/50 px-1.5 py-0.5 rounded font-mono">Below Threshold</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>Phrase: &ldquo;{m.extracted_skill}&rdquo;</span>
                          <span>•</span>
                          <span>Source: {m.source}</span>
                        </div>
                        {/* Confidence bar */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.round(m.confidence * 100)}%` }} />
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">{(m.confidence * 100).toFixed(0)}% conf</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Suggestions List */}
          {suggestions.filter(s => s.status === "PENDING").length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Pending Suggestions Requiring Confirmation ({suggestions.filter(s => s.status === "PENDING").length})
              </h3>
              <div className="space-y-2.5">
                {suggestions.filter(s => s.status === "PENDING").map(sug => {
                  const matchedSkill = allSkills.find(s => s.id === sug.matched_skill_id);
                  const selectedLvl = acceptLevels[sug.id] ?? 1;
                  const isProc = processingId === sug.id;
                  return (
                    <div key={sug.id} className="bg-slate-900 border border-amber-900/30 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-200">{matchedSkill?.name || sug.extracted_skill}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">{(sug.confidence * 100).toFixed(0)}% match</span>
                        </div>
                        {sug.source_text_snippet && (
                          <p className="text-xs text-slate-400 italic">&ldquo;{sug.source_text_snippet}&rdquo;</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                          <label className="text-xs text-slate-400 font-medium">Level:</label>
                          <select
                            value={selectedLvl}
                            onChange={e => setAcceptLevels({ ...acceptLevels, [sug.id]: parseInt(e.target.value) })}
                            className="bg-slate-900 text-xs text-indigo-300 font-medium focus:outline-none rounded px-1 py-0.5"
                          >
                            {[1, 2, 3, 4, 5].map(lvl => (
                              <option key={lvl} value={lvl}>{lvl} - {SKILL_LEVEL_LABELS[lvl]}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => handleAcceptSuggestion(sug.id)}
                          disabled={isProc}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          {isProc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Accept
                        </button>
                        <button
                          onClick={() => handleRejectSuggestion(sug.id)}
                          disabled={isProc}
                          className="flex items-center gap-1 bg-rose-600/80 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          {isProc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Training History (read-only) */}
        {training.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">Training History</h2>
            <div className="space-y-2">
              {training.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-slate-900 border border-slate-700/50 rounded-lg px-4 py-3 text-sm">
                  <div>
                    <div className="font-medium text-slate-200">{t.course_name}</div>
                    <div className="text-xs text-slate-400">{t.provider} • {t.duration_hours}h</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    t.status === "COMPLETED" ? "bg-emerald-900/60 text-emerald-300" : "bg-amber-900/60 text-amber-300"
                  }`}>{t.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
