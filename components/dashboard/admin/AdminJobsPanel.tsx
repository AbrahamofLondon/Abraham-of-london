import * as React from "react";
import { RefreshCcw, Shield, ArchiveRestore } from "lucide-react";

export function AdminJobsPanel() {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<string>("");

  async function run(url: string, label: string) {
    setBusy(label);
    setResult("");

    try {
      const res = await fetch(url, { method: "POST" });
      const json = await res.json();
      if (json?.ok) {
        setResult(`${label}: success`);
      } else {
        setResult(`${label}: failed`);
      }
    } catch {
      setResult(`${label}: failed`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-4 h-4 text-[#8A6A2F]" />
        <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/40">
          Admin Jobs
        </span>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => run("/api/admin/diagnostics/jobs/process", "Process Jobs")}
          disabled={!!busy}
          className="w-full flex items-center justify-between border border-white/10 px-4 py-3 hover:border-[#8A6A2F]/40"
        >
          <span className="text-[10px] font-mono uppercase tracking-wider">Process Jobs</span>
          <RefreshCcw className="w-4 h-4 text-[#8A6A2F]" />
        </button>

        <button
          onClick={() => run("/api/admin/diagnostics/retention/run", "Retention Sweep")}
          disabled={!!busy}
          className="w-full flex items-center justify-between border border-white/10 px-4 py-3 hover:border-[#8A6A2F]/40"
        >
          <span className="text-[10px] font-mono uppercase tracking-wider">Run Retention</span>
          <ArchiveRestore className="w-4 h-4 text-[#8A6A2F]" />
        </button>
      </div>

      {result ? (
        <div className="mt-4 text-[10px] text-white/45">{result}</div>
      ) : null}
    </div>
  );
}