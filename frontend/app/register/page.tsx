"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, UserPlus, Mail, Lock, User, AlertCircle, Loader2, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(form.firstName, form.lastName, form.email, form.password);
      router.push("/onboarding");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl shadow-lg shadow-indigo-500/30 mx-auto">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
            <p className="text-slate-400 text-sm mt-1">StatSkill AI • Official Statistical System</p>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Register as Statistical Official</h2>
            <p className="text-slate-400 text-sm mt-1">All registrations are created with the Official role</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-950/50 border border-rose-800 text-rose-300 text-sm px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text" value={form.firstName} required
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Rajesh"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Last Name</label>
                <input
                  type="text" value={form.lastName} required
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Kumar"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Official Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email" value={form.email} required
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@mospi.gov.in"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password" value={form.password} required minLength={6}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <CheckCircle className={`w-3 h-3 ${form.password.length >= 6 ? "text-emerald-400" : "text-slate-600"}`} />
                At least 6 characters
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? "Creating account..." : "Create Account & Continue"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400">
            Already registered?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
