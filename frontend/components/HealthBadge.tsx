"use client";

import { useEffect, useState } from "react";
import { fetchHealthStatus, HealthResponse } from "@/lib/api";
import { Activity, CheckCircle2, AlertCircle, RefreshCw, Database, Cpu } from "lucide-react";

export default function HealthBadge() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    setLoading(true);
    const data = await fetchHealthStatus();
    setHealth(data);
    setLoading(false);
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-slate-900 text-slate-100 text-xs px-3 py-1.5 rounded-lg border border-slate-800 shadow-sm">
      <div className="flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
        <span className="font-semibold text-slate-300">Backend API:</span>
      </div>

      {loading ? (
        <span className="flex items-center gap-1 text-slate-400">
          <RefreshCw className="w-3 h-3 animate-spin" /> Checking...
        </span>
      ) : health ? (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Online (v{health.version})
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Database className="w-3 h-3 text-cyan-400" />
            {health.database.connected ? "Postgres + pgvector" : "Offline DB"}
          </span>
          {health.demo_mode && (
            <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
              Demo Mode
            </span>
          )}
        </div>
      ) : (
        <span className="flex items-center gap-1 text-rose-400">
          <AlertCircle className="w-3.5 h-3.5" /> Offline (FastAPI not running)
        </span>
      )}

      <button
        onClick={checkHealth}
        className="ml-1 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
        title="Refresh Status"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
