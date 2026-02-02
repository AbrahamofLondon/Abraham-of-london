/* pages/admin/inner-circle/index.tsx — THE CENTRAL COMMAND FOR INTELLIGENCE DISTRIBUTION */
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/useToast";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { auditLogger } from '@/lib/audit/audit-logger';

// Types
interface AdminRow {
  id: string;
  created_at: string;
  status: "active" | "revoked" | "expired" | "pending";
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
  last_used_at?: string;
  member_name?: string;
  tier?: string;
}

interface AdminStats {
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
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FilterState {
  status?: string;
  dateRange?: { start: string; end: string };
  search?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface SecurityConfig {
  requireReauthForSensitiveOps: boolean;
  sessionTimeout: number;
  maxApiRetries: number;
  rateLimitWindow: number;
}

const SECURITY_CONFIG: SecurityConfig = {
  requireReauthForSensitiveOps: true,
  sessionTimeout: 15 * 60 * 1000, // 15 minutes
  maxApiRetries: 3,
  rateLimitWindow: 60000, // 1 minute
};

const AdminInnerCirclePage: NextPage = () => {
  const { data: session, status: sessionStatus } = useSession();
  const { toast } = useToast();
  
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
  const [_apiRetries, setApiRetries] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Session timeout check
  React.useEffect(() => {
    const checkSession = () => {
      const now = Date.now();
      if (now - lastActivity > SECURITY_CONFIG.sessionTimeout) {
        setRequiresReauth(true);
        toast.warning("Session expired", "Please re-authenticate to continue");
      }
    };

    const interval = setInterval(checkSession, 30000); 
    return () => clearInterval(interval);
  }, [lastActivity, toast]);

  const updateActivity = () => {
    setLastActivity(Date.now());
    if (requiresReauth) setRequiresReauth(false);
  };

  const secureFetch = React.useCallback(async (
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<any> => {
    if (!adminKey && !session?.user) throw new Error("Authentication required");
    if (requiresReauth) throw new Error("Session expired. Please re-authenticate.");

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(adminKey && { "x-inner-circle-admin-key": adminKey }),
        ...(session?.user?.id && { "x-user-id": session.user.id }),
      };

      const response = await fetch(endpoint, { ...options, headers });

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("retry-after") || "30");
        toast.warning("Rate limited", `Waiting ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        if (retryCount < SECURITY_CONFIG.maxApiRetries) return secureFetch(endpoint, options, retryCount + 1);
      }

      if (response.status === 401 || response.status === 403) {
        setRequiresReauth(true);
        throw new Error("Authority Denied. Verify Admin Key.");
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `API error: ${response.status}`);
      return data;
    } catch (error) {
      if (retryCount < SECURITY_CONFIG.maxApiRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return secureFetch(endpoint, options, retryCount + 1);
      }
      throw error;
    }
  }, [adminKey, session, requiresReauth, toast]);

  const loadData = React.useCallback(async (page = 1) => {
    if (!adminKey && !session?.user) return;

    updateActivity();
    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      });

      const data = await secureFetch(`/api/admin/inner-circle/export?${queryParams}`);

      if (data.ok) {
        setRows(data.rows || []);
        setStats(data.stats || null);
        setPagination(data.pagination || { total: data.rows?.length || 0, page, limit: pagination.limit, totalPages: 1 });
        
        await auditLogger.log({
          action: "admin_data_load",
          userId: session?.user?.id || "admin",
          details: { page, rowCount: data.rows?.length || 0 },
          severity: "info",
        });
      }
    } catch (error) {
      toast.error("Load failed", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [adminKey, session, pagination.limit, filters, toast, secureFetch]);

  const handleExport = async (format: "csv" | "json" | "excel") => {
    if (!rows.length) return;
    updateActivity();
    setExportLoading(true);
    try {
      const data = await secureFetch(`/api/admin/inner-circle/export?format=${format}`);
      if (data.ok && data.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = `inner-circle-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Export Complete");
      }
    } catch (error) {
      toast.error("Export Failed");
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
      if (data.ok) {
        toast.success("Bulk Action Synchronized");
        await loadData(pagination.page);
        setSelectedRows(new Set());
      }
    } catch (error) {
      toast.error("Action Failed");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleRowAction = async (rowId: string, action: string, confirmMessage: string, confirmInput?: boolean) => {
    updateActivity();
    if (confirmInput) {
      const userInput = prompt(confirmMessage);
      if (!userInput) return;
      await secureFetch(`/api/admin/inner-circle/${action}`, { method: "POST", body: JSON.stringify({ id: rowId, input: userInput }) });
    } else {
      if (!window.confirm(confirmMessage)) return;
      await secureFetch(`/api/admin/inner-circle/${action}`, { method: "POST", body: JSON.stringify({ id: rowId }) });
    }
    toast.success(`${action} applied`);
    await loadData(pagination.page);
  };

  const handleCleanup = async () => {
    updateActivity();
    if (!window.confirm("Run full system cleanup?")) return;
    setCleanupLoading(true);
    try {
      const data = await secureFetch("/api/admin/inner-circle/cleanup", { method: "POST" });
      if (data.ok) toast.success("System Optimized");
      await loadData(pagination.page);
    } finally {
      setCleanupLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024, sizes = ["Bytes", "KB", "MB", "GB"], i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (ds: string) => new Date(ds).toLocaleString();

  const getStatusColor = (s: string) => {
    const map = { active: "bg-green-500/20 text-green-400", revoked: "bg-red-500/20 text-red-400", expired: "bg-yellow-500/20 text-yellow-400", pending: "bg-blue-500/20 text-blue-400" };
    return map[s as keyof typeof map] || "bg-gray-500/20 text-gray-400";
  };

  React.useEffect(() => { if (adminKey || session?.user) loadData(1); }, [adminKey, session, loadData]);

  if (sessionStatus === "loading") return <Layout title="Admin"><div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div></Layout>;

  if (!session?.user && !adminKey) {
    return (
      <Layout title="Secure Access">
        <div className="flex h-screen items-center justify-center bg-black">
          <div className="w-full max-w-md p-8 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-xl">
            <h1 className="text-xl font-bold text-white mb-6">Administrative Authority</h1>
            <input type="password" placeholder="Enter Admin Key" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white mb-4" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} />
            <button onClick={() => loadData(1)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all">Verify Credentials</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ErrorBoundary fallback={<div className="p-20 text-white">Critical Terminal Error.</div>}>
      <Layout title="Inner Circle Admin">
        <Head><title>Admin Dashboard | AOL</title><meta name="robots" content="noindex, nofollow" /></Head>
        <main className="min-h-screen bg-[#050505] text-zinc-300" onClick={updateActivity}>
          
          <div className="border-b border-white/5 bg-zinc-950/50 px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black tracking-tighter text-white">Inner Circle Registry</h1>
                <p className="text-xs text-zinc-500 font-mono mt-1">Status: {stats?.storageType} Infrastructure Active</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Node: {session?.user?.email || 'admin_bearer'}</p>
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-1">Session Lock: {Math.max(0, Math.floor((SECURITY_CONFIG.sessionTimeout - (Date.now() - lastActivity)) / 60000))}m</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Intelligence Assets" value={stats.totalMembers} description={`${stats.activeMembers} verified units`} color="blue" />
                <StatCard title="Cryptographic Keys" value={stats.activeKeys} description={`${stats.revokedKeys} burned`} color="green" />
                <StatCard title="Knowledge Unlocks" value={stats.totalUnlocks} description={`${stats.averageUnlocksPerMember.toFixed(1)} avg/member`} color="purple" />
                <StatCard title="Memory Footprint" value={formatBytes(stats.estimatedMemoryBytes)} description={`Uptime: ${stats.uptimeDays}d`} color="yellow" />
              </div>
            )}

            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 mb-8 flex items-center justify-between">
              <input type="text" placeholder="Search keys, hashes, or status..." className="bg-black border border-white/5 rounded-xl px-4 py-2 w-96 text-sm" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setFilters(f => ({ ...f, search: e.target.value })); }} />
              <div className="flex gap-3">
                <button onClick={() => loadData(pagination.page)} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-xs font-bold transition-all">Synchronize</button>
                <button onClick={() => handleExport("csv")} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-xs font-bold transition-all">Registry Export</button>
                <button onClick={handleCleanup} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-4 py-2 rounded-lg text-xs font-bold transition-all">Prune Database</button>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/5 bg-zinc-950 shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <tr>
                    <th className="px-6 py-4"><input type="checkbox" onChange={(e) => setSelectedRows(e.target.checked ? new Set(rows.map(r => r.id)) : new Set())} /></th>
                    <th className="px-6 py-4">Established</th>
                    <th className="px-6 py-4">Integrity</th>
                    <th className="px-6 py-4">Key Suffix</th>
                    <th className="px-6 py-4">ID Hash</th>
                    <th className="px-6 py-4 text-center">Engagement</th>
                    <th className="px-6 py-4">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map(row => (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4"><input type="checkbox" checked={selectedRows.has(row.id)} onChange={(e) => { const s = new Set(selectedRows); e.target.checked ? s.add(row.id) : s.delete(row.id); setSelectedRows(s); }} /></td>
                      <td className="px-6 py-4 text-xs font-mono">{formatDate(row.created_at)}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(row.status)}`}>{row.status}</span></td>
                      <td className="px-6 py-4 font-mono text-zinc-400">*{row.key_suffix}</td>
                      <td className="px-6 py-4 font-mono text-[10px] text-zinc-600">{row.email_hash_prefix}...</td>
                      <td className="px-6 py-4 text-center font-bold">{row.total_unlocks}</td>
                      <td className="px-6 py-4 flex gap-2">
                        {row.status === "active" && <button onClick={() => handleRowAction(row.id, "revoke", `Revoke access for *${row.key_suffix}?`, true)} className="text-[10px] font-bold text-rose-500 hover:underline">Burn</button>}
                        <button onClick={() => handleRowAction(row.id, "reset", "Reset unlock counter?", false)} className="text-[10px] font-bold text-amber-500 hover:underline">Reset</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedRows.size > 0 && (
                <div className="bg-rose-500 p-4 flex justify-between items-center">
                  <span className="text-white text-xs font-black uppercase tracking-widest">{selectedRows.size} Units Selected</span>
                  <button onClick={() => handleBulkAction("revoke")} className="bg-black text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter">Execute Mass Revocation</button>
                </div>
              )}
            </div>
          </div>
        </main>
      </Layout>
    </ErrorBoundary>
  );
};

const StatCard = ({ title, value, description, color }: any) => {
  const map = { blue: "border-blue-500/20 bg-blue-500/5", green: "border-green-500/20 bg-green-500/5", purple: "border-purple-500/20 bg-purple-500/5", yellow: "border-yellow-500/20 bg-yellow-500/5" };
  return (
    <div className={`rounded-3xl border p-6 ${map[color as keyof typeof map]}`}>
      <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{title}</h3>
      <div className="text-3xl font-black text-white mb-1 tracking-tighter">{value}</div>
      <p className="text-[10px] font-mono text-zinc-500">{description}</p>
    </div>
  );
};

export default AdminInnerCirclePage;