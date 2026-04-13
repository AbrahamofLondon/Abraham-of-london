/* pages/board/intelligence.tsx */
import type { GetServerSideProps, NextPage } from "next";
import Layout from "@/components/Layout";
import { validateAdminAccess } from "@/lib/server/validation";
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from "@/lib/server/audit";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ShieldAlert,
  Users,
  Zap,
  TrendingUp,
  Lock,
  Activity,
  Download,
  Eye,
} from "lucide-react";
import prisma from "@/lib/prisma";

type EngagementRow = {
  shortSlug: string;
  viewCount: number;
};

type AuditTrendRow = {
  action: string;
  _count: number;
};

type ContentEngagementRow = {
  name: string;
  value: number;
  downloads: number;
};

type StrategicHealthReport = {
  summary: {
    totalMembers: number;
    activeKeys: number;
    recentIntakes: number;
    recentDownloads: number;
    perimeterBreaches: number;
  };
  engagement: EngagementRow[];
  auditTrends: AuditTrendRow[];
  contentEngagement: ContentEngagementRow[];
};

interface Props {
  report: StrategicHealthReport | null;
  error?: string;
  sessionInfo?: {
    email?: string;
    lastActivity?: string;
  };
}

async function getAnalyticsData(): Promise<StrategicHealthReport | null> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalMembers,
      activeKeys,
      recentIntakes,
      recentDownloads,
      pageViewRows,
      auditData,
      contentMetadata,
      recentRateLimitBlocks,
    ] = await Promise.all([
      prisma.innerCircleMember.count(),

      prisma.innerCircleKey.count({
        where: {
          status: "active",
          expiresAt: { gt: new Date() },
          revokedAt: null,
        },
      }),

      prisma.strategyIntake.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      prisma.downloadAuditEvent.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          success: true,
        },
      }),

      (prisma.pageView.groupBy as any)({
        by: ["path"],
        _count: { path: true },
        where: {
          createdAt: { gte: thirtyDaysAgo },
          path: { not: null },
        },
        orderBy: {
          _count: { path: "desc" },
        },
        take: 10,
      }),

      (prisma.systemAuditLog.groupBy as any)({
        by: ["action"],
        _count: { action: true },
        where: {
          createdAt: { gte: thirtyDaysAgo },
          severity: { in: ["warn", "error", "critical"] },
        },
        orderBy: {
          _count: { action: "desc" },
        },
        take: 8,
      }),

      prisma.contentMetadata.findMany({
        orderBy: { viewCount: "desc" },
        take: 5,
        select: {
          slug: true,
          viewCount: true,
          downloadCount: true,
        },
      }),

      prisma.rateLimitLog.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          allowed: false,
        },
      }),
    ]);

    const engagement: EngagementRow[] = pageViewRows.map((item: any) => ({
      shortSlug: item.path || "unknown",
      viewCount: item._count.path,
    }));

    const auditTrends: AuditTrendRow[] = (auditData as any[]).map((item: any) => ({
      action: item.action,
      _count: item._count.action,
    }));

    const contentEngagement: ContentEngagementRow[] = contentMetadata.map((item) => ({
      name: item.slug,
      value: item.viewCount,
      downloads: item.downloadCount,
    }));

    return {
      summary: {
        totalMembers,
        activeKeys,
        recentIntakes,
        recentDownloads,
        perimeterBreaches: recentRateLimitBlocks,
      },
      engagement,
      auditTrends,
      contentEngagement,
    };
  } catch (error) {
    console.error("Analytics data fetch error:", error);
    return null;
  }
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const { req } = context;
  const startTime = Date.now();

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
        resourceType: AUDIT_CATEGORIES.ADMIN_ACTION,
        resourceId: "board-intelligence",
        status: "failed",
        severity: "high",
        details: {
          userAgent,
          attemptedPath: "/board/intelligence",
          reason: auth.reason || "insufficient_privileges",
        },
      });

      return { notFound: true };
    }

    const report = await getAnalyticsData();
    const fetchDuration = Date.now() - startTime;

    await logAuditEvent({
      actorType: "admin",
      actorId: auth.userId,
      actorEmail: (auth as any).email,
      ipAddress: clientIp,
      action: AUDIT_ACTIONS.READ,
      resourceType: AUDIT_CATEGORIES.ADMIN_ACTION,
      resourceId: "board-intelligence",
      status: "success",
      details: {
        userAgent,
        fetchDuration,
        reportDataPoints: {
          members: report?.summary?.totalMembers || 0,
          keys: report?.summary?.activeKeys || 0,
          intakes: report?.summary?.recentIntakes || 0,
        },
      },
    });

    return {
      props: {
        report: report ? JSON.parse(JSON.stringify(report)) : null,
        sessionInfo: {
          email: (auth as any).email,
          lastActivity: new Date().toISOString(),
        },
      },
    };
  } catch (_error) {
    const error = _error as Error;
    const errorDuration = Date.now() - startTime;

    await logAuditEvent({
      actorType: "system",
      ipAddress: clientIp,
      action: AUDIT_ACTIONS.API_ERROR,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      resourceId: "board-intelligence",
      status: "failed",
      severity: "high",
      details: {
        userAgent,
        errorDuration,
        errorType: error.name,
        ...(process.env.NODE_ENV === "development" && { errorMessage: error.message }),
      },
    });

    return {
      props: {
        report: null,
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Unable to load report",
      },
    };
  }
};

const BoardIntelligence: NextPage<Props> = ({ report, error }) => {
  const CHART_COLORS = {
    primary: "#D4AF37",
    secondary: "#3B82F6",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
  };

  const BAR_COLORS = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.danger,
  ];

  if (error) {
    return (
      <Layout title="Strategic Intelligence">
        <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4 text-white md:p-8">
          <div className="flex h-64 items-center justify-center">
            <div className="mx-auto max-w-md text-center">
              <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-red-500" />
              <h2 className="mb-2 text-xl font-bold text-white">System Error</h2>
              <p className="mb-4 text-gray-400">
                Unable to load strategic intelligence report
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

  if (!report) {
    return (
      <Layout title="Strategic Intelligence">
        <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4 text-white md:p-8">
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-amber-500" />
              <p className="text-gray-400">Strategic health report unavailable</p>
              <p className="mt-2 text-sm text-gray-500">Please try again later</p>
            </div>
          </div>
        </main>
      </Layout>
    );
  }

  const { summary, engagement, auditTrends, contentEngagement } = report;

  const keyRatio =
    summary.totalMembers > 0 ? summary.activeKeys / summary.totalMembers : 0;

  const trend: {
    members: "normal" | "high" | "low" | "critical";
    keys: "normal" | "high" | "low" | "critical";
    intakes: "normal" | "high" | "low" | "critical";
    breaches: "normal" | "high" | "low" | "critical";
  } = {
    members: summary.totalMembers > 100 ? "high" : "normal",
    keys: keyRatio < 0.3 ? "low" : keyRatio > 0.8 ? "high" : "normal",
    intakes:
      summary.recentIntakes > 20
        ? "high"
        : summary.recentIntakes < 5
          ? "low"
          : "normal",
    breaches: summary.perimeterBreaches > 0 ? "critical" : "normal",
  };

  return (
    <Layout title="Strategic Intelligence">
      <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4 text-white md:p-8">
        <div className="mx-auto mb-8 max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-amber-600/5 p-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/20 p-2">
                <Lock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-amber-500">
                  CLASSIFIED ACCESS
                </p>
                <p className="text-xs text-gray-400">
                  Strategic Intelligence • Level 3 Clearance Required
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase text-gray-400">
                Last Updated
              </p>
              <p className="font-mono text-sm">
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>

        <header className="mx-auto mb-12 max-w-7xl">
          <div className="mb-2">
            <p className="text-[10px] font-black uppercase italic tracking-[0.4em] text-amber-500">
              Institutional Oversight
            </p>
          </div>
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="font-serif text-3xl font-bold italic text-white md:text-4xl">
                Strategic <span className="text-white/30">Intelligence Report</span>
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Comprehensive analytics and security insights for Abraham of London
              </p>
            </div>
            <div className="text-sm text-gray-400">
              <span className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 font-mono">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto mb-12 max-w-7xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Principals"
              value={summary.totalMembers}
              icon={<Users className="text-blue-400" />}
              trend={trend.members}
              subtitle="Total members"
            />
            <StatCard
              title="Active Keys"
              value={summary.activeKeys}
              icon={<Zap className="text-amber-400" />}
              trend={trend.keys}
              subtitle={`${keyRatio > 0 ? Math.round(keyRatio * 100) : 0}% coverage`}
            />
            <StatCard
              title="30d Intakes"
              value={summary.recentIntakes}
              icon={<TrendingUp className="text-emerald-400" />}
              trend={trend.intakes}
              subtitle="Strategic applications"
            />
            <StatCard
              title="Downloads"
              value={summary.recentDownloads}
              icon={<Download className="text-purple-400" />}
              trend="normal"
              subtitle="Last 30 days"
            />
          </div>
        </div>

        <div className="mx-auto mb-12 grid max-w-7xl gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-black/40 p-5">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                  Content Engagement
                </h2>
              </div>
              <span className="rounded bg-amber-500/10 px-2 py-1 font-mono text-xs text-amber-500">
                {engagement.length} assets
              </span>
            </div>
            <div className="h-64">
              {engagement.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagement}>
                    <XAxis
                      dataKey="shortSlug"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                      contentStyle={{
                        backgroundColor: "#111827",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        padding: "12px",
                        backdropFilter: "blur(10px)",
                      }}
                      labelStyle={{
                        color: "#9CA3AF",
                        fontSize: "12px",
                        marginBottom: "4px",
                      }}
                      formatter={((value: number) => [`${value} views`, "Views"]) as any}
                    />
                    <Bar
                      dataKey="viewCount"
                      fill={CHART_COLORS.primary}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-gray-500">
                  <Activity className="mb-3 h-12 w-12 opacity-20" />
                  <p>No engagement data available</p>
                  <p className="mt-1 text-xs">Content views will appear here</p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-black/40 p-5">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                  Content Distribution
                </h2>
              </div>
              <span className="rounded bg-blue-500/10 px-2 py-1 font-mono text-xs text-blue-500">
                {contentEngagement.length} items
              </span>
            </div>
            <div className="h-64">
              {contentEngagement.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contentEngagement}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) =>
                        `${String(props.name ?? "")}: ${((props.percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      dataKey="value"
                    >
                      {contentEngagement.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={BAR_COLORS[index % BAR_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={((value: number) => [`${value} views`, "Views"]) as any}
                      contentStyle={{
                        backgroundColor: "#111827",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        padding: "12px",
                        backdropFilter: "blur(10px)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-gray-500">
                  <Eye className="mb-3 h-12 w-12 opacity-20" />
                  <p>No content data available</p>
                  <p className="mt-1 text-xs">Content metadata will appear here</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mx-auto mb-12 grid max-w-7xl gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-black/40 p-5">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                  Security Audit Distribution
                </h2>
              </div>
              <span className="rounded bg-red-500/10 px-2 py-1 font-mono text-xs text-red-500">
                {auditTrends.length} audit types
              </span>
            </div>
            <div className="max-h-[300px] space-y-3 overflow-y-auto pr-2">
              {auditTrends.length > 0 ? (
                auditTrends.map((trend, index) => (
                  <div
                    key={`${trend.action}-${index}`}
                    className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="max-w-[180px] truncate text-sm font-medium text-gray-300">
                        {trend.action.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">
                        {trend._count}
                      </span>
                      <span className="text-xs text-gray-500">audits</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                  <p className="text-gray-500">No audit data available</p>
                  <p className="mt-1 text-xs text-gray-600">
                    Security audits will appear here
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-black/40 p-5">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/20 p-2">
                <Lock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-amber-500">
                  Security Recommendations
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Based on current system metrics
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <SecurityRecommendation
                title="Key Distribution"
                status={
                  trend.keys === "low"
                    ? "warning"
                    : trend.keys === "high"
                      ? "warning"
                      : "ok"
                }
                message={
                  trend.keys === "low"
                    ? "Low key coverage. Consider issuing more keys to active members."
                    : trend.keys === "high"
                      ? "High key coverage. Monitor for unauthorized access."
                      : "Key distribution is within optimal range."
                }
              />
              <SecurityRecommendation
                title="Engagement Levels"
                status={engagement.length === 0 ? "warning" : "ok"}
                message={
                  engagement.length === 0
                    ? "No engagement data. Consider promoting content or checking tracking."
                    : "Content engagement is being tracked normally."
                }
              />
              <SecurityRecommendation
                title="Audit Coverage"
                status={auditTrends.length === 0 ? "warning" : "ok"}
                message={
                  auditTrends.length === 0
                    ? "No security audits recorded. Verify audit logging is enabled."
                    : "Security audit system is operational."
                }
              />
            </div>
          </section>
        </div>

        <footer className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between text-xs text-gray-600 md:flex-row">
            <div className="mb-3 md:mb-0">
              <p className="mb-1">
                Abraham of London • Strategic Intelligence Dashboard v3.0
              </p>
              <p className="text-[10px] text-gray-700">
                This report contains sensitive operational data. Do not distribute.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span>System: Operational</span>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-amber-500 transition hover:text-amber-400 hover:underline"
              >
                Refresh Report
              </button>
            </div>
          </div>
        </footer>
      </main>
    </Layout>
  );
};

function StatCard({
  title,
  value,
  icon,
  trend,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: "normal" | "high" | "low" | "critical";
  subtitle?: string;
}) {
  const trendConfig = {
    normal: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    high: {
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    low: {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    critical: {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
  } as const;

  const config = trendConfig[trend];

  return (
    <div
      className={`${config.bg} ${config.border} rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02]`}
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
      <div className="flex items-end justify-between">
        <p className={`font-mono text-3xl font-bold ${config.color}`}>
          {value.toLocaleString()}
        </p>
        <span className={`rounded px-2 py-1 text-xs font-bold ${config.bg}`}>
          {trend.toUpperCase()}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full bg-gradient-to-r from-current to-current/50 transition-all duration-700"
          style={{
            width: `${Math.min(value / (trend === "critical" ? 5 : 10), 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

function SecurityRecommendation({
  title,
  status,
  message,
}: {
  title: string;
  status: "ok" | "warning" | "critical";
  message: string;
}) {
  const statusConfig = {
    ok: {
      icon: "✅",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    warning: {
      icon: "⚠️",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    critical: {
      icon: "🚨",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
  } as const;

  const config = statusConfig[status];

  return (
    <div
      className={`${config.bg} ${config.border} rounded-lg border p-4 transition-all hover:scale-[1.01]`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{config.icon}</span>
        <div>
          <p className={`mb-1 text-xs font-bold uppercase tracking-wider ${config.color}`}>
            {title}
          </p>
          <p className="text-sm leading-relaxed text-gray-300">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default BoardIntelligence;