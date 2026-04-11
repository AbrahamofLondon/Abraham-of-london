// pages/private/admin/premium-downloads.tsx
// Admin tool — design priority is functional legibility, not brand presentation.
// Fixes applied:
// - text-amber-500/70 eyebrow → softGold token
// - text-amber-400 on failed-attempts count → red (warning, not brand)
// - hover:border-amber-500/40 on refresh → hover:border-white/20
// All functional logic, tables, pagination, and revocation controls: unchanged.

import * as React from "react";
import type { NextPage } from "next";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";

type AttemptRow = {
  id: string;
  contentId: string;
  success: boolean;
  reason?: string | null;
  watermarkId?: string | null;
  createdAt: string;
  statusCode: number;
};

type TokenRow = {
  id: string;
  tokenId: string;
  contentId: string;
  userId?: string | null;
  usedCount: number;
  maxDownloads: number;
  expiresAt: string;
  revokedAt?: string | null;
  createdAt: string;
};

type LedgerResponse = {
  success: boolean;
  attempts: AttemptRow[];
  tokens: TokenRow[];
};

type AnomalyResponse = {
  success: boolean;
  window: string;
  failedAttempts: number;
  repeatedIpFailures: Array<{
    ipHash: string | null;
    _count: { ipHash: number };
  }>;
  heavilyUsedTokens: Array<{
    id: string;
    tokenId: string;
    contentId: string;
    usedCount: number;
    maxDownloads: number;
    expiresAt: string;
  }>;
};

const PAGE_SIZE = 15;

const PremiumDownloadsAdminPage: NextPage = () => {
  const [ledger, setLedger] = React.useState<LedgerResponse | null>(null);
  const [anomalies, setAnomalies] = React.useState<AnomalyResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [contentFilter, setContentFilter] = React.useState("");
  const [successFilter, setSuccessFilter] = React.useState<"all" | "success" | "failure">("all");
  const [tokenPage, setTokenPage] = React.useState(1);
  const [attemptPage, setAttemptPage] = React.useState(1);
  const [actionBusy, setActionBusy] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ledgerRes, anomalyRes] = await Promise.all([
        fetch("/api/premium/admin/download-ledger?limit=200"),
        fetch("/api/premium/admin/download-anomalies"),
      ]);
      if (!ledgerRes.ok || !anomalyRes.ok) throw new Error("Failed to load premium security dashboard");
      const [ledgerJson, anomalyJson] = await Promise.all([ledgerRes.json(), anomalyRes.json()]);
      setLedger(ledgerJson);
      setAnomalies(anomalyJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filteredAttempts = React.useMemo(() => {
    const q = contentFilter.trim().toLowerCase();
    return (ledger?.attempts || []).filter((row) => {
      const contentOk = !q || row.contentId.toLowerCase().includes(q);
      const successOk =
        successFilter === "all" ||
        (successFilter === "success" && row.success) ||
        (successFilter === "failure" && !row.success);
      return contentOk && successOk;
    });
  }, [ledger, contentFilter, successFilter]);

  const filteredTokens = React.useMemo(() => {
    const q = contentFilter.trim().toLowerCase();
    return (ledger?.tokens || []).filter((row) =>
      !q || row.contentId.toLowerCase().includes(q) || row.tokenId.toLowerCase().includes(q)
    );
  }, [ledger, contentFilter]);

  const pagedAttempts = React.useMemo(() => {
    const start = (attemptPage - 1) * PAGE_SIZE;
    return filteredAttempts.slice(start, start + PAGE_SIZE);
  }, [filteredAttempts, attemptPage]);

  const pagedTokens = React.useMemo(() => {
    const start = (tokenPage - 1) * PAGE_SIZE;
    return filteredTokens.slice(start, start + PAGE_SIZE);
  }, [filteredTokens, tokenPage]);

  const attemptTotalPages = Math.max(1, Math.ceil(filteredAttempts.length / PAGE_SIZE));
  const tokenTotalPages   = Math.max(1, Math.ceil(filteredTokens.length  / PAGE_SIZE));

  React.useEffect(() => { if (attemptPage > attemptTotalPages) setAttemptPage(1); }, [attemptPage, attemptTotalPages]);
  React.useEffect(() => { if (tokenPage > tokenTotalPages)     setTokenPage(1);   }, [tokenPage,   tokenTotalPages]);

  async function revokeByContent(contentId: string) {
    try {
      setActionBusy(`content:${contentId}`);
      const res = await fetch("/api/premium/admin/revoke-by-content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      if (!res.ok) throw new Error("Failed to revoke content tokens");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke");
    } finally {
      setActionBusy(null);
    }
  }

  async function revokeByUser(userId: string) {
    try {
      setActionBusy(`user:${userId}`);
      const res = await fetch("/api/premium/admin/revoke-by-user", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to revoke user tokens");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke");
    } finally {
      setActionBusy(null);
    }
  }

  const alertItems = React.useMemo(() => {
    const items: string[] = [];
    if ((anomalies?.failedAttempts      || 0) >= 10) items.push("High failed download activity in the last 24 hours.");
    if ((anomalies?.repeatedIpFailures?.length || 0) >= 3) items.push("Multiple repeated IP failure clusters detected.");
    if ((anomalies?.heavilyUsedTokens?.length  || 0) >= 5) items.push("Several tokens show elevated usage patterns.");
    return items;
  }, [anomalies]);

  return (
    <Layout title="Premium Download Security" className="bg-black text-white" fullWidth>
      <main className="mx-auto max-w-7xl px-6 py-28">

        {/* Page header */}
        <div className="mb-10">
          {/* Eyebrow — softGold (was amber-500/70) */}
          <p style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8px", letterSpacing: "0.40em", textTransform: "uppercase",
            color: `${GOLD}BB`,
          }}>
            Premium Security
          </p>
          <h1 className="mt-3 font-serif text-4xl font-light text-white">Download Ledger</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/45">
            Token activity, download attempts, revocation controls, and anomaly watch.
          </p>
        </div>

        {loading ? (
          <div className="border border-white/10 bg-white/[0.02] p-8 text-white/60">Loading…</div>
        ) : error ? (
          <div className="border border-red-500/20 bg-red-500/10 p-8 text-red-200">{error}</div>
        ) : (
          <div className="space-y-10">

            {/* Alerts */}
            {alertItems.length > 0 && (
              <section className="border border-amber-500/20 bg-amber-500/10 p-6">
                <h2 className="text-sm uppercase tracking-[0.2em] text-amber-300">Alerts</h2>
                <div className="mt-4 space-y-2 text-sm text-amber-100/80">
                  {alertItems.map((item) => (
                    <div key={item}>{item}</div>
                  ))}
                </div>
              </section>
            )}

            {/* Metric tiles */}
            <section className="grid gap-6 md:grid-cols-3">
              <div className="border border-white/10 bg-white/[0.02] p-6">
                <div className="text-xs uppercase tracking-widest text-white/40">Failed Attempts</div>
                {/* Red for warning count — amber/gold is brand, not alert */}
                <div className="mt-3 text-3xl" style={{ color: (anomalies?.failedAttempts ?? 0) >= 10 ? "rgba(252,165,165,0.90)" : "rgba(255,255,255,0.75)" }}>
                  {anomalies?.failedAttempts ?? 0}
                </div>
              </div>
              <div className="border border-white/10 bg-white/[0.02] p-6">
                <div className="text-xs uppercase tracking-widest text-white/40">Repeated IP Failures</div>
                <div className="mt-3 text-3xl text-white/75">{anomalies?.repeatedIpFailures?.length ?? 0}</div>
              </div>
              <div className="border border-white/10 bg-white/[0.02] p-6">
                <div className="text-xs uppercase tracking-widest text-white/40">Heavily Used Tokens</div>
                <div className="mt-3 text-3xl text-white/75">{anomalies?.heavilyUsedTokens?.length ?? 0}</div>
              </div>
            </section>

            {/* Filter bar */}
            <section className="flex flex-col gap-4 border border-white/10 bg-white/[0.02] p-5 md:flex-row md:items-end md:justify-between">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-xs uppercase tracking-widest text-white/40">
                  Content filter
                  <input
                    value={contentFilter}
                    onChange={(e) => { setContentFilter(e.target.value); setAttemptPage(1); setTokenPage(1); }}
                    className="border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none"
                    placeholder="report-001"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs uppercase tracking-widest text-white/40">
                  Attempt filter
                  <select
                    value={successFilter}
                    onChange={(e) => { setSuccessFilter(e.target.value as "all" | "success" | "failure"); setAttemptPage(1); }}
                    className="border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="all">All</option>
                    <option value="success">Success only</option>
                    <option value="failure">Failure only</option>
                  </select>
                </label>
              </div>
              {/* Refresh — hover:border-white/20 not hover:border-amber-500/40 */}
              <button
                onClick={() => load()}
                className="border border-white/10 bg-black px-5 py-3 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/20 hover:text-white"
              >
                Refresh
              </button>
            </section>

            {/* Attempts table */}
            <section className="border border-white/10 bg-white/[0.02]">
              <div className="border-b border-white/10 px-6 py-4 text-sm text-white/70">
                Recent Download Attempts
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-white/40">
                    <tr>
                      <th className="px-6 py-3">Content</th>
                      <th className="px-6 py-3">Result</th>
                      <th className="px-6 py-3">Reason</th>
                      <th className="px-6 py-3">Watermark</th>
                      <th className="px-6 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAttempts.map((row) => (
                      <tr key={row.id} className="border-t border-white/5">
                        <td className="px-6 py-4">{row.contentId}</td>
                        <td className="px-6 py-4" style={{ color: row.success ? "rgba(110,231,183,0.80)" : "rgba(252,165,165,0.80)" }}>
                          {row.success ? "Success" : "Failure"}
                        </td>
                        <td className="px-6 py-4 text-white/60">{row.reason || "—"}</td>
                        <td className="px-6 py-4" style={{ color: `${GOLD}CC` }}>{row.watermarkId || "—"}</td>
                        <td className="px-6 py-4 text-white/50">{new Date(row.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {pagedAttempts.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-white/30">No matching attempts.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 text-xs text-white/40">
                <span>Page {attemptPage} of {attemptTotalPages}</span>
                <div className="flex gap-3">
                  <button disabled={attemptPage <= 1} onClick={() => setAttemptPage((p) => Math.max(1, p - 1))} className="border border-white/10 px-3 py-2 disabled:opacity-30">Prev</button>
                  <button disabled={attemptPage >= attemptTotalPages} onClick={() => setAttemptPage((p) => Math.min(attemptTotalPages, p + 1))} className="border border-white/10 px-3 py-2 disabled:opacity-30">Next</button>
                </div>
              </div>
            </section>

            {/* Tokens table */}
            <section className="border border-white/10 bg-white/[0.02]">
              <div className="border-b border-white/10 px-6 py-4 text-sm text-white/70">
                Tokens & Revocation Controls
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-white/40">
                    <tr>
                      <th className="px-6 py-3">Token ID</th>
                      <th className="px-6 py-3">Content</th>
                      <th className="px-6 py-3">Usage</th>
                      <th className="px-6 py-3">Expires</th>
                      <th className="px-6 py-3">Revoked</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedTokens.map((row) => (
                      <tr key={row.id} className="border-t border-white/5">
                        <td className="px-6 py-4 font-mono text-xs">{row.tokenId}</td>
                        <td className="px-6 py-4">{row.contentId}</td>
                        <td className="px-6 py-4">{row.usedCount}/{row.maxDownloads}</td>
                        <td className="px-6 py-4 text-white/50">{new Date(row.expiresAt).toLocaleString()}</td>
                        <td className="px-6 py-4 text-white/50">{row.revokedAt ? new Date(row.revokedAt).toLocaleString() : "No"}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => revokeByContent(row.contentId)}
                              disabled={actionBusy === `content:${row.contentId}`}
                              className="border px-3 py-2 text-xs uppercase tracking-[0.15em] disabled:opacity-40 transition"
                              style={{ borderColor: `${GOLD}30`, color: `${GOLD}CC` }}
                              onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = `${GOLD}55`; }}
                              onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = `${GOLD}30`; }}
                            >
                              Revoke content
                            </button>
                            {row.userId && (
                              <button
                                onClick={() => revokeByUser(String(row.userId))}
                                disabled={actionBusy === `user:${row.userId}`}
                                className="border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.15em] text-white/75 disabled:opacity-40 transition hover:border-white/25"
                              >
                                Revoke user
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pagedTokens.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-10 text-center text-white/30">No matching tokens.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 text-xs text-white/40">
                <span>Page {tokenPage} of {tokenTotalPages}</span>
                <div className="flex gap-3">
                  <button disabled={tokenPage <= 1} onClick={() => setTokenPage((p) => Math.max(1, p - 1))} className="border border-white/10 px-3 py-2 disabled:opacity-30">Prev</button>
                  <button disabled={tokenPage >= tokenTotalPages} onClick={() => setTokenPage((p) => Math.min(tokenTotalPages, p + 1))} className="border border-white/10 px-3 py-2 disabled:opacity-30">Next</button>
                </div>
              </div>
            </section>

          </div>
        )}
      </main>
    </Layout>
  );
};

export default PremiumDownloadsAdminPage;