// app/admin/boardroom-delivery/page.tsx
// Admin delivery console for Boardroom Dossiers.

"use client";

import * as React from "react";
import Link from "next/link";

type DossierRecord = {
  id: string;
  title: string;
  qualifiedForBoard: boolean;
  status: string;
  clientEmail?: string;
  clientName?: string;
  viewCount: number;
  createdAt: string;
  accessGrantedAt?: string;
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-white/8 text-white/50 border-white/10",
  APPROVED: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  DELIVERED: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  REVOKED: "bg-red-500/10 text-red-300 border-red-500/20",
};

export default function BoardroomDeliveryPage() {
  const [dossiers, setDossiers] = React.useState<DossierRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [grantEmail, setGrantEmail] = React.useState("");
  const [grantName, setGrantName] = React.useState("");
  const [activeDossierId, setActiveDossierId] = React.useState<string | null>(null);

  const loadDossiers = async () => {
    try {
      const res = await fetch("/api/admin/boardroom-delivery");
      const data = await res.json();
      if (data.ok) setDossiers(data.dossiers);
      else setError(data.error);
    } catch {
      setError("Failed to load");
    }
    setLoading(false);
  };

  React.useEffect(() => { loadDossiers(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/boardroom-delivery/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spineId: "foundry-fixture-qualifying-001" }),
      });
      const data = await res.json();
      if (data.ok) {
        await loadDossiers();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Generation failed");
    }
    setGenerating(false);
  };

  const handleGrantAccess = async (dossierId: string) => {
    if (!grantEmail) return;
    try {
      const res = await fetch("/api/admin/boardroom-delivery/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossierId, clientEmail: grantEmail, clientName: grantName || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        await loadDossiers();
        setGrantEmail("");
        setGrantName("");
        setActiveDossierId(null);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Grant failed");
    }
  };

  const handleRevokeAccess = async (dossierId: string) => {
    try {
      const res = await fetch("/api/admin/boardroom-delivery/revoke-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossierId }),
      });
      const data = await res.json();
      if (data.ok) await loadDossiers();
      else setError(data.error);
    } catch {
      setError("Revoke failed");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link href="/admin/intelligence-foundry" className="text-[11px] text-white/25 hover:text-white/45 font-mono">
          ← Foundry
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-white/80">Boardroom Delivery Console</h1>
        <p className="text-sm text-white/35 max-w-xl">
          Generate, approve, deliver, and manage client-facing Boardroom Dossiers.
        </p>
      </div>

      {/* Generate */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-4">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-lg border border-amber-400/25 bg-amber-400/5 px-4 py-2 text-xs text-amber-300/80 hover:bg-amber-400/10 transition-all disabled:opacity-40"
        >
          {generating ? "Generating..." : "Generate Dossier from Fixture"}
        </button>
        <p className="text-[10px] text-white/25 mt-2">Generates a dossier using the qualifying spine fixture. Production will use real diagnostic data.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">{error}</div>
      )}

      {/* Dossier list */}
      {loading ? (
        <p className="text-sm text-white/30 font-mono">Loading...</p>
      ) : dossiers.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/2 p-8 text-center">
          <p className="text-sm text-white/30">No dossiers yet. Generate one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dossiers.map((d) => (
            <div key={d.id} className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-widest ${STATUS_STYLE[d.status] ?? ""}`}>
                      {d.status}
                    </span>
                    <span className="text-xs text-white/50">{d.title}</span>
                  </div>
                  <div className="flex gap-4 text-[10px] font-mono text-white/25">
                    <span>Views: {d.viewCount}</span>
                    <span>Created: {new Date(d.createdAt).toLocaleDateString()}</span>
                    {d.clientEmail && <span>Client: {d.clientEmail}</span>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {d.status === "DRAFT" && (
                  <button
                    onClick={() => setActiveDossierId(activeDossierId === d.id ? null : d.id)}
                    className="rounded border border-white/10 px-3 py-1 text-[10px] text-white/50 hover:text-white/70"
                  >
                    {activeDossierId === d.id ? "Cancel" : "Grant Access"}
                  </button>
                )}
                {d.status === "DELIVERED" && (
                  <button
                    onClick={() => handleRevokeAccess(d.id)}
                    className="rounded border border-red-500/20 px-3 py-1 text-[10px] text-red-400/70 hover:text-red-400"
                  >
                    Revoke Access
                  </button>
                )}
                <a
                  href={`/boardroom/dossier/${d.id}?email=${d.clientEmail ?? "test@example.com"}`}
                  target="_blank"
                  className="rounded border border-white/10 px-3 py-1 text-[10px] text-white/50 hover:text-white/70"
                >
                  Preview
                </a>
              </div>

              {/* Grant access form */}
              {activeDossierId === d.id && (
                <div className="border-t border-white/8 pt-3 space-y-2">
                  <input
                    type="email"
                    placeholder="Client email"
                    value={grantEmail}
                    onChange={(e) => setGrantEmail(e.target.value)}
                    className="w-full rounded border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/70 placeholder:text-white/20"
                  />
                  <input
                    type="text"
                    placeholder="Client name (optional)"
                    value={grantName}
                    onChange={(e) => setGrantName(e.target.value)}
                    className="w-full rounded border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/70 placeholder:text-white/20"
                  />
                  <button
                    onClick={() => handleGrantAccess(d.id)}
                    className="rounded bg-emerald-400/15 px-3 py-1.5 text-[10px] text-emerald-300/80 hover:bg-emerald-400/20"
                  >
                    Grant & Deliver
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
