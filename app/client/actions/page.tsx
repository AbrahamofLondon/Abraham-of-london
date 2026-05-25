// app/client/actions/page.tsx
// Client portal — action items with status update capability.

"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type ActionItem = {
  id: string;
  findingTitle: string;
  severity: string;
  status: string;
  recommendedAction: string;
  dueDate: string | null;
  outcomeNote: string | null;
};

export default function ClientActionsPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";
  const [actions, setActions] = React.useState<ActionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const loadActions = () => {
    if (!token) return;
    fetch(`/api/client/portal?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => { if (data.ok) setActions(data.actions); })
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { loadActions(); }, [token]);

  const handleUpdateStatus = async (actionId: string, newStatus: string) => {
    setUpdatingId(actionId);
    try {
      await fetch(`/api/client/actions/${actionId}?token=${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      loadActions();
    } finally { setUpdatingId(null); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><p className="text-sm text-white/30 font-mono">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <Link href={`/client?token=${encodeURIComponent(token)}`} className="text-[10px] text-white/30 hover:text-white/50 font-mono">← Portal</Link>
          <h1 className="mt-2 text-lg font-semibold text-white/80">Action Items</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-3">
        {actions.length === 0 ? <p className="text-sm text-white/30">No action items.</p> : actions.map((a) => (
          <div key={a.id} className="rounded-lg border border-white/8 bg-white/2 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.severity === "CRITICAL" ? "bg-red-500" : a.severity === "HIGH" ? "bg-orange-500" : "bg-amber-400"}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-white/70 font-medium">{a.findingTitle}</p>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${a.status === "OPEN" ? "bg-amber-400/10 text-amber-400/70" : a.status === "IN_PROGRESS" ? "bg-blue-400/10 text-blue-400/70" : a.status === "ACTIONED" ? "bg-emerald-400/10 text-emerald-400/70" : "bg-white/5 text-white/40"}`}>{a.status}</span>
                </div>
                <p className="text-xs text-white/40">{a.recommendedAction}</p>
              </div>
            </div>
            {/* Status update buttons */}
            <div className="flex gap-2 flex-wrap border-t border-white/5 pt-3">
              {a.status !== "IN_PROGRESS" && (
                <button onClick={() => handleUpdateStatus(a.id, "IN_PROGRESS")} disabled={updatingId === a.id}
                  className="rounded border border-blue-400/20 px-2.5 py-1 text-[9px] text-blue-400/60 hover:bg-blue-400/5 disabled:opacity-40">Mark In Progress</button>
              )}
              {a.status !== "ACTIONED" && (
                <button onClick={() => handleUpdateStatus(a.id, "ACTIONED")} disabled={updatingId === a.id}
                  className="rounded border border-emerald-400/20 px-2.5 py-1 text-[9px] text-emerald-400/60 hover:bg-emerald-400/5 disabled:opacity-40">Mark Actioned</button>
              )}
              {a.status !== "DEFERRED" && (
                <button onClick={() => handleUpdateStatus(a.id, "DEFERRED")} disabled={updatingId === a.id}
                  className="rounded border border-amber-400/20 px-2.5 py-1 text-[9px] text-amber-400/60 hover:bg-amber-400/5 disabled:opacity-40">Defer</button>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
