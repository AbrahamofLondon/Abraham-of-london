// components/admin/DiagnosticTelemetryPanel.tsx
import * as React from "react";

type Telemetry = {
  stats: {
    artifacts: number;
    lineage: number;
    grants: number;
    entitlements: number;
  };
  recent: Array<{
    id: string;
    eventType: string;
    diagnosticRef?: string | null;
    createdAt: string;
  }>;
};

export default function DiagnosticTelemetryPanel() {
  const [data, setData] = React.useState<Telemetry | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/diagnostics/telemetry")
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => setData(null));
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white">
      <div className="text-[10px] uppercase tracking-[0.35em] text-white/50">Diagnostic Telemetry</div>
      <h3 className="mt-3 text-2xl font-serif">Artefact Control Plane</h3>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric label="Artifacts" value={data?.stats.artifacts ?? 0} />
        <Metric label="Lineage" value={data?.stats.lineage ?? 0} />
        <Metric label="Grants" value={data?.stats.grants ?? 0} />
        <Metric label="Entitlements" value={data?.stats.entitlements ?? 0} />
      </div>

      <div className="mt-6 space-y-2">
        {data?.recent?.slice(0, 10).map((item) => (
          <div key={item.id} className="rounded-xl border border-white/10 p-3 text-sm text-white/70">
            {item.eventType} • {new Date(item.createdAt).toLocaleString("en-GB")}
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 p-4 text-center">
      <div className="text-2xl font-serif text-white">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/45">{label}</div>
    </div>
  );
}