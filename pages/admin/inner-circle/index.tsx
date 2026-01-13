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

// Security configuration
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
  const [apiRetries, setApiRetries] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showBulkActions, setShowBulkActions] = React.useState(false);

  // Session timeout check
  React.useEffect(() => {
    const checkSession = () => {
      const now = Date.now();
      if (now - lastActivity > SECURITY_CONFIG.sessionTimeout) {
        setRequiresReauth(true);
        toast.warning("Session expired", "Please re-authenticate to continue");
      }
    };

    const interval = setInterval(checkSession, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [lastActivity, toast]);

  // Update activity timestamp on user interaction
  const updateActivity = () => {
    setLastActivity(Date.now());
    if (requiresReauth) setRequiresReauth(false);
  };

  // Secure API call wrapper
  const secureFetch = async (
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<any> => {
    if (!adminKey && !session?.user) {
      throw new Error("Authentication required");
    }

    if (requiresReauth) {
      throw new Error("Session expired. Please re-authenticate.");
    }

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(adminKey && { "x-inner-circle-admin-key": adminKey }),
        ...(session?.user?.id && { "x-user-id": session.user.id }),
      };

      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("retry-after") || "30");
        toast.warning("Rate limited", `Please wait ${retryAfter} seconds before trying again`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        if (retryCount < SECURITY_CONFIG.maxApiRetries) {
          return secureFetch(endpoint, options, retryCount + 1);
        }
      }

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        setRequiresReauth(true);
        throw new Error("Authentication failed. Please check your credentials.");
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (retryCount < SECURITY_CONFIG.maxApiRetries) {
        console.warn(`API call failed, retrying (${retryCount + 1}/${SECURITY_CONFIG.maxApiRetries})`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return secureFetch(endpoint, options, retryCount + 1);
      }
      throw error;
    }
  };

  // Load data with filters and pagination
  const loadData = React.useCallback(async (page = 1) => {
    if (!adminKey && !session?.user) {
      toast.error("Authentication required", "Please provide admin key or log in");
      return;
    }

    updateActivity();
    setLoading(true);
    setApiRetries(0);

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateRange?.start && { startDate: filters.dateRange.start }),
        ...(filters.dateRange?.end && { endDate: filters.dateRange.end }),
      });

      const data = await secureFetch(`/api/admin/inner-circle/export?${queryParams}`);

      if (data.ok) {
        setRows(data.rows || []);
        setStats(data.stats || null);
        setPagination(data.pagination || {
          total: data.rows?.length || 0,
          page,
          limit: pagination.limit,
          totalPages: 1,
        });

        // Log successful data load
        await auditLogger.log({
          action: "admin_data_load",
          userId: session?.user?.id || "admin",
          details: {
            page,
            filters,
            rowCount: data.rows?.length || 0,
          },
          severity: "info",
        });

        toast.success("Data loaded", `Loaded ${data.rows?.length || 0} records`);
      } else {
        throw new Error(data.error || "Failed to load data");
      }
    } catch (error) {
      console.error("Load data error:", error);
      toast.error("Load failed", error instanceof Error ? error.message : "Unknown error");
      
      // Log failure
      await auditLogger.log({
        action: "admin_data_load_failed",
        userId: session?.user?.id || "admin",
        details: { error: error instanceof Error ? error.message : "Unknown" },
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [adminKey, session, pagination.limit, filters, toast]);

  // Export functionality
  const handleExport = async (format: "csv" | "json" | "excel") => {
    if (!rows.length) {
      toast.warning("No data", "No records to export");
      return;
    }

    updateActivity();
    setExportLoading(true);

    try {
      const data = await secureFetch(`/api/admin/inner-circle/export?format=${format}`);

      if (data.ok && data.url) {
        // Create download link
        const a = document.createElement("a");
        a.href = data.url;
        a.download = `inner-circle-export-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Log export
        await auditLogger.log({
          action: "admin_export",
          userId: session?.user?.id || "admin",
          details: { format, rowCount: rows.length },
          severity: "info",
        });

        toast.success("Export complete", `Downloaded ${format.toUpperCase()} file`);
      } else {
        throw new Error(data.error || "Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setExportLoading(false);
    }
  };

  // Bulk operations
  const handleBulkAction = async (action: "revoke" | "reset" | "notify") => {
    if (selectedRows.size === 0) {
      toast.warning("No selection", "Please select at least one record");
      return;
    }

    updateActivity();
    setBulkActionLoading(true);

    try {
      const data = await secureFetch("/api/admin/inner-circle/bulk-action", {
        method: "POST",
        body: JSON.stringify({
          action,
          ids: Array.from(selectedRows),
        }),
      });

      if (data.ok) {
        const actionResults = data.results || {};
        const successCount = actionResults.success || 0;
        const failCount = actionResults.failed || 0;

        // Log bulk action
        await auditLogger.log({
          action: `admin_bulk_${action}`,
          userId: session?.user?.id || "admin",
          details: {
            total: selectedRows.size,
            success: successCount,
            failed: failCount,
            failedIds: actionResults.failedIds,
          },
          severity: "info",
        });

        if (failCount === 0) {
          toast.success("Bulk action complete", `${successCount} records updated`);
        } else {
          toast.warning("Partial success", `${successCount} succeeded, ${failCount} failed`);
        }

        // Refresh data
        await loadData(pagination.page);
        setSelectedRows(new Set());
      } else {
        throw new Error(data.error || "Bulk action failed");
      }
    } catch (error) {
      console.error("Bulk action error:", error);
      toast.error("Bulk action failed", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Single row actions with confirmation
  const handleRowAction = async (
    rowId: string,
    action: string,
    confirmMessage: string,
    confirmInput?: boolean
  ) => {
    updateActivity();

    if (SECURITY_CONFIG.requireReauthForSensitiveOps && requiresReauth) {
      const confirmed = window.confirm("Session expired. Re-authenticate?");
      if (confirmed) {
        setAdminKey("");
        setRequiresReauth(false);
        return;
      }
    }

    let userInput: string | null = null;
    if (confirmInput) {
      userInput = prompt(confirmMessage);
      if (!userInput) return;
    } else {
      if (!window.confirm(confirmMessage)) return;
    }

    try {
      const endpoint = `/api/admin/inner-circle/${action}`;
      const body = userInput 
        ? JSON.stringify({ id: rowId, input: userInput })
        : JSON.stringify({ id: rowId });

      const data = await secureFetch(endpoint, {
        method: "POST",
        body,
      });

      if (data.ok) {
        await auditLogger.log({
          action: `admin_${action}`,
          userId: session?.user?.id || "admin",
          details: { rowId, success: true },
          severity: "info",
        });

        toast.success("Action completed", `${action} successful`);
        await loadData(pagination.page);
      } else {
        throw new Error(data.error || `${action} failed`);
      }
    } catch (error) {
      console.error(`${action} error:`, error);
      toast.error("Action failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  // Cleanup with progress indicator
  const handleCleanup = async () => {
    updateActivity();

    if (!window.confirm(
      "Run data cleanup? This will:\n" +
      "• Delete members inactive for > retention period\n" +
      "• Remove expired keys\n" +
      "• Optimize database\n\n" +
      "This action cannot be undone."
    )) return;

    setCleanupLoading(true);

    try {
      const data = await secureFetch("/api/admin/inner-circle/cleanup", {
        method: "POST",
      });

      if (data.ok) {
        await auditLogger.log({
          action: "admin_cleanup",
          userId: session?.user?.id || "admin",
          details: data.stats,
          severity: "info",
        });

        toast.success(
          "Cleanup complete",
          `Freed ${formatBytes(data.stats?.freedSpace || 0)}`
        );
        await loadData(pagination.page);
      } else {
        throw new Error(data.error || "Cleanup failed");
      }
    } catch (error) {
      console.error("Cleanup error:", error);
      toast.error("Cleanup failed", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setCleanupLoading(false);
    }
  };

  // Utility functions
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-green-500/20 text-green-400",
      revoked: "bg-red-500/20 text-red-400",
      expired: "bg-yellow-500/20 text-yellow-400",
      pending: "bg-blue-500/20 text-blue-400",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500/20 text-gray-400";
  };

  // Initial load
  React.useEffect(() => {
    if (adminKey || session?.user) {
      loadData(1);
    }
  }, [adminKey, session, loadData]);

  // Session loading state
  if (sessionStatus === "loading") {
    return (
      <Layout title="Inner Circle Admin">
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" message="Verifying session..." />
        </div>
      </Layout>
    );
  }

  // Authorization check
  if (!session?.user && !adminKey) {
    return (
      <Layout title="Access Denied">
        <div className="flex h-96 flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-red-400">Access Denied</h1>
            <p className="mb-6 text-gray-400">
              You need administrator privileges to access this page.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Key
                </label>
                <input
                  type="password"
                  className="w-full max-w-md rounded-lg border border-gray-600 bg-gray-900 px-4 py-2 text-white"
                  placeholder="Enter admin key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                />
              </div>
              <button
                onClick={() => loadData(1)}
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium hover:bg-blue-700"
              >
                Authenticate
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ErrorBoundary fallback={<AdminErrorFallback />}>
      <Layout title="Inner Circle Admin">
        <Head>
          <title>Inner Circle Admin Dashboard</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>

        <main 
          className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100"
          onClick={updateActivity}
          onKeyDown={updateActivity}
        >
          {/* Top Bar */}
          <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 py-4">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h1 className="text-2xl font-bold">Inner Circle Admin</h1>
                  <p className="text-sm text-gray-400">
                    Secure management dashboard • {stats?.storageType || "Memory"} storage
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {session?.user && (
                    <div className="text-sm text-gray-400">
                      Logged in as: <span className="font-medium">{session.user.email}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Session expires in: {Math.max(0, Math.floor((SECURITY_CONFIG.sessionTimeout - (Date.now() - lastActivity)) / 60000))}m
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-8">
            {/* Authentication Section */}
            {!session?.user && (
              <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
                <h2 className="mb-4 text-lg font-medium">Authentication</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Admin Key
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white"
                      placeholder="Enter your admin key"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Store your key securely. It will be cleared on logout.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Dashboard */}
            {stats && (
              <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Members"
                  value={stats.totalMembers}
                  change={stats.weeklyGrowthRate}
                  description={`${stats.activeMembers} active • ${stats.pendingMembers} pending`}
                  color="blue"
                />
                <StatCard
                  title="Active Keys"
                  value={stats.activeKeys}
                  description={`${stats.totalKeys} total • ${stats.revokedKeys} revoked`}
                  color="green"
                />
                <StatCard
                  title="Total Unlocks"
                  value={stats.totalUnlocks}
                  description={`${stats.averageUnlocksPerMember.toFixed(1)} avg per member`}
                  color="purple"
                />
                <StatCard
                  title="System Status"
                  value={formatBytes(stats.estimatedMemoryBytes)}
                  description={`Uptime: ${stats.uptimeDays}d • Last cleanup: ${formatDate(stats.lastCleanup)}`}
                  color="yellow"
                />
              </div>
            )}

            {/* Filters and Actions */}
            <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search keys, emails, or status..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setFilters(prev => ({ ...prev, search: e.target.value }));
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => loadData(pagination.page)}
                    disabled={loading}
                    className="rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Refreshing..." : "Refresh"}
                  </button>
                  <button
                    onClick={() => handleExport("csv")}
                    disabled={exportLoading || !rows.length}
                    className="rounded-lg border border-gray-700 px-4 py-2 hover:bg-gray-800 disabled:opacity-50"
                  >
                    {exportLoading ? "Exporting..." : "Export CSV"}
                  </button>
                  <button
                    onClick={handleCleanup}
                    disabled={cleanupLoading}
                    className="rounded-lg border border-red-700 bg-red-900/20 px-4 py-2 text-red-400 hover:bg-red-900/40 disabled:opacity-50"
                  >
                    {cleanupLoading ? "Cleaning..." : "Run Cleanup"}
                  </button>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-hidden rounded-xl border border-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        <input
                          type="checkbox"
                          checked={selectedRows.size === rows.length && rows.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows(new Set(rows.map(r => r.id)));
                            } else {
                              setSelectedRows(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        Key
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        Email Hash
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        Unlocks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                    {rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-800/30">
                        <td className="whitespace-nowrap px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedRows);
                              if (e.target.checked) {
                                newSelected.add(row.id);
                              } else {
                                newSelected.delete(row.id);
                              }
                              setSelectedRows(newSelected);
                            }}
                          />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {formatDate(row.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-mono text-sm">
                          ...{row.key_suffix}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-gray-400">
                          {row.email_hash_prefix}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center font-medium">
                          {row.total_unlocks}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex gap-2">
                            {row.status === "active" && (
                              <button
                                onClick={() => handleRowAction(
                                  row.id,
                                  "revoke",
                                  `Revoke key ending with ${row.key_suffix}?`,
                                  true
                                )}
                                className="rounded-lg bg-red-900/30 px-3 py-1 text-xs text-red-400 hover:bg-red-900/50"
                              >
                                Revoke
                              </button>
                            )}
                            <button
                              onClick={() => handleRowAction(
                                row.id,
                                "reset",
                                `Reset unlocks for this key?`,
                                false
                              )}
                              className="rounded-lg bg-yellow-900/30 px-3 py-1 text-xs text-yellow-400 hover:bg-yellow-900/50"
                            >
                              Reset
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bulk Actions Bar */}
              {selectedRows.size > 0 && (
                <div className="border-t border-gray-800 bg-gray-900 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      {selectedRows.size} selected
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBulkAction("revoke")}
                        disabled={bulkActionLoading}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        Revoke Selected
                      </button>
                      <button
                        onClick={() => setSelectedRows(new Set())}
                        className="rounded-lg border border-gray-700 px-4 py-2 text-sm"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="border-t border-gray-800 bg-gray-900 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadData(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="rounded-lg border border-gray-700 px-4 py-2 hover:bg-gray-800 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => loadData(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="rounded-lg border border-gray-700 px-4 py-2 hover:bg-gray-800 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </Layout>
    </ErrorBoundary>
  );
};

// Supporting components
const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  description: string;
  color: "blue" | "green" | "purple" | "yellow" | "red";
}> = ({ title, value, change, description, color }) => {
  const colorClasses = {
    blue: "border-blue-500/20 bg-blue-500/10",
    green: "border-green-500/20 bg-green-500/10",
    purple: "border-purple-500/20 bg-purple-500/10",
    yellow: "border-yellow-500/20 bg-yellow-500/10",
    red: "border-red-500/20 bg-red-500/10",
  };

  return (
    <div className={`rounded-xl border p-6 ${colorClasses[color]}`}>
      <h3 className="mb-2 text-sm font-medium text-gray-400">{title}</h3>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {change !== undefined && (
          <span className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
};

const AdminErrorFallback: React.FC = () => (
  <Layout title="Admin Error">
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold text-red-400">Admin Dashboard Error</h1>
        <p className="mb-6 text-gray-400">
          The admin dashboard encountered an error. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium hover:bg-blue-700"
        >
          Reload Dashboard
        </button>
      </div>
    </div>
  </Layout>
);

export default AdminInnerCirclePage;