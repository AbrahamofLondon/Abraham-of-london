// app/client/page.tsx
// Client Portal — magic-link authenticated dashboard.

"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type ReportSummary = { id: string; status: string; state: string; createdAt: string };
type DossierSummary = { id: string; title: string; status: string; createdAt: string };
type ActionSummary = { id: string; findingTitle: string; severity: string; status: string; recommendedAction: string };

export default function ClientPortalPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";

  const [email, setEmail] = React.useState("");
  const [reports, setReports] = React.useState<ReportSummary[]>([]);
  const [dossiers, setDossiers] = React.useState<DossierSummary[]>([]);
  const [actions, setActions] = React.useState<ActionSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) { setError("Access link invalid."); setLoading(false); return; }
    fetch(`/api/client/portal?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) { setEmail(data.email); setReports(data.reports); setDossiers(data.dossiers); setActions(data.actions); }
        else setError(data.error ?? "Access denied");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><p className="text-sm text-white/30 font-mono">Loading portal...</p></div>;
  if (error) return <div className="min-h-screen bg-black flex items-center justify-center p-6"><div className="max-w-md text-center"><div className="text-6xl mb-6 opacity-20">◈</div><p className="text-sm text-white/30">{error}</p></div></div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500/60">Client Portal</p>
          <h1 className="mt-1 text-lg font-semibold text-white/80">Your Account</h1>
          <p className="text-xs text-white/30 mt-1">{email}</p>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Reports */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-white/20">Executive Reports ({reports.length})</h2>
            <Link href={`/client/reports?token=${encodeURIComponent(token)}`} className="text-[10px] text-amber-400/60 hover:text-amber-400">View all →</Link>
          </div>
          {reports.length === 0 ? <p className="text-sm text-white/30">No reports yet.</p> : (
            <div className="space-y-2">
              {reports.map((r) => (
                <Link key={r.id} href={`/client/reports/${r.id}?token=${encodeURIComponent(token)}`}
                  className="block rounded-lg border border-white/8 bg-white/2 p-3 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${r.state === "DISORDERED" ? "bg-red-500" : r.state === "MISALIGNED" ? "bg-amber-400" : "bg-emerald-400"}`} />
                    <span className="text-sm text-white/60">{r.state}</span>
                    <span className="text-xs text-white/30 ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Dossiers */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-white/20">Boardroom Dossiers ({dossiers.length})</h2>
            <Link href={`/client/dossiers?token=${encodeURIComponent(token)}`} className="text-[10px] text-amber-400/60 hover:text-amber-400">View all →</Link>
          </div>
          {dossiers.length === 0 ? <p className="text-sm text-white/30">No dossiers yet.</p> : (
            <div className="space-y-2">
              {dossiers.map((d) => (
                <Link key={d.id} href={`/boardroom/dossier/${d.id}?token=${encodeURIComponent(token)}`}
                  className="block rounded-lg border border-white/8 bg-white/2 p-3 hover:bg-white/4 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${d.status === "DELIVERED" ? "bg-emerald-400" : d.status === "REVOKED" ? "bg-red-500" : "bg-amber-400"}`} />
                    <span className="text-sm text-white/60 truncate">{d.title}</span>
                    <span className="text-xs text-white/30 ml-auto">{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Action items */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-white/20">Action Items ({actions.length})</h2>
            <Link href={`/client/actions?token=${encodeURIComponent(token)}`} className="text-[10px] text-amber-400/60 hover:text-amber-400">View all →</Link>
          </div>
          {actions.length === 0 ? <p className="text-sm text-white/30">No action items.</p> : (
            <div className="space-y-2">
              {actions.slice(0, 5).map((a) => (
                <div key={a.id} className="rounded-lg border border-white/8 bg-white/2 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${a.severity === "CRITICAL" ? "bg-red-500" : a.severity === "HIGH" ? "bg-orange-500" : "bg-amber-400"}`} />
                    <span className="text-sm text-white/60">{a.findingTitle}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ml-auto ${a.status === "OPEN" ? "bg-amber-400/10 text-amber-400/70" : a.status === "IN_PROGRESS" ? "bg-blue-400/10 text-blue-400/70" : a.status === "ACTIONED" ? "bg-emerald-400/10 text-emerald-400/70" : "bg-white/5 text-white/40"}`}>{a.status}</span>
                  </div>
                  <p className="text-xs text-white/40">{a.recommendedAction}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
