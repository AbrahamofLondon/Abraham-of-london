// app/client/reports/page.tsx
// Client portal — all reports list.

"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ClientReportsPageInner() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";
  const [reports, setReports] = React.useState<Array<{ id: string; state: string; createdAt: string }>>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!token) return;
    fetch(`/api/client/portal?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => { if (data.ok) setReports(data.reports); })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><p className="text-sm text-white/30 font-mono">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <Link href={`/client?token=${encodeURIComponent(token)}`} className="text-[10px] text-white/30 hover:text-white/50 font-mono">← Portal</Link>
          <h1 className="mt-2 text-lg font-semibold text-white/80">Executive Reports</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        {reports.length === 0 ? <p className="text-sm text-white/30">No reports yet.</p> : (
          <div className="space-y-2">
            {reports.map((r) => (
              <Link key={r.id} href={`/client/reports/${r.id}?token=${encodeURIComponent(token)}`}
                className="block rounded-lg border border-white/8 bg-white/2 p-3 hover:bg-white/4">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${r.state === "DISORDERED" ? "bg-red-500" : r.state === "MISALIGNED" ? "bg-amber-400" : "bg-emerald-400"}`} />
                  <span className="text-sm text-white/60">{r.state}</span>
                  <span className="text-xs text-white/30 ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ClientReportsPage() {
  return (
    <React.Suspense fallback={null}>
      <ClientReportsPageInner />
    </React.Suspense>
  );
}
