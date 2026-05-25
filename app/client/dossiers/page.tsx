// app/client/dossiers/page.tsx
// Client portal — all Boardroom dossiers list.

"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ClientDossiersPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";
  const [dossiers, setDossiers] = React.useState<Array<{ id: string; title: string; status: string; createdAt: string }>>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!token) return;
    fetch(`/api/client/portal?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => { if (data.ok) setDossiers(data.dossiers); })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><p className="text-sm text-white/30 font-mono">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <Link href={`/client?token=${encodeURIComponent(token)}`} className="text-[10px] text-white/30 hover:text-white/50 font-mono">← Portal</Link>
          <h1 className="mt-2 text-lg font-semibold text-white/80">Boardroom Dossiers</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        {dossiers.length === 0 ? <p className="text-sm text-white/30">No dossiers yet.</p> : (
          <div className="space-y-2">
            {dossiers.map((d) => (
              <Link key={d.id} href={`/boardroom/dossier/${d.id}?token=${encodeURIComponent(token)}`}
                className="block rounded-lg border border-white/8 bg-white/2 p-3 hover:bg-white/4">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${d.status === "DELIVERED" ? "bg-emerald-400" : d.status === "REVOKED" ? "bg-red-500" : "bg-amber-400"}`} />
                  <span className="text-sm text-white/60 truncate">{d.title}</span>
                  <span className="text-xs text-white/30 ml-auto">{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
