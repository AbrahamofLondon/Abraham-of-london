/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/admin/inner-circle.tsx — BULLETPROOF (SSR-only, Export-safe, NextAuth client-only) */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";

// ⚠️ Do NOT import Layout here until Layout is audited.
// Layout is a frequent source of router usage during prerender.
const USE_LAYOUT = false as const;

let Layout: any = null;
if (USE_LAYOUT) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Layout = require("@/components/Layout").default;
}

function Shell({ children }: { children: React.ReactNode }) {
  if (!USE_LAYOUT) return <>{children}</>;
  return <Layout title="Inner Circle Admin">{children}</Layout>;
}

// ✅ HARD REQUIREMENT: Admin must NOT be statically exported.
export async function getServerSideProps() {
  return { props: {} };
}

type AdminRow = {
  id: string;
  created_at: string;
  status: "active" | "revoked" | "expired" | "pending";
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
  last_used_at?: string;
  member_name?: string;
  tier?: string;
};

type AdminStats = {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  totalUnlocks: number;
  averageUnlocksPerMember: number;
  dataRetentionDays: number;
  estimatedMemoryBytes: number;
  lastCleanup: string;
  storageType: string;
  uptimeDays: number;
  dailyActiveMembers: number;
  weeklyGrowthRate?: number;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type FilterState = {
  status?: string;
  search?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

const SECURITY_CONFIG = {
  sessionTimeout: 15 * 60 * 1000,
  maxApiRetries: 3,
  rateLimitWindow: 60000,
} as const;

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(ds: string) {
  try {
    return new Date(ds).toLocaleString();
  } catch {
    return ds;
  }
}

function getStatusColor(s: string) {
  const map: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    revoked: "bg-red-500/20 text-red-400",
    expired: "bg-yellow-500/20 text-yellow-400",
    pending: "bg-blue-500/20 text-blue-400",
  };
  return map[s] || "bg-gray-500/20 text-gray-400";
}

const AdminInnerCirclePage: NextPage = () => {
  const [mounted, setMounted] = React.useState(false);

  // NextAuth session client-only
  const [session, setSession] = React.useState<any>(null);
  const [sessionStatus, setSessionStatus] = React.useState<"loading" | "authenticated" | "unauthenticated">("loading");

  // State
  const [rows, setRows] = React.useState<AdminRow[]>([]);
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [pagination, setPagination] = React.useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });
  const [filters, setFilters] = React.useState<FilterState>({
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const [loading, setLoading] = React.useState(false);
  const [cleanupLoading, setCleanupLoading] = React.useState(false);
  const [exportLoading, setExportLoading] = React.useState(false);
  const [bulkActionLoading, setBulkActionLoading] = React.useState(false);

  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const [lastActivity, setLastActivity] = React.useState<number>(Date.now());
  const [adminKey, setAdminKey] = React.useState("");
  const [requiresReauth, setRequiresReauth] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => setMounted(true), []);

  // ✅ Client-only session load (prevents SSR/export from touching next-auth)
  React.useEffect(() => {
    if (!mounted) return;

    let alive = true;

    (async () => {
      try {
        const mod: any = await import("next-auth/react");
        const getSession = mod?.getSession as (() => Promise<any>) | undefined;

        if (!getSession) {
          if (alive) {
            setSession(null);
            setSessionStatus("unauthenticated");
          }
          return;
        }

        const s = await getSession();
        if (!alive) return;

        if (s?.user) {
          setSession(s);
          setSessionStatus("authenticated");
        } else {
          setSession(null);
          setSessionStatus("unauthenticated");
        }
      } catch {
        if (alive) {
          setSession(null);
          setSessionStatus("unauthenticated");
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [mounted]);

  // Session timeout check
  React.useEffect(() => {
    if (!mounted) return;

    const checkSession = () => {
      const now = Date.now();
      if (now - lastActivity > SECURITY_CONFIG.sessionTimeout) {
        setRequiresReauth(true);
      }
    };

    const interval = window.setInterval(checkSession, 30000);
    return () => window.clearInterval(interval);
  }, [mounted, lastActivity]);

  const updateActivity = () => {
    setLastActivity(Date.now());
    if (requiresReauth) setRequiresReauth(false);
  };

  const secureFetch = React.useCallback(
    async (endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> => {
      if ((!adminKey && !session?.user) || requiresReauth) {
        throw new Error(requiresReauth ? "Session expired. Re-authenticate." : "Authentication required");
      }

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(adminKey ? { "x-inner-circle-admin-key": adminKey } : {}),
        ...(session?.user?.id ? { "x-user-id": session.user.id } : {}),
      };

      try {
        const response = await fetch(endpoint, { ...options, headers });

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get("retry-after") || "30", 10);
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          if (retryCount < SECURITY_CONFIG.maxApiRetries) return secureFetch(endpoint, options, retryCount + 1);
        }

        if (response.status === 401 || response.status === 403) {
          setRequiresReauth(true);
          throw new Error("Authority denied. Verify admin key.");
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.error || `API error: ${response.status}`);
        return data;
      } catch (e) {
        if (retryCount < SECURITY_CONFIG.maxApiRetries) {
          await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
          return secureFetch(endpoint, options, retryCount + 1);
        }
        throw e;
      }
    },
    [adminKey, session, requiresReauth]
  );

  const loadData = React.useCallback(
    async (page = 1) => {
      if (!adminKey && !session?.user) return;

      updateActivity();
      setLoading(true);

      try {
        const queryParams = new URLSearchParams({
          page: String(page),
          limit: String(pagination.limit),
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.search ? { search: filters.search } : {}),
        });

        const data = await secureFetch(`/api/admin/inner-circle/export?${queryParams.toString()}`);

        if (data?.ok) {
          setRows(data.rows || []);
          setStats(data.stats || null);
          setPagination(
            data.pagination || {
              total: data.rows?.length || 0,
              page,
              limit: pagination.limit,
              totalPages: 1,
            }
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [adminKey, session, pagination.limit, filters, secureFetch]
  );

  React.useEffect(() => {
    if (!mounted) return;
    if (adminKey || session?.user) void loadData(1);
  }, [mounted, adminKey, session, loadData]);

  const handleExport = async (format: "csv" | "json" | "excel") => {
    if (!rows.length) return;
    updateActivity();
    setExportLoading(true);
    try {
      const data = await secureFetch(`/api/admin/inner-circle/export?format=${format}`);
      if (data?.ok && data?.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = `inner-circle-${new Date().toISOString().split("T")[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } finally {
      setExportLoading(false);
    }
  };

  const handleBulkAction = async (action: "revoke" | "reset" | "notify") => {
    if (selectedRows.size === 0) return;
    updateActivity();
    setBulkActionLoading(true);
    try {
      const data = await secureFetch("/api/admin/inner-circle/bulk-action", {
        method: "POST",
        body: JSON.stringify({ action, ids: Array.from(selectedRows) }),
      });
      if (data?.ok) {
        await loadData(pagination.page);
        setSelectedRows(new Set());
      }
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleRowAction = async (rowId: string, action: string, confirmMessage: string, confirmInput?: boolean) => {
    updateActivity();
    if (confirmInput) {
      const userInput = prompt(confirmMessage);
      if (!userInput) return;
      await secureFetch(`/api/admin/inner-circle/${action}`, {
        method: "POST",
        body: JSON.stringify({ id: rowId, input: userInput }),
      });
    } else {
      if (!window.confirm(confirmMessage)) return;
      await secureFetch(`/api/admin/inner-circle/${action}`, {
        method: "POST",
        body: JSON.stringify({ id: rowId }),
      });
    }
    await loadData(pagination.page);
  };

  const handleCleanup = async () => {
    updateActivity();
    if (!window.confirm("Run full system cleanup?")) return;
    setCleanupLoading(true);
    try {
      await secureFetch("/api/admin/inner-circle/cleanup", { method: "POST" });
      await loadData(pagination.page);
    } finally {
      setCleanupLoading(false);
    }
  };

  // SSR-safe shell (no window)
  if (!mounted) {
    return (
      <Shell>
        <Head>
          <title>Inner Circle Admin | Abraham of London</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-zinc-600">Initializing admin terminal…</div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Head>
        <title>Inner Circle Admin | Abraham of London</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="min-h-screen bg-[#050505] text-zinc-300" onClick={updateActivity}>
        <div className="border-b border-white/5 bg-zinc-950/50 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white">Inner Circle Registry</h1>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                Status: {stats?.storageType || "runtime"} infrastructure active
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Node: {session?.user?.email || "admin_bearer"}</p>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-1">
                Session Lock:{" "}
                {Math.max(0, Math.floor((SECURITY_CONFIG.sessionTimeout - (Date.now() - lastActivity)) / 60000))}m
              </p>
            </div>
          </div>
        </div>

        {/* AUTH GATE */}
        {sessionStatus === "loading" ? (
          <div className="flex h-[60vh] items-center justify-center text-zinc-600">
            Verifying credentials…
          </div>
        ) : !session?.user && !adminKey ? (
          <div className="flex h-[80vh] items-center justify-center bg-black">
            <div className="w-full max-w-md p-8 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white mb-6">Administrative Authority</h2>
              <input
                type="password"
                placeholder="Enter Admin Key"
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white mb-4"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
              />
              <button
                onClick={() => void loadData(1)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-black transition-all"
              >
                Verify Credentials
              </button>
              <p className="mt-4 text-xs text-zinc-500">
                Tip: admin pages are runtime SSR. If you’re running static export, this route must not be included.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8">
            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Members" value={stats.totalMembers} description={`${stats.activeMembers} active`} tone="amber" />
                <StatCard title="Active Keys" value={stats.activeKeys} description={`${stats.revokedKeys} revoked`} tone="green" />
                <StatCard title="Unlocks" value={stats.totalUnlocks} description={`${stats.averageUnlocksPerMember.toFixed(1)} avg`} tone="purple" />
                <StatCard title="Memory" value={formatBytes(stats.estimatedMemoryBytes)} description={`Uptime: ${stats.uptimeDays}d`} tone="zinc" />
              </div>
            ) : null}

            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 mb-8 flex items-center justify-between gap-4 flex-wrap">
              <input
                type="text"
                placeholder="Search keys, hashes, or status..."
                className="bg-black border border-white/5 rounded-xl px-4 py-2 w-[420px] max-w-full text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setFilters((f) => ({ ...f, search: e.target.value }));
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => void loadData(pagination.page)}
                  disabled={loading}
                  className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-xs font-black transition-all disabled:opacity-40"
                >
                  {loading ? "Sync…" : "Synchronize"}
                </button>
                <button
                  onClick={() => void handleExport("csv")}
                  disabled={exportLoading}
                  className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-xs font-black transition-all disabled:opacity-40"
                >
                  {exportLoading ? "Exporting…" : "Registry Export"}
                </button>
                <button
                  onClick={() => void handleCleanup()}
                  disabled={cleanupLoading}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-4 py-2 rounded-lg text-xs font-black transition-all disabled:opacity-40"
                >
                  {cleanupLoading ? "Pruning…" : "Prune Database"}
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/5 bg-zinc-950 shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <tr>
                    <th className="px-6 py-4">
                      <input
                        type="checkbox"
                        onChange={(e) => setSelectedRows(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
                      />
                    </th>
                    <th className="px-6 py-4">Established</th>
                    <th className="px-6 py-4">Integrity</th>
                    <th className="px-6 py-4">Key Suffix</th>
                    <th className="px-6 py-4">ID Hash</th>
                    <th className="px-6 py-4 text-center">Unlocks</th>
                    <th className="px-6 py-4">Operations</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={(e) => {
                            const s = new Set(selectedRows);
                            e.target.checked ? s.add(row.id) : s.delete(row.id);
                            setSelectedRows(s);
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">{formatDate(row.created_at)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${getStatusColor(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-400">*{row.key_suffix}</td>
                      <td className="px-6 py-4 font-mono text-[10px] text-zinc-600">{row.email_hash_prefix}…</td>
                      <td className="px-6 py-4 text-center font-black">{row.total_unlocks}</td>
                      <td className="px-6 py-4 flex gap-3">
                        {row.status === "active" ? (
                          <button
                            onClick={() => void handleRowAction(row.id, "revoke", `Revoke access for *${row.key_suffix}?`, true)}
                            className="text-[10px] font-black text-rose-400 hover:underline"
                          >
                            Burn
                          </button>
                        ) : null}
                        <button
                          onClick={() => void handleRowAction(row.id, "reset", "Reset unlock counter?", false)}
                          className="text-[10px] font-black text-amber-400 hover:underline"
                        >
                          Reset
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedRows.size > 0 ? (
                <div className="bg-rose-500/15 border-t border-rose-500/20 p-4 flex justify-between items-center">
                  <span className="text-rose-200 text-xs font-black uppercase tracking-widest">
                    {selectedRows.size} units selected
                  </span>
                  <button
                    onClick={() => void handleBulkAction("revoke")}
                    disabled={bulkActionLoading}
                    className="bg-rose-500 text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-tight disabled:opacity-40"
                  >
                    {bulkActionLoading ? "Executing…" : "Mass Revocation"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </Shell>
  );
};

function StatCard({ title, value, description, tone }: any) {
  const map: Record<string, string> = {
    amber: "border-amber-500/20 bg-amber-500/5",
    green: "border-green-500/20 bg-green-500/5",
    purple: "border-purple-500/20 bg-purple-500/5",
    zinc: "border-white/5 bg-white/[0.02]",
  };
  return (
    <div className={`rounded-3xl border p-6 ${map[tone] || map.zinc}`}>
      <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{title}</h3>
      <div className="text-3xl font-black text-white mb-1 tracking-tighter">{value}</div>
      <p className="text-[10px] font-mono text-zinc-500">{description}</p>
    </div>
  );
}

export default AdminInnerCirclePage;