/* pages/inner-circle/admin/dashboard.tsx — Admin Control Surface (Enterprise-Grade) */
import React, { useState, useRef, useEffect } from "react";
import SecuritySummary from "@/components/admin/SecuritySummary";
import DenylistManager from "@/components/admin/DenylistManager";
import { DeadLetterPanel } from "@/components/admin/DeadLetterPanel";
import { adminFetch } from "@/lib/api/admin-client";

interface AuditLog {
  id: string;
  action: string;
  severity: string;
  status: string;
  createdAt: string;
  metadata?: any;
}

interface AdminStats {
  totalDiagnostics: number;
  pendingJobs: number;
  deadLetterCount: number;
  retentionQueueSize: number;
  activeGrants: number;
  totalArtifacts: number;
}

interface DiagnosticSummary {
  diagnosticRef: string;
  title: string;
  kind: string;
  submittedAt: string;
  respondentName: string | null;
  organisation: string | null;
  pct: number;
  band: string;
  reportStatus: string;
  version: string | null;
}

export default function AdminDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsBusy, setJobsBusy] = useState<null | "process" | "retention">(null);
  const denylistRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchIntelligence() {
      try {
        const [logsRes, statsRes, diagRes] = await Promise.all([
          adminFetch("/api/admin/system/logs?limit=100"),
          adminFetch("/api/admin/diagnostics/stats"),
          adminFetch("/api/admin/diagnostics/list?limit=50"),
        ]);

        const logsData = await logsRes.json();
        const statsData = await statsRes.json();
        const diagData = await diagRes.json();

        if (logsData.ok) setLogs(logsData.logs || []);
        if (statsData.ok) setStats(statsData.stats || null);
        if (diagData.ok) setDiagnostics(diagData.diagnostics || []);
      } catch (err) {
        console.error("Failed to fetch audit stream", err);
      } finally {
        setLoading(false);
      }
    }
    fetchIntelligence();
  }, []);

  const scrollToDenylist = () => {
    denylistRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const input = denylistRef.current?.querySelector("input") as HTMLInputElement | null;
    input?.focus();
  };

  async function runProcessJobs() {
    setJobsBusy("process");
    try {
      const res = await fetch("/api/admin/diagnostics/jobs/process", { method: "POST" });
      const data = await res.json();
      if (data.ok && data.processedCount > 0) {
        // Refresh stats and diagnostics after processing
        const [statsRes, diagRes] = await Promise.all([
          adminFetch("/api/admin/diagnostics/stats"),
          adminFetch("/api/admin/diagnostics/list?limit=50"),
        ]);
        const statsData = await statsRes.json();
        const diagData = await diagRes.json();
        if (statsData.ok) setStats(statsData.stats || null);
        if (diagData.ok) setDiagnostics(diagData.diagnostics || []);
      }
    } finally {
      setJobsBusy(null);
    }
  }

  async function runRetention() {
    setJobsBusy("retention");
    try {
      const res = await fetch("/api/admin/diagnostics/retention/run", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        // Refresh stats after retention
        const statsRes = await adminFetch("/api/admin/diagnostics/stats");
        const statsData = await statsRes.json();
        if (statsData.ok) setStats(statsData.stats || null);
      }
    } finally {
      setJobsBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-white font-mono uppercase animate-pulse">
        Synchronizing Data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 p-8">
      <header className="mb-12 border-l-4 border-blue-600 pl-6">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
          Directorate <span className="text-blue-600">Command</span>
        </h1>
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">
          Vault Security & Intelligence Oversight — System v3.0
        </p>
      </header>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Total Diagnostics
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{stats.totalDiagnostics}</div>
          </div>
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Active Grants
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-400">{stats.activeGrants}</div>
          </div>
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Total Artifacts
            </div>
            <div className="mt-2 text-2xl font-bold text-cyan-400">{stats.totalArtifacts}</div>
          </div>
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Pending Jobs
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-400">{stats.pendingJobs}</div>
          </div>
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Dead Letter Queue
            </div>
            <div className="mt-2 text-2xl font-bold text-red-400">{stats.deadLetterCount}</div>
          </div>
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Retention Queue
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-400">{stats.retentionQueueSize}</div>
          </div>
        </div>
      )}

      <SecuritySummary logs={logs} onOpenDenylist={scrollToDenylist} />

      <div className="mb-8 flex flex-wrap gap-3">
        <button
          onClick={() => void runProcessJobs()}
          disabled={jobsBusy !== null}
          className="px-4 py-3 bg-blue-600/20 border border-blue-500/20 rounded-xl text-xs font-black uppercase tracking-widest text-blue-300 hover:bg-blue-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {jobsBusy === "process" ? "Processing..." : "Process Diagnostic Jobs"}
        </button>

        <button
          onClick={() => void runRetention()}
          disabled={jobsBusy !== null}
          className="px-4 py-3 bg-amber-600/20 border border-amber-500/20 rounded-xl text-xs font-black uppercase tracking-widest text-amber-300 hover:bg-amber-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {jobsBusy === "retention" ? "Running..." : "Run Retention Sweep"}
        </button>
      </div>

      {/* Diagnostic Telemetry Table */}
      <div className="mb-8 bg-slate-950 border border-slate-900 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
            Diagnostic Telemetry
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-800 bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">Ref</th>
                <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">Title</th>
                <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">Respondent</th>
                <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">Score</th>
                <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">Band</th>
                <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">Version</th>
                <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {diagnostics.map((diag) => (
                <tr key={diag.diagnosticRef} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-[10px] text-blue-400">
                    {diag.diagnosticRef.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-200">
                    {diag.title}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {diag.respondentName || diag.organisation || "—"}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-300">
                    {diag.pct}%
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider ${
                      diag.band === "critical" ? "bg-red-500/20 text-red-400" :
                      diag.band === "high" ? "bg-orange-500/20 text-orange-400" :
                      diag.band === "elevated" ? "bg-yellow-500/20 text-yellow-400" :
                      diag.band === "moderate" ? "bg-blue-500/20 text-blue-400" :
                      "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      {diag.band}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider ${
                      diag.reportStatus === "ready" ? "bg-emerald-500/20 text-emerald-400" :
                      diag.reportStatus === "pending" ? "bg-amber-500/20 text-amber-400" :
                      "bg-slate-500/20 text-slate-400"
                    }`}>
                      {diag.reportStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {diag.version || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`/inner-circle/reports/${encodeURIComponent(diag.diagnosticRef)}`}
                      className="text-blue-400 hover:text-blue-300 text-xs font-mono uppercase tracking-wider"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))}
              {diagnostics.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No diagnostic telemetry found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-6">
            <h2 className="text-sm font-black uppercase tracking-widest mb-6 text-slate-400">
              Live Audit Stream
            </h2>
            <div className="space-y-2 font-mono text-[10px] max-h-[400px] overflow-y-auto">
              {logs.map((log: AuditLog) => (
                <div
                  key={log.id}
                  className="p-2 border-b border-white/5 flex justify-between hover:bg-white/5"
                >
                  <span className="text-blue-500">
                    [{new Date(log.createdAt).toLocaleTimeString()}]
                  </span>
                  <span className="text-slate-300 uppercase">{log.action}</span>
                  <span
                    className={
                      log.severity === "critical" ? "text-red-500" : "text-slate-500"
                    }
                  >
                    {log.status || "SUCCESS"}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-slate-500 text-center py-8">No audit logs found</div>
              )}
            </div>
          </div>

          <DeadLetterPanel />
        </div>

        <div className="space-y-6">
          <div ref={denylistRef}>
            <DenylistManager />
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
              Node Runtime Status
            </h4>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-xs font-mono">DB_CONNECTED: TRUE</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-xs font-mono">JOB_QUEUE: ACTIVE</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-xs font-mono">RETENTION_POLICY: LIVE</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
              System Actions
            </h4>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-[10px] font-mono uppercase tracking-widest text-slate-400 hover:bg-slate-800 transition-colors"
              >
                Refresh Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}