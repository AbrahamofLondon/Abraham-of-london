"use client";

import * as React from "react";
import { FileText, RefreshCw, ShieldAlert } from "lucide-react";

type ReportItem = {
  id: string;
  artifactType: string;
  version: string | null;
  createdAt: string;
  regeneratedAt: string | null;
  revokedAt: string | null;
  retentionClass: string | null;
  storagePath: string | null;
};

export function MyReportsPanel() {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<ReportItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/my-reports");
      const json = await res.json();

      if (!res.ok || !json?.ok) {
        setError(json?.reason || "FAILED");
        return;
      }

      setItems(Array.isArray(json.reports) ? json.reports : []);
    } catch {
      setError("NETWORK_ERROR");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="border border-white/10 bg-white/[0.02] p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#8A6A2F]" />
          <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/40">
            My Reports
          </span>
        </div>

        <button
          onClick={() => void load()}
          className="text-white/30 hover:text-[#8A6A2F] transition-colors"
          aria-label="Refresh reports"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-[10px] font-mono uppercase tracking-wider text-white/30">
          Loading reports...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-red-400">
          <ShieldAlert className="h-4 w-4" />
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="text-[10px] font-mono uppercase tracking-wider text-white/30">
          No reports yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border border-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-white">
                    {item.artifactType}
                  </div>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-wider text-white/30">
                    {item.version || "v1"} • {new Date(item.createdAt).toLocaleDateString("en-GB")}
                  </div>
                </div>

                <div className="text-[10px] font-mono uppercase tracking-wider text-[#8A6A2F]">
                  {item.revokedAt ? "Revoked" : "Active"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}