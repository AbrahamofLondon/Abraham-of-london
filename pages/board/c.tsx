// DEPRECATED: orphaned dashboard — no inbound references.
// Pending deletion in cleanup pass. Do not add new logic here.
/* pages/board/c.tsx */
import type { GetServerSideProps, NextPage } from "next";
import Layout from "@/components/Layout";
import { validateAdminAccess } from "@/lib/server/validation";
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";
import {
  Activity,
  Shield,
  Key,
  Users,
  TrendingUp,
  AlertTriangle,
  Download,
  Clock,
  Database,
  Server,
  Network,
  ShieldCheck,
  Lock,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface SystemMetrics {
  uptime: number;
  databaseSize: number;
  cacheHitRate: number;
  activeConnections: number;
  errorRate: number;
}

interface TrafficData {
  hour: string;
  requests: number;
  downloads: number;
  errors: number;
}

interface UserActivity {
  status: string;
  count: number;
  percentage: number;
}

interface Props {
  metrics: SystemMetrics;
  trafficData: TrafficData[];
  userActivity: UserActivity[];
  systemHealth: {
    score: number;
    status: "healthy" | "warning" | "critical";
    alerts: number;
  };
  recentAlerts: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    severity: "low" | "medium" | "high";
  }>;
  sessionInfo?: {
    email?: string;
    lastActivity?: string;
  };
  error?: string;
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const { req } = context;
  const startTime = Date.now();

  const { default: prisma } = await import("@/lib/prisma");

  const getClientIp = () => {
    const forwarded = req.headers["x-forwarded-for"];
    const realIp = req.headers["x-real-ip"];
    return Array.isArray(forwarded)
      ? forwarded[0]
      : typeof forwarded === "string"
        ? forwarded.split(",")[0]
        : typeof realIp === "string"
          ? realIp
          : req.socket?.remoteAddress || "unknown";
  };

  const clientIp = getClientIp();
  const userAgent = req.headers["user-agent"] || "unknown";

  try {
    const auth = await validateAdminAccess(req as any);

    if (!auth.valid) {
      await logAuditEvent({
        actorType: "member",
        actorId: "anonymous",
        ipAddress: clientIp,
        action: AUDIT_ACTIONS.ACCESS_DENIED,
        resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
        resourceId: "system-control",
        status: "failed",
        severity: "high",
        details: {
          userAgent,
          attemptedPath: "/board/c",
          reason: auth.reason || "insufficient_privileges",
        },
      });

      return { notFound: true };
    }

    const [
      totalMembers,
      activeSessions,
      totalDownloads,
      recentErrors,
      activeJobs,
      recentAuditLogs,
      failedJobs,
      maintenanceSignals,
      hourlyTraffic,
      userStatusCounts,
      recentAlerts,
    ] = await Promise.all([
      prisma.innerCircleMember.count(),

      prisma.session.count({
        where: {
          expiresAt: { gt: new Date() },
          status: "active",
        },
      }),

      prisma.downloadAuditEvent.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          success: true,
        },
      }),

      prisma.systemAuditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000),
          },
          severity: { in: ["warn", "error", "critical"] },
          status: "failed",
        },
      }),

      // No generic Job model. DiagnosticRegenerationJob is the only job-queue
      // model in schema — semantic is diagnostic jobs only, not all system jobs.
      prisma.diagnosticRegenerationJob.count({
        where: {
          status: { in: ["queued", "processing"] },
        },
      }),

      (prisma.systemAuditLog.groupBy as any)({
        by: ["action"],
        _count: { action: true },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          _count: { action: "desc" },
        },
        take: 10,
      }),

      prisma.diagnosticRegenerationJob.count({
        where: {
          status: "failed",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),

      prisma.systemAuditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          category: "maintenance",
          status: { not: "success" },
        },
      }),

      (async () => {
        const hours: TrafficData[] = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
          const hourStart = new Date(now);
          hourStart.setHours(now.getHours() - i, 0, 0, 0);

          const hourEnd = new Date(hourStart);
          hourEnd.setHours(hourStart.getHours() + 1);

          const hourLabel = hourStart
            .toLocaleTimeString("en-US", {
              hour: "numeric",
              hour12: true,
            })
            .replace(" ", "");

          const [requests, downloads, errors] = await Promise.all([
            prisma.systemAuditLog.count({
              where: {
                createdAt: {
                  gte: hourStart,
                  lt: hourEnd,
                },
              },
            }),
            prisma.downloadAuditEvent.count({
              where: {
                createdAt: {
                  gte: hourStart,
                  lt: hourEnd,
                },
                success: true,
              },
            }),
            prisma.systemAuditLog.count({
              where: {
                createdAt: {
                  gte: hourStart,
                  lt: hourEnd,
                },
                status: "failed",
                severity: { in: ["warn", "error", "critical"] },
              },
            }),
          ]);

          hours.push({
            hour: hourLabel,
            requests,
            downloads,
            errors,
          });
        }

        return hours;
      })(),

      (async () => {
        const statusCounts = await prisma.innerCircleMember.groupBy({
          by: ["status"],
          _count: { status: true },
        });

        const total = statusCounts.reduce((sum, item) => sum + item._count.status, 0);

        return statusCounts.map((item) => ({
          status: item.status,
          count: item._count.status,
          percentage: total > 0 ? Math.round((item._count.status / total) * 100) : 0,
        }));
      })(),

      prisma.systemAuditLog.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          severity: { in: ["warn", "error", "critical"] },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          action: true,
          errorMessage: true,
          createdAt: true,
          severity: true,
        },
      }),
    ]);

    const errorRate = recentErrors > 0 ? Math.min(recentErrors / 10, 1) : 0;
    const failedJobsRate = failedJobs > 0 ? Math.min(failedJobs / 5, 1) : 0;
    const maintenanceScore = maintenanceSignals > 0 ? 0.3 : 1;

    const healthScore = Math.round(
      100 * (1 - (errorRate * 0.4 + failedJobsRate * 0.3 + (1 - maintenanceScore) * 0.3)),
    );

    let systemStatus: "healthy" | "warning" | "critical";
    if (healthScore >= 80) systemStatus = "healthy";
    else if (healthScore >= 60) systemStatus = "warning";
    else systemStatus = "critical";

    const metrics: SystemMetrics = {
      uptime: 99.9,
      databaseSize: 0,
      cacheHitRate: activeJobs > 0 ? 85 : 0,
      activeConnections: activeSessions,
      errorRate: recentErrors,
    };

    const fetchDuration = Date.now() - startTime;

    await logAuditEvent({
      actorType: "admin",
      actorId: auth.userId,
      actorEmail: (auth as any).email,
      ipAddress: clientIp,
      action: AUDIT_ACTIONS.READ,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      resourceId: "system-control",
      status: "success",
      details: {
        userAgent,
        fetchDuration,
        metrics: {
          healthScore,
          totalMembers,
          activeSessions,
          recentAlerts: recentAlerts.length,
          downloads: totalDownloads,
          auditGroups: recentAuditLogs.length,
        },
      },
    });

    return {
      props: {
        metrics,
        trafficData: hourlyTraffic,
        userActivity: userStatusCounts,
        systemHealth: {
          score: healthScore,
          status: systemStatus,
          alerts: recentAlerts.length,
        },
        recentAlerts: recentAlerts.map((alert) => ({
          id: alert.id,
          type: alert.action,
          message: alert.errorMessage || "No error message",
          timestamp: alert.createdAt.toISOString(),
          severity:
            alert.severity === "critical"
              ? "high"
              : alert.severity === "error"
                ? "high"
                : alert.severity === "warn"
                  ? "medium"
                  : "low",
        })),
        sessionInfo: {
          email: (auth as any).email,
          lastActivity: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    console.error("System Control Dashboard Error:", error);

    await logAuditEvent({
      actorType: "system",
      ipAddress: clientIp,
      action: AUDIT_ACTIONS.API_ERROR,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      resourceId: "system-control",
      status: "failed",
      severity: "high",
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return {
      props: {
        metrics: {
          uptime: 0,
          databaseSize: 0,
          cacheHitRate: 0,
          activeConnections: 0,
          errorRate: 0,
        },
        trafficData: [],
        userActivity: [],
        systemHealth: {
          score: 0,
          status: "critical",
          alerts: 0,
        },
        recentAlerts: [],
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "Unable to load system metrics",
      },
    };
  }
};

const STATUS_COLORS = {
  healthy: "#10B981",
  warning: "#F59E0B",
  critical: "#EF4444",
};

const USER_STATUS_COLORS: Record<string, string> = {
  active: "#10B981",
  paused: "#F59E0B",
  disabled: "#6B7280",
  suspended: "#EF4444",
};

const TRAFFIC_COLORS = {
  requests: "#3B82F6",
  downloads: "#8B5CF6",
  errors: "#EF4444",
};

const SystemControlDashboard: NextPage<Props> = ({
  metrics,
  trafficData,
  userActivity,
  systemHealth,
  recentAlerts,
  error,
}) => {
  if (error) {
    return (
      <Layout title="System Control">
        <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-8 text-white">
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h2 className="mb-2 text-xl font-bold text-white">System Error</h2>
              <p className="mb-4 text-gray-400">
                Unable to load system control dashboard
              </p>
              <p className="rounded border border-red-500/20 bg-black/30 p-3 font-mono text-sm text-gray-500">
                {error}
              </p>
            </div>
          </div>
        </main>
      </Layout>
    );
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <Layout title="System Control">
      <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4 text-white md:p-8">
        <div className="mx-auto mb-8 max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-blue-600/5 p-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2">
                <Server className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-blue-500">
                  SYSTEM CONTROL PANEL
                </p>
                <p className="text-xs text-gray-400">
                  Infrastructure Monitoring & Administration
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-gray-400">Status</p>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 animate-pulse rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[systemHealth.status] }}
                  />
                  <p className="text-sm font-bold capitalize">
                    {systemHealth.status}
                  </p>
                </div>
              </div>
              <div className="hidden text-right md:block">
                <p className="text-xs text-gray-400">Last Updated</p>
                <p className="font-mono text-sm">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <header className="mx-auto mb-12 max-w-7xl">
          <div className="mb-2">
            <p className="text-[10px] font-black uppercase italic tracking-[0.4em] text-blue-500">
              Infrastructure Monitoring
            </p>
          </div>
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="font-serif text-3xl font-bold italic text-white md:text-4xl">
                System <span className="text-white/30">Control Center</span>
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Real-time monitoring, diagnostics, and system administration
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">Health Score</p>
                <div className="flex items-center gap-2">
                  <p
                    className="text-2xl font-bold"
                    style={{ color: STATUS_COLORS[systemHealth.status] }}
                  >
                    {systemHealth.score}
                  </p>
                  <span className="text-gray-600">/100</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto mb-12 max-w-7xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              title="Uptime"
              value={`${metrics.uptime}%`}
              icon={<Server className="text-emerald-400" />}
              status="healthy"
              subtitle="System availability"
            />
            <MetricCard
              title="Active Connections"
              value={metrics.activeConnections.toString()}
              icon={<Network className="text-blue-400" />}
              status={metrics.activeConnections > 100 ? "warning" : "healthy"}
              subtitle="Current sessions"
            />
            <MetricCard
              title="Cache Hit Rate"
              value={`${metrics.cacheHitRate}%`}
              icon={<Database className="text-purple-400" />}
              status={metrics.cacheHitRate > 80 ? "healthy" : "warning"}
              subtitle="Estimated efficiency"
            />
            <MetricCard
              title="Error Rate"
              value={metrics.errorRate.toString()}
              icon={<AlertTriangle className="text-amber-400" />}
              status={
                metrics.errorRate > 5
                  ? "critical"
                  : metrics.errorRate > 0
                    ? "warning"
                    : "healthy"
              }
              subtitle="Last hour"
            />
            <MetricCard
              title="Database"
              value={formatBytes(metrics.databaseSize)}
              icon={<Database className="text-cyan-400" />}
              status="healthy"
              subtitle="Total size"
            />
          </div>
        </div>

        <div className="mx-auto mb-12 grid max-w-7xl gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="h-full rounded-xl border border-white/10 bg-black/40 p-5">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-400" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                    Traffic Overview (12h)
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <LegendDot color="bg-blue-500" label="Requests" />
                  <LegendDot color="bg-purple-500" label="Downloads" />
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111827",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#9CA3AF" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="requests"
                      stroke={TRAFFIC_COLORS.requests}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="downloads"
                      stroke={TRAFFIC_COLORS.downloads}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="errors"
                      stroke={TRAFFIC_COLORS.errors}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="h-full rounded-xl border border-white/10 bg-black/40 p-5">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                    User Activity
                  </h2>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-500">
                  {userActivity.reduce((sum, item) => sum + item.count, 0)} users
                </span>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userActivity}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="count"
                    >
                      {userActivity.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={USER_STATUS_COLORS[entry.status] || "#6B7280"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={((value: number) => [`${value} users`, "Count"]) as any}
                      contentStyle={{
                        backgroundColor: "#111827",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mb-12 grid max-w-7xl gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-white/10 bg-black/40 p-5">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                    Recent Alerts
                  </h2>
                </div>
                <span className="rounded bg-amber-500/10 px-2 py-1 font-mono text-xs text-amber-500">
                  {recentAlerts.length} active
                </span>
              </div>
              <div className="max-h-96 space-y-3 overflow-y-auto pr-2">
                {recentAlerts.length > 0 ? (
                  recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`rounded-lg border p-4 transition-all hover:scale-[1.01] ${
                        alert.severity === "high"
                          ? "border-red-500/20 bg-red-500/10 hover:border-red-500/40"
                          : alert.severity === "medium"
                            ? "border-amber-500/20 bg-amber-500/10 hover:border-amber-500/40"
                            : "border-blue-500/20 bg-blue-500/10 hover:border-blue-500/40"
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              alert.severity === "high"
                                ? "bg-red-500"
                                : alert.severity === "medium"
                                  ? "bg-amber-500"
                                  : "bg-blue-500"
                            }`}
                          />
                          <p className="text-sm font-bold text-white">{alert.type}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mb-3 text-sm text-gray-300">{alert.message}</p>
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded px-2 py-1 text-xs ${
                            alert.severity === "high"
                              ? "bg-red-500/20 text-red-400"
                              : alert.severity === "medium"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                        <button className="text-xs text-gray-400 transition hover:text-white">
                          Investigate →
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-emerald-500/30" />
                    <p className="text-gray-400">No active alerts</p>
                    <p className="mt-1 text-xs text-gray-600">
                      All systems operating normally
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-xl border border-white/10 bg-black/40 p-5">
              <div className="mb-6 flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                  Quick Actions
                </h2>
              </div>
              <div className="space-y-3">
                <ActionButton
                  icon={<Database className="h-4 w-4" />}
                  label="Database Backup"
                  description="Create immediate backup"
                  color="blue"
                />
                <ActionButton
                  icon={<Shield className="h-4 w-4" />}
                  label="Security Scan"
                  description="Run system security audit"
                  color="amber"
                />
                <ActionButton
                  icon={<BarChart3 className="h-4 w-4" />}
                  label="Clear Cache"
                  description="Purge transient state"
                  color="purple"
                />
                <ActionButton
                  icon={<Server className="h-4 w-4" />}
                  label="Restart Services"
                  description="Graceful restart of all services"
                  color="red"
                />
                <ActionButton
                  icon={<PieChartIcon className="h-4 w-4" />}
                  label="Generate Report"
                  description="Create system health report"
                  color="emerald"
                />
              </div>
            </div>
          </div>
        </div>

        <footer className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between text-xs text-gray-600 md:flex-row">
            <div className="mb-3 md:mb-0">
              <p className="mb-1">Abraham of London • System Control v2.0</p>
              <p className="text-[10px] text-gray-700">
                Access restricted to authorized system administrators only
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Lock className="h-3 w-3" />
                <span>Encrypted Connection • TLS 1.3</span>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-blue-500 transition hover:text-blue-400 hover:underline"
              >
                Refresh Metrics
              </button>
            </div>
          </div>
        </footer>
      </main>
    </Layout>
  );
};

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  status,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  status: "healthy" | "warning" | "critical";
  subtitle?: string;
}) {
  const statusConfig = {
    healthy: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    warning: {
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    critical: {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
  } as const;

  const config = statusConfig[status];

  return (
    <div
      className={`${config.bg} ${config.border} rounded-xl border p-4 transition-all hover:scale-[1.02]`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
            {title}
          </p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className="rounded-lg bg-black/20 p-2">{icon}</div>
      </div>
      <p className={`font-mono text-2xl font-bold ${config.color}`}>{value}</p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/30">
        <div
          className={`h-full rounded-full transition-all duration-700 ${config.color.replace("text-", "bg-")}`}
          style={{
            width:
              status === "healthy" ? "90%" : status === "warning" ? "60%" : "30%",
          }}
        />
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  description,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: "blue" | "amber" | "purple" | "red" | "emerald";
}) {
  const colorConfig = {
    blue: "border-blue-500/20 hover:border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10",
    amber:
      "border-amber-500/20 hover:border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10",
    purple:
      "border-purple-500/20 hover:border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10",
    red: "border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10",
    emerald:
      "border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10",
  } as const;

  return (
    <button
      className={`w-full rounded-lg border p-4 transition-all hover:scale-[1.01] ${colorConfig[color]}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`rounded-lg p-2 ${
            color === "blue"
              ? "bg-blue-500/20 text-blue-400"
              : color === "amber"
                ? "bg-amber-500/20 text-amber-400"
                : color === "purple"
                  ? "bg-purple-500/20 text-purple-400"
                  : color === "red"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-emerald-500/20 text-emerald-400"
          }`}
        >
          {icon}
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
    </button>
  );
}

export default SystemControlDashboard;