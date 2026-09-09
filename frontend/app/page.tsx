"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Brain,
  Target,
  BookOpen,
  FileCheck,
  TrendingUp,
  Cpu,
  Database,
  Layers,
  ArrowRight,
  Sparkles,
  BarChart3,
  CheckCircle,
  Clock,
  Shield,
  FileText,
  UserCheck
} from "lucide-react";

export default function Home() {
  const [activeRole, setActiveRole] = useState<"official" | "admin">("official");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar activeRole={activeRole} onRoleChange={setActiveRole} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Phase 1 Banner */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Phase 1 Initialized & Active
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                StatSkill AI <span className="text-indigo-400 font-normal">| Platform Foundation</span>
              </h1>
              <p className="text-slate-300 max-w-3xl text-sm leading-relaxed">
                AI-Powered Skill Intelligence and Capacity Building Platform tailored for India's Official Statistical System. Phase 1 establishes the monorepo architecture, FastAPI backend, PostgreSQL + pgvector vector store, health checks, and responsive design foundation.
              </p>
            </div>

            <div className="flex flex-wrap md:flex-col gap-3 shrink-0">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                <div className="text-slate-400 font-medium">Architecture Stack</div>
                <div className="text-indigo-300 font-mono font-semibold">FastAPI + Next.js + pgvector</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                <div className="text-slate-400 font-medium">Target Ecosystem</div>
                <div className="text-amber-300 font-medium">MOSPI, NSO, NSSO, iGOT</div>
              </div>
            </div>
          </div>
        </div>

        {/* Closed-Loop Workflow Pipeline */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Closed-Loop Intelligence Flow
              </h2>
              <p className="text-xs text-slate-400">
                End-to-end competency profiling, gap calculation, RAG assessment, and automated skill updating.
              </p>
            </div>
            <span className="text-xs font-mono bg-indigo-950 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-800">
              Closed Loop Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "Competency Profiling",
                desc: "Evaluates official designation, survey experience, and past statistical training.",
                icon: Brain,
                color: "text-indigo-400",
                bg: "bg-indigo-950/50",
                border: "border-indigo-800/50",
              },
              {
                step: "02",
                title: "Skill Gap Engine",
                desc: "Calculates delta between current estimated skill level and role required baseline.",
                icon: Target,
                color: "text-amber-400",
                bg: "bg-amber-950/50",
                border: "border-amber-800/50",
              },
              {
                step: "03",
                title: "RAG & Quiz Generation",
                desc: "Extracts material from PDFs/PPTs via PyMuPDF/pgvector and builds grounded MCQs.",
                icon: BookOpen,
                color: "text-cyan-400",
                bg: "bg-cyan-950/50",
                border: "border-cyan-800/50",
              },
              {
                step: "04",
                title: "Score & Gap Recalculation",
                desc: "Updates skill matrix upon quiz completion and refreshes course recommendations.",
                icon: TrendingUp,
                color: "text-emerald-400",
                bg: "bg-emerald-950/50",
                border: "border-emerald-800/50",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-xl border ${item.border} ${item.bg} backdrop-blur-sm space-y-3 relative group hover:border-slate-600 transition`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    STEP {item.step}
                  </span>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="font-bold text-base text-slate-100">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Role View Preview */}
        {activeRole === "official" ? (
          <section className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-900/80 border border-indigo-700 flex items-center justify-center font-bold text-indigo-200">
                  SO
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Statistical Officer Profile Preview</h3>
                  <p className="text-xs text-slate-400">
                    National Sample Survey Office (NSSO) • Field Operations Division
                  </p>
                </div>
              </div>
              <span className="bg-emerald-950 text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-800 font-medium">
                Active Competency Index: 68/100
              </span>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400">Assessed Skills</span>
                <div className="text-2xl font-bold text-indigo-400">14</div>
                <span className="text-[10px] text-slate-500">Statistical + Technical</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400">Priority Skill Gaps</span>
                <div className="text-2xl font-bold text-amber-400">3</div>
                <span className="text-[10px] text-amber-400/80">Python, Survey Sampling</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400">Recommended Courses</span>
                <div className="text-2xl font-bold text-cyan-400">5</div>
                <span className="text-[10px] text-slate-500">iGOT Karmayogi + NSSTA</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400">Quizzes Attempted</span>
                <div className="text-2xl font-bold text-emerald-400">8</div>
                <span className="text-[10px] text-slate-500">84% Average Score</span>
              </div>
            </div>

            {/* Competency Preview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-200 flex items-center justify-between">
                  <span>Core Statistical Competencies</span>
                  <span className="text-xs font-normal text-indigo-400">MOSPI Framework</span>
                </h4>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-300">Survey Design & Sampling</span>
                      <span className="text-amber-400 font-semibold">Level 2 (Basic) • Gap: -2</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: "45%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-300">National Accounts Statistics</span>
                      <span className="text-emerald-400 font-semibold">Level 4 (Advanced) • Gap: 0</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "80%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-300">Consumer Price Index (CPI)</span>
                      <span className="text-indigo-400 font-semibold">Level 3 (Intermediate)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "65%" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-200 flex items-center justify-between">
                  <span>Digital & Technical Competencies</span>
                  <span className="text-xs font-normal text-cyan-400">Data Analytics</span>
                </h4>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-300">Python for Statistical Computing</span>
                      <span className="text-rose-400 font-semibold">Level 1 (Beginner) • High Gap</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-rose-500 h-2 rounded-full" style={{ width: "25%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-300">R Programming & Data Vis</span>
                      <span className="text-amber-400 font-semibold">Level 2 (Basic)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: "40%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-300">SQL Data Extraction</span>
                      <span className="text-emerald-400 font-semibold">Level 3 (Intermediate)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "60%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Executive Admin Dashboard Preview */
          <section className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-950 border border-amber-700 flex items-center justify-center font-bold text-amber-300">
                  ADM
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">MOSPI Administrator Workforce Analytics</h3>
                  <p className="text-xs text-slate-400">
                    Cadre Skill Intelligence • Departmental Competency Distribution
                  </p>
                </div>
              </div>
              <span className="bg-amber-950 text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-800 font-medium">
                1,420 Active Cadre Officials
              </span>
            </div>

            {/* Admin Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400">Total Workforce</span>
                <div className="text-2xl font-bold text-white">1,420</div>
                <span className="text-[10px] text-slate-500">NSO + NSSO + State Bureaus</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400">Avg Cadre Competency</span>
                <div className="text-2xl font-bold text-emerald-400">64.2%</div>
                <span className="text-[10px] text-emerald-400/80">+4.8% past quarter</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400">Top Organizational Gap</span>
                <div className="text-lg font-bold text-amber-400 truncate">Machine Learning</div>
                <span className="text-[10px] text-slate-500">72% Officials need training</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400">XGBoost Future Demand</span>
                <div className="text-lg font-bold text-cyan-400 truncate">GIS & AI Analytics</div>
                <span className="text-[10px] text-cyan-400/80">91% predicted demand</span>
              </div>
            </div>
          </section>
        )}

        {/* Phase 1 Verification & Technical Architecture Summary */}
        <section className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Phase 1 Technical Verification & Run Instructions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-400" /> PostgreSQL + pgvector
              </div>
              <p className="text-slate-400 leading-relaxed">
                Vector extension configured with Docker Compose image <code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded">pgvector/pgvector:pg16</code>. Supports 384-dim semantic embeddings.
              </p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-400" /> FastAPI Backend
              </div>
              <p className="text-slate-400 leading-relaxed">
                Modular package architecture in <code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded">/backend/app</code> with CORS, health router, settings, and database session manager.
              </p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Next.js 14 Frontend
              </div>
              <p className="text-slate-400 leading-relaxed">
                TypeScript + Tailwind CSS enterprise interface with live health badge polling <code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded">/api/health</code> endpoint.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        StatSkill AI Prototype • National Statistical System Capacity Building • Phase 1 Monorepo Architecture
      </footer>
    </div>
  );
}
