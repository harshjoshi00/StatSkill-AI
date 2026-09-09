"use client";

import {
  LayoutDashboard, Target, GraduationCap, Sparkles,
  Clock, User, Sun, Moon, ShieldCheck
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export type NavSection = "dashboard" | "gaps" | "learning" | "quizzes" | "audit" | "profile";

interface SidebarNavProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  openGapsCount: number;
  coursesCount: number;
  officerName?: string;
  designation?: string;
}

export default function SidebarNav({
  activeSection,
  onSelectSection,
  openGapsCount,
  coursesCount
}: SidebarNavProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  const navItems: { id: NavSection; label: string; icon: any; badge?: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "gaps", label: "Skill Gaps", icon: Target, badge: openGapsCount > 0 ? `${openGapsCount}` : undefined },
    { id: "learning", label: "Learning Paths", icon: GraduationCap, badge: `${coursesCount}` },
    { id: "quizzes", label: "AI Quiz Studio", icon: Sparkles },
    { id: "audit", label: "Audit Trail", icon: Clock },
    { id: "profile", label: "Cadre Profile", icon: User },
  ];

  return (
    <aside className="w-60 shrink-0 bg-white dark:bg-[#0e1422] border-r border-slate-200/80 dark:border-slate-800/80 min-h-screen flex flex-col justify-between p-4 sticky top-0 h-screen overflow-y-auto transition-colors duration-150">
      {/* Top Brand */}
      <div>
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold flex items-center justify-center border border-slate-200 dark:border-slate-700 text-sm shadow-2xs">
            S
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">StatSkill</span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[10px] px-1.5 py-0.5 rounded-full border border-slate-200/70 dark:border-slate-700 font-semibold">
              v1.0
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="mt-7">
          <div className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-3 mb-2">
            NAVIGATION
          </div>

          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition font-medium ${
                    isActive
                      ? "bg-slate-100/90 dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-805/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-slate-900 dark:text-cyan-400" : "text-slate-400 dark:text-slate-500"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md font-bold ${
                        isActive
                          ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Info Widget & Interactive Light / Dark Mode Toggle */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3 space-y-1">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>AI-Powered Analysis</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            MOSPI • NSO Official Cadre
          </p>
        </div>

        {/* Interactive Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="w-full bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-3 text-xs text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-between shadow-2xs transition cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            {isDark ? (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light Mode</span>
              </>
            )}
          </span>
          <span
            className={`w-2 h-2 rounded-full inline-block transition-colors ${
              isDark ? "bg-cyan-400 ring-2 ring-cyan-400/20" : "bg-emerald-500 ring-2 ring-emerald-500/20"
            }`}
          />
        </button>
      </div>
    </aside>
  );
}
