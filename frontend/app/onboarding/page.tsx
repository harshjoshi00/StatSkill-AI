"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  fetchDepartmentsApi, fetchRolesApi, fetchSkillsApi,
  updateProfileApi, addTrainingHistoryApi,
  Department, JobRole, Skill
} from "@/lib/api";
import {
  ChevronRight, ChevronLeft, CheckCircle, Sparkles, User, Building2,
  GraduationCap, Briefcase, Layers, BookOpen, ClipboardCheck, Loader2
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Professional Info", icon: User, desc: "Basic designation and role" },
  { id: 2, title: "Department & Role", icon: Building2, desc: "Your organizational placement" },
  { id: 3, title: "Education & Experience", icon: GraduationCap, desc: "Your qualifications" },
  { id: 4, title: "Current Assignment", icon: Briefcase, desc: "What you're working on" },
  { id: 5, title: "Existing Skills", icon: Layers, desc: "Rate your current skill levels" },
  { id: 6, title: "Previous Training", icon: BookOpen, desc: "Completed courses and programmes" },
  { id: 7, title: "Review & Submit", icon: ClipboardCheck, desc: "Confirm your profile" },
];

const SKILL_LEVEL_LABELS = ["No Knowledge", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"];
const SKILL_LEVEL_COLORS = ["text-slate-500", "text-rose-400", "text-amber-400", "text-yellow-400", "text-emerald-400", "text-cyan-400"];

export default function OnboardingPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form data persisted across steps
  const [form, setForm] = useState({
    designation: "",
    department_id: "",
    job_role_id: "",
    education: "",
    years_of_experience: 0,
    current_assignment: "",
    professional_summary: "",
    selectedSkills: {} as Record<string, number>,
    training: [] as { course_name: string; provider: string; duration_hours: number; completion_date: string; status: string }[],
  });

  const [newTraining, setNewTraining] = useState({ course_name: "", provider: "", duration_hours: 0, completion_date: "", status: "COMPLETED" });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    fetchDepartmentsApi().then(setDepartments).catch(() => {});
    fetchRolesApi().then(setRoles).catch(() => {});
    fetchSkillsApi().then(setSkills).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await updateProfileApi({
        designation: form.designation,
        department_id: form.department_id || undefined,
        job_role_id: form.job_role_id || undefined,
        education: form.education,
        years_of_experience: form.years_of_experience,
        current_assignment: form.current_assignment,
        professional_summary: form.professional_summary,
        skills: Object.entries(form.selectedSkills).map(([skill_id, current_level]) => ({ skill_id, current_level, source: "SELF_ASSESSMENT" })),
      });

      for (const t of form.training) {
        await addTrainingHistoryApi({ ...t, status: t.status as "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED" });
      }
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  if (isLoading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-900/50 border border-emerald-700 rounded-full mx-auto">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Profile Completed!</h2>
          <p className="text-slate-400 text-sm mt-2">
            Your competency profile has been created. The AI engine will now analyse your skills and generate personalised recommendations.
          </p>
        </div>
        <div className="bg-indigo-950/50 border border-indigo-800 rounded-lg p-4 text-sm text-indigo-200">
          <strong>Next Step:</strong> Assess your competencies to unlock AI-driven skill gap analysis and course recommendations.
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition"
        >
          Go to My Dashboard →
        </button>
      </div>
    </div>
  );

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <span className="font-semibold text-white">StatSkill AI</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400 text-sm">Profile Onboarding Wizard</span>
        <span className="ml-auto text-xs text-slate-500">Step {step} of {STEPS.length}</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Profile Completion Progress</span>
            <span className="font-semibold text-indigo-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {/* Step Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {STEPS.map((s) => (
              <div key={s.id} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition ${step === s.id ? "bg-indigo-600 text-white font-semibold" : step > s.id ? "bg-emerald-900/40 text-emerald-400" : "text-slate-500"}`}>
                {step > s.id ? <CheckCircle className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                {s.title}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-5">
          <div>
            <h2 className="text-xl font-bold text-white">{STEPS[step - 1].title}</h2>
            <p className="text-slate-400 text-sm">{STEPS[step - 1].desc}</p>
          </div>

          {/* Step 1: Professional Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Designation / Post</label>
                <input type="text" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="e.g. Statistical Officer Grade I"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Professional Summary</label>
                <textarea rows={3} value={form.professional_summary} onChange={(e) => setForm({ ...form, professional_summary: e.target.value })}
                  placeholder="Brief summary of your statistical career, specializations, and interests..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
          )}

          {/* Step 2: Department & Role */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Department / Division</label>
                <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select your department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Job Role / Cadre Post</label>
                <select value={form.job_role_id} onChange={(e) => setForm({ ...form, job_role_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select your role</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Education & Experience */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Highest Education Qualification</label>
                <input type="text" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })}
                  placeholder="e.g. M.Sc. Statistics, University of Delhi"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Years of Experience in Official Statistics</label>
                <input type="number" min={0} max={40} value={form.years_of_experience}
                  onChange={(e) => setForm({ ...form, years_of_experience: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          )}

          {/* Step 4: Current Assignment */}
          {step === 4 && (
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Current Assignment / Project</label>
              <textarea rows={4} value={form.current_assignment} onChange={(e) => setForm({ ...form, current_assignment: e.target.value })}
                placeholder="Describe your current work assignment, survey project, or research area..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
          )}

          {/* Step 5: Skills Self-Assessment */}
          {step === 5 && (
            <div className="space-y-5">
              <p className="text-xs text-slate-400 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
                Rate your current proficiency level (0 = No Knowledge → 5 = Expert). This is your <strong>self-assessment</strong> — AI assessment scores will refine this later.
              </p>
              {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                <div key={cat} className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{cat.replace("_", " ")}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {catSkills.map((skill) => {
                      const level = form.selectedSkills[skill.id] ?? 0;
                      return (
                        <div key={skill.id} className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-200 font-medium">{skill.name}</span>
                            <span className={`text-xs font-semibold ${SKILL_LEVEL_COLORS[level]}`}>{SKILL_LEVEL_LABELS[level]}</span>
                          </div>
                          <input type="range" min={0} max={5} value={level}
                            onChange={(e) => setForm({ ...form, selectedSkills: { ...form.selectedSkills, [skill.id]: parseInt(e.target.value) } })}
                            className="w-full accent-indigo-500" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 6: Training History */}
          {step === 6 && (
            <div className="space-y-4">
              {form.training.length > 0 && (
                <div className="space-y-2">
                  {form.training.map((t, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm">
                      <div>
                        <div className="font-medium text-slate-200">{t.course_name}</div>
                        <div className="text-slate-400 text-xs">{t.provider} • {t.duration_hours}h • {t.status}</div>
                      </div>
                      <button onClick={() => setForm({ ...form, training: form.training.filter((_, j) => j !== i) })}
                        className="text-rose-400 hover:text-rose-300 text-xs">Remove</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-slate-900 border border-dashed border-slate-600 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-medium text-slate-300">Add Training Programme</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Course name" value={newTraining.course_name}
                    onChange={(e) => setNewTraining({ ...newTraining, course_name: e.target.value })}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="text" placeholder="Provider (e.g. iGOT Karmayogi, NSSTA)"
                    value={newTraining.provider}
                    onChange={(e) => setNewTraining({ ...newTraining, provider: e.target.value })}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="number" placeholder="Hours" value={newTraining.duration_hours || ""}
                    onChange={(e) => setNewTraining({ ...newTraining, duration_hours: parseInt(e.target.value) || 0 })}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="date" value={newTraining.completion_date}
                    onChange={(e) => setNewTraining({ ...newTraining, completion_date: e.target.value })}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <button
                  onClick={() => {
                    if (newTraining.course_name && newTraining.provider) {
                      setForm({ ...form, training: [...form.training, newTraining] });
                      setNewTraining({ course_name: "", provider: "", duration_hours: 0, completion_date: "", status: "COMPLETED" });
                    }
                  }}
                  className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition"
                >
                  + Add Training
                </button>
              </div>
            </div>
          )}

          {/* Step 7: Review */}
          {step === 7 && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Designation", form.designation || "—"],
                  ["Department", departments.find(d => d.id === form.department_id)?.name || "—"],
                  ["Job Role", roles.find(r => r.id === form.job_role_id)?.title || "—"],
                  ["Education", form.education || "—"],
                  ["Experience", `${form.years_of_experience} years`],
                  ["Skills Rated", `${Object.keys(form.selectedSkills).length} skills`],
                  ["Training Records", `${form.training.length} courses`],
                ].map(([label, val]) => (
                  <div key={label} className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                    <div className="text-xs text-slate-500 font-medium">{label}</div>
                    <div className="text-slate-200 font-semibold mt-0.5 truncate">{val}</div>
                  </div>
                ))}
              </div>

              <div className="bg-indigo-950/40 border border-indigo-800 rounded-lg p-4 text-indigo-200 text-xs">
                By submitting, you confirm this profile information is accurate. The AI system will use this data to generate your initial competency assessment.
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < STEPS.length ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition"
            >
              Save & Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {submitting ? "Submitting..." : "Submit Profile"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
