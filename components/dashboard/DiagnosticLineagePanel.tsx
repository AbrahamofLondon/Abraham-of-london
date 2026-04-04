// components/dashboard/DiagnosticLineagePanel.tsx
import * as React from "react";

type LineageEvent = {
  id: string;
  eventType: string;
  version?: string | null;
  actor?: string | null;
  createdAt: string;
};

export default function DiagnosticLineagePanel({ events }: { events: LineageEvent[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="text-[10px] uppercase tracking-[0.35em] text-white/50">Lineage</div>
      <h3 className="mt-3 text-2xl font-serif text-white">Report Chain of Custody</h3>

      <div className="mt-6 space-y-3">
        {events.length ? events.map((e) => (
          <div key={e.id} className="rounded-2xl border border-white/10 p-4">
            <div className="text-sm text-white">{e.eventType}</div>
            <div className="mt-1 text-xs text-white/50">
              {e.version ? `v${e.version} • ` : ""}
              {e.actor || "system"} • {new Date(e.createdAt).toLocaleString("en-GB")}
            </div>
          </div>
        )) : <div className="text-sm text-white/50">No lineage events yet.</div>}
      </div>
    </section>
  );
}