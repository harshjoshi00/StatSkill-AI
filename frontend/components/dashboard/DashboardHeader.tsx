"use client";

import Link from "next/link";
import { Sparkles, User, LogOut, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, Building2, Briefcase } from "lucide-react";
import { Profile } from "@/lib/api";

interface DashboardHeaderProps {
  user: { first_name: string; last_name: string; email: string } | null;
  profile: Profile | null;
  profileComplete: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function DashboardHeader({
  user,
  profile,
  profileComplete,
  refreshing,
  onRefresh,
  onLogout
}: DashboardHeaderProps) {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Govt Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 p-0.5 shadow-sm shadow-indigo-500/20 shrink-0">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-base tracking-tight">StatSkill AI</span>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                MOSPI / NSO Official
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Capacity Building & Skill Intelligence Platform
            </p>
          </div>
        </div>

        {/* User Identity & Navigation Actions */}
        <div className="flex items-center gap-3 flex-wrap ml-auto">
          {/* Profile Status Chip */}
          {!profileComplete ? (
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Complete Profile</span>
              <ChevronRight className="w-3 h-3 text-amber-600" />
            </Link>
          ) : (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cadre Profile Verified</span>
            </div>
          )}

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition shadow-xs"
            title="Refresh competency & dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Profile Link */}
          <Link
            href="/profile"
            className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition shadow-xs"
          >
            <User className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Profile</span>
          </Link>

          {/* Sign Out */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 px-3 py-1.5 rounded-lg transition shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
