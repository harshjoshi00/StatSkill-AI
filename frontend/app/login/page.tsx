"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, LogIn, Mail, Lock, AlertCircle, Loader2, User, Shield } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // Role-based redirect handled by checking user after login
      const stored = localStorage.getItem("statskill_token");
      if (stored) {
        const payload = JSON.parse(atob(stored.split(".")[1]));
        if (payload.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: "employee" | "admin") => {
    if (role === "employee") {
      setEmail("employee@statskill.gov.in");
      setPassword("Employee@123");
    } else {
      setEmail("admin@statskill.gov.in");
      setPassword("Admin@123");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl shadow-lg shadow-indigo-500/30 mx-auto">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">StatSkill AI</h1>
            <p className="text-slate-400 text-sm mt-1">MOSPI • NSO • Official Statistical System</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Sign In to your account</h2>
            <p className="text-slate-400 text-sm mt-1">Access your competency profile and learning resources</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-950/50 border border-rose-800 text-rose-300 text-sm px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@statskill.gov.in"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo Quick Fill */}
          <div className="border-t border-slate-700 pt-4 space-y-2">
            <p className="text-xs text-slate-500 text-center font-medium uppercase tracking-wider">Demo Accounts (Local Dev)</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fillDemo("employee")}
                className="flex items-center justify-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-700 border border-slate-700 text-indigo-300 py-2 px-3 rounded-lg transition"
              >
                <User className="w-3.5 h-3.5" /> Official Demo
              </button>
              <button
                onClick={() => fillDemo("admin")}
                className="flex items-center justify-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-700 border border-slate-700 text-amber-300 py-2 px-3 rounded-lg transition"
              >
                <Shield className="w-3.5 h-3.5" /> Admin Demo
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400">
            New official?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
