/* ============================================================================
   FILE: components/admin/DeadLetterPanel.tsx
   PURPOSE:
   - Admin UI for dead-letter inspection and replay
============================================================================ */

import * as React from "react";
import { RefreshCw, RotateCcw, Trash2, ShieldAlert } from "lucide-react";

type DeadLetterItem = {
  id: string;
  queue: string;
  jobType: string;
  reason: string;
  status: string;
  severity: string;
  createdAt: string;
  source?: string | null;
  replayNote?: string | null;
};

export function DeadLetterPanel() {
  const [items, setItems] = React.useState<DeadLetterItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/jobs/dead-letter");
      const json = await res.json();
      setItems(Array.isArray(json?.items) ? json.items : []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function replay(id: string) {
    setBusyId(id);
    try {
      await fetch("/api/admin/jobs/dead-letter/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function resolve(id: string) {
    setBusyId(id);
    try {
      await fetch("/api/admin/jobs/dead-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "resolve" }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function discard(id: string) {
    setBusyId(id);
    try {
      await fetch("/api/admin/jobs/dead-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "discard" }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
          Dead-Letter Queue
        </h2>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-xs font-mono text-slate-500 animate-pulse">
          Loading dead-letter queue...
        </div>
      ) : items.length === 0 ? (
        <div className="text-xs font-mono text-emerald-500">
          No dead-letter items. Clean shop. For once.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-white/5 rounded-lg p-4 bg-black/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest mb-2">
                    <ShieldAlert className="w-3 h-3 text-amber-500" />
                    <span className="text-amber-400">{item.queue}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">{item.jobType}</span>
                  </div>
                  <div className="text-sm text-white">{item.reason}</div>
                  <div className="mt-2 text-[10px] font-mono text-slate-500">
                    {new Date(item.createdAt).toLocaleString()} • {item.severity} • {item.status}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => void replay(item.id)}
                    disabled={busyId === item.id}
                    className="px-3 py-2 text-[10px] uppercase tracking-widest bg-blue-600/20 text-blue-300 border border-blue-500/20 rounded"
                  >
                    <span className="inline-flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      Replay
                    </span>
                  </button>
                  <button
                    onClick={() => void resolve(item.id)}
                    disabled={busyId === item.id}
                    className="px-3 py-2 text-[10px] uppercase tracking-widest bg-emerald-600/20 text-emerald-300 border border-emerald-500/20 rounded"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => void discard(item.id)}
                    disabled={busyId === item.id}
                    className="px-3 py-2 text-[10px] uppercase tracking-widest bg-red-600/20 text-red-300 border border-red-500/20 rounded"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />
                      Discard
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}