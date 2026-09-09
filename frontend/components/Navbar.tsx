"use client";

import HealthBadge from "./HealthBadge";
import { ShieldCheck, UserCheck, LayoutDashboard, Award, Sparkles } from "lucide-react";

interface NavbarProps {
  activeRole: "official" | "admin";
  onRoleChange: (role: "official" | "admin") => void;
}

export default function Navbar({ activeRole, onRoleChange }: NavbarProps) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Govt Tag */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                  StatSkill AI
                </span>
                <span className="bg-indigo-900/80 text-indigo-300 text-[10px] px-2 py-0.5 rounded border border-indigo-700/50 font-mono">
                  MOSPI / NSO Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official Statistical System • Skill Intelligence & Learning
              </p>
            </div>
          </div>

          {/* Right Action & Role Switcher */}
          <div className="flex items-center gap-4">
            <HealthBadge />

            {/* Role Switcher */}
            <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex items-center gap-1">
              <button
                onClick={() => onRoleChange("official")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
                  activeRole === "official"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Official View
              </button>
              <button
                onClick={() => onRoleChange("admin")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
                  activeRole === "admin"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Dashboard
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
