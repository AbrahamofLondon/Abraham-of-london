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
  const [cleanupLoading, setCleanupLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [adminKey, setAdminKey] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    if (!adminKey) {
      setError("Admin key is required.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

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
      setSuccessMessage(`Loaded ${data.rows?.length || 0} records`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unexpected error loading data."
      );
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  const handleDownloadCsv = () => {
    if (!rows.length) return;
    const header = [
      "created_at",
      "status",
      "key_suffix",
      "email_hash_prefix",
      "total_unlocks",
    ];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.created_at,
          r.status,
          r.key_suffix,
          r.email_hash_prefix,
          r.total_unlocks,
        ].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inner-circle-keys-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMessage(`Exported ${rows.length} records to CSV`);
  };

  const handleRevokeKey = async (key: string) => {
    if (!adminKey) {
      setError("Admin key is required.");
      return;
    }
    
    const keySuffix = key.slice(-4);
    if (!confirm(`Are you sure you want to revoke key ending with ${keySuffix}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/inner-circle/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-inner-circle-admin-key": adminKey,
        },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();
      
      if (data.ok && data.revoked) {
        setSuccessMessage(`Key ending with ${keySuffix} revoked successfully`);
        loadData(); // Refresh the list
      } else {
        setError(data.error || "Failed to revoke key");
      }
    } catch (err) {
      setError("Error revoking key");
    }
  };

  const handleRunCleanup = async () => {
    if (!adminKey) {
      setError("Admin key is required.");
      return;
    }
    
    if (!confirm("Run cleanup of old data? This will delete members and keys older than the retention period.")) {
      return;
    }

    setCleanupLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const res = await fetch("/api/admin/inner-circle/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-inner-circle-admin-key": adminKey,
        },
      });

      const data = await res.json();
      
      if (data.ok) {
        if (data.stats) {
          setSuccessMessage(
            `Cleanup completed: ${data.stats.deletedMembers} members and ${data.stats.deletedKeys} keys deleted. ${data.message || ""}`
          );
        } else {
          setSuccessMessage(data.message || "Cleanup completed successfully");
        }
        loadData(); // Refresh the list
      } else {
        setError(data.error || "Failed to run cleanup");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error running cleanup");
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleDeleteMember = async (email: string) => {
    if (!adminKey) {
      setError("Admin key is required.");
      return;
    }
    
    if (!email) {
      setError("Email is required.");
      return;
    }
    
    if (!confirm(`Delete member with email: ${email}? This will also delete all their keys.`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/inner-circle/delete-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-inner-circle-admin-key": adminKey,
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      
      if (data.ok && data.deleted) {
        setSuccessMessage(`Member ${email} deleted successfully`);
        loadData(); // Refresh the list
      } else {
        setError(data.error || "Failed to delete member");
      }
    } catch (err) {
      setError("Error deleting member");
    }
  };

  // Auto-load data when admin key changes (optional)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (adminKey && adminKey.length > 10) {
        loadData();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [adminKey, loadData]);

  return (
    <Layout title="Inner Circle Admin">
      <main className="mx-auto max-w-7xl px-4 py-10">
        <header className="mb-6 border-b border-softGold/30 pb-4">
          <h1 className="font-serif text-3xl text-cream">
            Inner Circle · Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-softGold/80">
            Privacy-safe overview of Inner Circle keys and membership. Raw
            emails and full keys are never shown here.
          </p>
          <p className="mt-1 text-xs text-softGold/60">
            Store: {process.env.NEXT_PUBLIC_INNER_CIRCLE_STORE || 'memory'} | 
            Environment: {process.env.NODE_ENV}
          </p>
        </header>

        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2 flex-1">
              <label className="block text-sm font-medium text-softGold/80">
                Admin API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  className="flex-1 rounded-lg border border-softGold/40 bg-black/70 px-4 py-2.5 text-sm text-cream outline-none focus:border-softGold/80 focus:ring-1 focus:ring-softGold/40"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Paste INNER_CIRCLE_ADMIN_KEY from .env.local"
                />
                <button
                  type="button"
                  onClick={() => {
                    setAdminKey('');
                    setRows([]);
                    setStats(null);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="rounded-lg border border-softGold/30 bg-black/50 px-4 py-2.5 text-sm text-softGold/70 hover:bg-black/70"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadData}
                disabled={loading || !adminKey}
                className="rounded-full bg-softGold px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-black transition-colors hover:bg-softGold/90 disabled:cursor-not-allowed disabled:bg-softGold/50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-ping rounded-full bg-black"></span>
                    Loading...
                  </span>
                ) : (
                  "Refresh Data"
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={!rows.length}
                className="rounded-full border border-softGold/50 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-softGold/90 transition-colors hover:border-softGold/80 hover:text-softGold/100 disabled:cursor-not-allowed disabled:border-softGold/20 disabled:text-softGold/40"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleRunCleanup}
                disabled={cleanupLoading || !adminKey}
                className="rounded-full border border-red-500/50 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-red-400 transition-colors hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:border-red-500/20 disabled:text-red-500/40"
              >
                {cleanupLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-ping rounded-full bg-red-400"></span>
                    Cleaning...
                  </span>
                ) : (
                  "Run Cleanup"
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <p className="text-sm text-green-300">{successMessage}</p>
            </div>
          )}
        </section>

        {stats && (
          <section className="mb-8 grid gap-4 rounded-2xl border border-softGold/30 bg-black/50 p-6 text-sm text-softGold/80 md:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-softGold/70">
                Total Members
              </p>
              <p className="mt-2 text-2xl font-semibold text-cream">
                {stats.totalMembers}
              </p>
              <p className="mt-1 text-xs text-softGold/60">
                {stats.activeMembers} active
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-softGold/70">
                Total Keys
              </p>
              <p className="mt-2 text-2xl font-semibold text-cream">
                {stats.totalKeys}
              </p>
              <p className="mt-1 text-xs text-softGold/60">
                {stats.totalUnlocks} total unlocks
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-softGold/70">
                Data Retention
              </p>
              <p className="mt-2 text-2xl font-semibold text-cream">
                {stats.dataRetentionDays} days
              </p>
              <p className="mt-1 text-xs text-softGold/60">
                Auto-cleanup enabled
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-softGold/70">
                System Status
              </p>
              <p className="mt-2 text-lg font-semibold text-cream">
                {stats.estimatedMemoryBytes > 0 ? "Healthy" : "No Data"}
              </p>
              <p className="mt-1 text-xs text-softGold/60">
                Last cleanup: {new Date(stats.lastCleanup).toLocaleDateString()}
              </p>
            </div>
          </section>
        )}

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl text-cream">
              Key Management
            </h2>
            <div className="text-xs text-softGold/60">
              Showing {rows.length} records
            </div>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-softGold/30 bg-black/60">
            <table className="min-w-full text-left text-sm text-softGold/80">
              <thead className="border-b border-softGold/30 bg-black/80 text-xs uppercase tracking-[0.16em] text-softGold/70">
                <tr>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Key Suffix</th>
                  <th className="px-4 py-3">Email Hash Prefix</th>
                  <th className="px-4 py-3 text-right">Unlocks</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-sm text-softGold/60"
                      colSpan={6}
                    >
                      {adminKey ? (
                        loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="h-2 w-2 animate-ping rounded-full bg-softGold"></span>
                            Loading records...
                          </div>
                        ) : (
                          "No records found. Keys may have expired or been cleaned up."
                        )
                      ) : (
                        "Enter your admin key above to load records."
                      )}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr
                      key={`${row.created_at}-${row.key_suffix}-${idx}`}
                      className="border-t border-softGold/10 hover:bg-softGold/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-xs text-softGold/60">
                          {new Date(row.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs">
                          {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          row.status === 'active' 
                            ? 'bg-green-500/20 text-green-400'
                            : row.status === 'revoked'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">
                        ...{row.key_suffix}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.email_hash_prefix}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {row.total_unlocks}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.status === "active" && (
                          <button
                            onClick={() => {
                              const fullKey = prompt(
                                `Enter the full key to revoke (last 4 chars: ${row.key_suffix}):\n\nWarning: This action cannot be undone.`,
                                ""
                              );
                              if (fullKey && fullKey.trim()) {
                                handleRevokeKey(fullKey.trim());
                              }
                            }}
                            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {stats && stats.totalMembers > 0 && (
          <section className="rounded-2xl border border-softGold/30 bg-black/50 p-6">
            <h2 className="mb-4 font-serif text-xl text-cream">
              Member Management
            </h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-softGold/20 bg-black/30 p-4">
                <h3 className="mb-2 text-sm font-medium text-cream">
                  Delete Member by Email
                </h3>
                <p className="mb-3 text-xs text-softGold/60">
                  Enter the exact email address of the member you want to delete.
                  This will remove all their data including all keys.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="member@example.com"
                    className="flex-1 rounded-lg border border-softGold/40 bg-black/70 px-4 py-2 text-sm text-cream outline-none"
                    id="delete-email-input"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('delete-email-input') as HTMLInputElement;
                      const email = input?.value?.trim();
                      if (email) {
                        handleDeleteMember(email);
                        input.value = '';
                      }
                    }}
                    className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
                  >
                    Delete Member
                  </button>
                </div>
              </div>
              
              <div className="rounded-lg border border-softGold/20 bg-black/30 p-4">
                <h3 className="mb-2 text-sm font-medium text-cream">
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(adminKey);
                      setSuccessMessage('Admin key copied to clipboard');
                    }}
                    className="rounded-lg border border-softGold/30 bg-black/50 px-3 py-1.5 text-xs text-softGold/70 hover:bg-black/70"
                  >
                    Copy Admin Key
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // FIXED: Remove console.log for production
                      // Data can be accessed via the rows and stats state variables
                      setSuccessMessage('Data available in state variables');
                    }}
                    className="rounded-lg border border-softGold/30 bg-black/50 px-3 py-1.5 text-xs text-softGold/70 hover:bg-black/70"
                  >
                    View Data
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
};

export default AdminInnerCirclePage;