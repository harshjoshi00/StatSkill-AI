"use client";

import { LogOut, RefreshCw, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface TopHeaderProps {
  selectedDomain: string;
  onDomainChange: (domain: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function TopHeader({
  selectedDomain,
  onDomainChange,
  refreshing,
  onRefresh,
  onLogout
}: TopHeaderProps) {
  const { isDark, toggleTheme } = useTheme();

  const domains = [
    "National Accounts (PLFS, ASI, CPI, etc.)",
    "Field Operations & Survey Data (FOD)",
    "Economic Statistics & Indices (ESD)",
    "Survey Design & Research (SDRD)",
    "Price & Price Indices Division (PID)"
  ];

  return (
    <header className="bg-white dark:bg-[#0e1422] border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-30 transition-colors duration-150">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          Competency Scoring & Skill Intelligence
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Comprehensive evaluation of statistical cadre profile with explainable skill-gap diagnostics
        </p>
      </div>

      {/* Target Domain Dropdown, Theme Toggle & Status Badge */}
      <div className="flex items-center gap-3 flex-wrap ml-auto">
        {/* Domain / Dataset Select */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden lg:inline">
            Target Domain / Dataset
          </label>
          <select
            value={selectedDomain}
            onChange={e => onDomainChange(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:border-cyan-500 shadow-2xs"
          >
            {domains.map(d => (
              <option key={d} value={d} className="dark:bg-slate-800 dark:text-slate-100">
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* API Status Badge */}
        <div className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-full px-2.5 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>API Online</span>
        </div>

        {/* Theme Toggle Button in Header */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-cyan-600 dark:text-cyan-400" : ""}`} />
        </button>

        {/* Sign Out */}
        <button
          onClick={onLogout}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
