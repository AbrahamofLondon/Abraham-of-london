// pages/admin/inner-circle/index.tsx
import * as React from "react";
import type { NextPage } from "next";

import Layout from "@/components/Layout";

interface AdminRow {
  created_at: string;
  status: string;
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
}

interface AdminStats {
  totalMembers: number;
  activeMembers: number;
  totalKeys: number;
  totalUnlocks: number;
  dataRetentionDays: number;
  estimatedMemoryBytes: number;
  lastCleanup: string;
}

const AdminInnerCirclePage: NextPage = () => {
  const [rows, setRows] = React.useState<AdminRow[]>([]);
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [adminKey, setAdminKey] = React.useState("");

  const loadData = React.useCallback(async () => {
    if (!adminKey) {
      setError("Admin key is required.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/inner-circle/export", {
        headers: {
          "x-inner-circle-admin-key": adminKey,
        },
      });

      const data = (await res.json()) as {
        ok: boolean;
        rows?: AdminRow[];
        stats?: AdminStats;
        error?: string;
      };

      if (!data.ok) {
        setError(data.error ?? "Failed to load data.");
        setRows([]);
        setStats(null);
        return;
      }

      setRows(data.rows ?? []);
      setStats(data.stats ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unexpected error loading data.",
      );
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  const handleDownloadCsv = () => {
    if (!rows.length) return;
    const header = ["created_at", "status", "key_suffix", "email_hash_prefix", "total_unlocks"];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [r.created_at, r.status, r.key_suffix, r.email_hash_prefix, r.total_unlocks].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inner-circle-keys.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title="Inner Circle Admin">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-6 border-b border-softGold/30 pb-4">
          <h1 className="font-serif text-2xl text-cream">
            Inner Circle · Admin Dashboard
          </h1>
          <p className="mt-1 text-xs text-softGold/80">
            Privacy-safe overview of Inner Circle keys and membership. Raw emails
            and full keys are never shown here.
          </p>
        </header>

        <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-softGold/80">
              Admin API key
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-softGold/40 bg-black/70 px-3 py-1.5 text-xs text-cream outline-none sm:w-72"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Paste INNER_CIRCLE_ADMIN_KEY"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading || !adminKey}
              className="rounded-full bg-softGold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black disabled:cursor-not-allowed disabled:bg-softGold/50"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={!rows.length}
              className="rounded-full border border-softGold/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-softGold/90 disabled:cursor-not-allowed disabled:border-softGold/20 disabled:text-softGold/40"
            >
              Export CSV
            </button>
          </div>
        </section>

        {error && (
          <p className="mb-4 text-xs text-red-400">
            {error}
          </p>
        )}

        {stats && (
          <section className="mb-6 grid gap-3 rounded-2xl border border-softGold/30 bg-black/50 p-4 text-xs text-softGold/80 sm:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-softGold/70">
                Members
              </p>
              <p className="mt-1 text-lg text-cream">
                {stats.totalMembers}
                <span className="ml-1 text-[11px] text-softGold/70">
                  ({stats.activeMembers} active)
                </span>
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-softGold/70">
                Keys
              </p>
              <p className="mt-1 text-lg text-cream">
                {stats.totalKeys}
                <span className="ml-1 text-[11px] text-softGold/70">
                  {stats.totalUnlocks} unlocks
                </span>
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-softGold/70">
                Retention & Memory
              </p>
              <p className="mt-1 text-[11px] text-softGold/80">
                Retention: {stats.dataRetentionDays} days
                <br />
                Last cleanup: {new Date(stats.lastCleanup).toLocaleString()}
              </p>
            </div>
          </section>
        )}

        <section className="overflow-x-auto rounded-2xl border border-softGold/30 bg-black/60">
          <table className="min-w-full text-left text-xs text-softGold/80">
            <thead className="border-b border-softGold/30 bg-black/80 text-[11px] uppercase tracking-[0.16em] text-softGold/70">
              <tr>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Key suffix</th>
                <th className="px-3 py-2">Email hash prefix</th>
                <th className="px-3 py-2 text-right">Unlocks</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    className="px-3 py-4 text-center text-[11px] text-softGold/60"
                    colSpan={5}
                  >
                    No records loaded. Enter your admin key and click Refresh.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr
                    key={`${row.created_at}-${row.key_suffix}-${idx}`}
                    className="border-t border-softGold/10"
                  >
                    <td className="px-3 py-2">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2 font-mono text-[11px]">
                      …{row.key_suffix}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px]">
                      {row.email_hash_prefix}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.total_unlocks}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>
    </Layout>
  );
};

export default AdminInnerCirclePage;
