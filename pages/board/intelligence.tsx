/* pages/board/intelligence.tsx */
import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { getStrategicHealthReport, StrategicHealthReport } from '@/lib/server/analytics';
import { validateAdminAccess } from '@/lib/server/validation';
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from '@/lib/server/audit';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldAlert, Users, Zap, TrendingUp, Lock, Activity, Download, Eye } from 'lucide-react';
import prisma from '@/lib/prisma';

interface Props {
  report: StrategicHealthReport | null;
  error?: string;
  sessionInfo?: {
    email?: string;
    lastActivity?: string;
  };
}

// Analytics helper functions using your Prisma models
async function getAnalyticsData() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch data in parallel for performance
    const [
      totalMembers,
      activeKeys,
      recentIntakes,
      recentDownloads,
      engagementData,
      auditData,
      // FIX: Use correct model names from your schema
      contentMetadata
    ] = await Promise.all([
      // Total members
      prisma.innerCircleMember.count(),
      
      // Active keys (not expired, not revoked)
      prisma.innerCircleKey.count({
        where: {
          status: 'active',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ],
          revokedAt: null
        }
      }),
      
      // Recent intakes (last 30 days)
      prisma.strategyRoomIntake.count({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      
      // Recent downloads (last 30 days)
      prisma.downloadAuditEvent.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          success: true
        }
      }),
      
      // Engagement data from short interactions
      prisma.shortInteraction.groupBy({
        by: ['shortSlug'],
        _sum: { id: true }, // Using id as proxy for count
        where: {
          createdAt: { gte: thirtyDaysAgo },
          action: 'view'
        },
        orderBy: {
          _sum: { id: 'desc' }
        },
        take: 10
      }),
      
      // Audit trends
      prisma.systemAuditLog.groupBy({
        by: ['action'],
        _count: { id: true },
        where: {
          createdAt: { gte: thirtyDaysAgo },
          severity: { in: ['medium', 'high'] }
        },
        orderBy: {
          _count: { id: 'desc' }
        },
        take: 8
      }),
      
      // Top content by views
      prisma.contentMetadata.findMany({
        orderBy: { viewCount: 'desc' },
        take: 5
      })
    ]);

    // Transform engagement data
    const engagement = engagementData.map(item => ({
      shortSlug: item.shortSlug,
      viewCount: item._sum.id || 0
    }));

    // Transform audit trends
    const auditTrends = auditData.map(item => ({
      action: item.action,
      _count: item._count.id
    }));

    // Transform content data
    const contentEngagement = contentMetadata.map(item => ({
      name: item.slug,
      value: item.viewCount,
      downloads: item.totalDownloads
    }));

    return {
      summary: {
        totalMembers,
        activeKeys,
        recentIntakes,
        recentDownloads,
        perimeterBreaches: 0, // You'll need to define what constitutes a breach
      },
      engagement,
      auditTrends,
      contentEngagement,
      rawStats: {
        engagementData,
        auditData,
        contentMetadata
      }
    };
  } catch (error) {
    console.error('Analytics data fetch error:', error);
    return null;
  }
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const { req } = context;
  const startTime = Date.now();
  
  // Get client IP for audit logging
  const getClientIp = () => {
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    return Array.isArray(forwarded) ? forwarded[0] : 
           typeof forwarded === 'string' ? forwarded.split(',')[0] :
           typeof realIp === 'string' ? realIp :
           req.socket?.remoteAddress || 'unknown';
  };

  const clientIp = getClientIp();
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  try {
    // 1. Verify Admin Authentication
    const auth = await validateAdminAccess(req as any);
    
    if (!auth.valid) {
      // Log unauthorized access attempt
      await logAuditEvent({
        actorType: 'member',
        actorId: 'anonymous',
        ipAddress: clientIp,
        action: AUDIT_ACTIONS.ACCESS_DENIED,
        resourceType: AUDIT_CATEGORIES.ADMIN_ACTION,
        resourceId: 'board-intelligence',
        status: 'failed',
        severity: 'high',
        details: {
          userAgent,
          attemptedPath: '/board/intelligence',
          reason: auth.reason || 'insufficient_privileges'
        }
      });
      
      // Return 404 instead of 403 to hide existence of the page
      return {
        notFound: true,
      };
    }

    // 2. Fetch the report - USING OUR NEW HELPER FUNCTION
    const report = await getAnalyticsData();
    const fetchDuration = Date.now() - startTime;

    // 3. Log successful access
    await logAuditEvent({
      actorType: 'admin',
      actorId: auth.userId,
      actorEmail: (auth as any).email,
      ipAddress: clientIp,
      action: AUDIT_ACTIONS.READ,
      resourceType: AUDIT_CATEGORIES.ADMIN_ACTION,
      resourceId: 'board-intelligence',
      status: 'success',
      details: {
        userAgent,
        fetchDuration,
        reportDataPoints: {
          members: report?.summary?.totalMembers || 0,
          keys: report?.summary?.activeKeys || 0,
          intakes: report?.summary?.recentIntakes || 0
        }
      }
    });

    // 4. Return the data with sanitization
    return {
      props: {
        report: report ? JSON.parse(JSON.stringify(report)) : null,
        sessionInfo: {
          email: (auth as any).email,
          lastActivity: new Date().toISOString()
        }
      },
    };

  } catch (_error) {
    const error = _error as Error;
    const errorDuration = Date.now() - startTime;
    
    // Log the error without exposing details
    await logAuditEvent({
      actorType: 'system',
      ipAddress: clientIp,
      action: AUDIT_ACTIONS.API_ERROR,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      resourceId: 'board-intelligence',
      status: 'failed',
      severity: 'high',
      details: {
        userAgent,
        errorDuration,
        errorType: error.name,
        ...(process.env.NODE_ENV === 'development' && { errorMessage: error.message })
      }
    });

    // Return generic error to user
    return {
      props: {
        report: null,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Unable to load report'
      },
    };
  }
};

const BoardIntelligence: NextPage<Props> = ({ report, error }) => {
  // Chart colors
  const CHART_COLORS = {
    primary: '#D4AF37',
    secondary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    neutral: '#6B7280'
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
        <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md mx-auto">
              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">System Error</h2>
              <p className="text-gray-400 mb-4">Unable to load strategic intelligence report</p>
              <p className="text-sm text-gray-500 font-mono p-3 bg-black/30 rounded border border-red-500/20">
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
        <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <p className="text-gray-400">Strategic health report unavailable</p>
              <p className="text-sm text-gray-500 mt-2">Please try again later</p>
            </div>
          </div>
        </main>
      </Layout>
    );
  }

  const { summary, engagement, auditTrends, contentEngagement } = report;

  // Calculate trends
  const keyRatio = summary.totalMembers > 0 
    ? summary.activeKeys / summary.totalMembers 
    : 0;
  
  const trend = {
    members: summary.totalMembers > 100 ? "high" : "normal",
    keys: keyRatio < 0.3 ? "low" : keyRatio > 0.8 ? "high" : "normal",
    intakes: summary.recentIntakes > 20 ? "high" : summary.recentIntakes < 5 ? "low" : "normal",
    breaches: summary.perimeterBreaches > 0 ? "critical" : "normal"
  };

  return (
    <Layout title="Strategic Intelligence">
      <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
        {/* Security Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Lock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-500 uppercase tracking-wider">CLASSIFIED ACCESS</p>
                <p className="text-xs text-gray-400">Strategic Intelligence • Level 3 Clearance Required</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase font-bold">Last Updated</p>
              <p className="text-sm font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="max-w-7xl mx-auto mb-12">
          <div className="mb-2">
            <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] italic">
              Institutional Oversight
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif italic font-bold text-white">
                Strategic <span className="text-white/30">Intelligence Report</span>
              </h1>
              <p className="text-gray-500 text-sm mt-2">
                Comprehensive analytics and security insights for Abraham of London
              </p>
            </div>
            <div className="text-sm text-gray-400">
              <span className="font-mono bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </header>

        {/* SUMMARY GRID */}
        <div className="max-w-7xl mx-auto mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* CHARTS SECTION */}
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6 mb-12">
          {/* Engagement Chart */}
          <section className="bg-black/40 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                  Content Engagement
                </h2>
              </div>
              <span className="text-xs font-mono bg-amber-500/10 text-amber-500 px-2 py-1 rounded">
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
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      contentStyle={{ 
                        backgroundColor: '#111827', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        padding: '12px',
                        backdropFilter: 'blur(10px)'
                      }}
                      labelStyle={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '4px' }}
                      formatter={(value: number) => [`${value} views`, 'Views']}
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
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Activity className="w-12 h-12 mb-3 opacity-20" />
                  <p>No engagement data available</p>
                  <p className="text-xs mt-1">Content views will appear here</p>
                </div>
              )}
            </div>
          </section>

          {/* Content Distribution Pie Chart */}
          <section className="bg-black/40 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                  Content Distribution
                </h2>
              </div>
              <span className="text-xs font-mono bg-blue-500/10 text-blue-500 px-2 py-1 rounded">
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
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {contentEngagement.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} views`, 'Views']}
                      contentStyle={{ 
                        backgroundColor: '#111827', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        padding: '12px',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Eye className="w-12 h-12 mb-3 opacity-20" />
                  <p>No content data available</p>
                  <p className="text-xs mt-1">Content metadata will appear here</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* AUDIT TRENDS & SECURITY */}
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6 mb-12">
          {/* Audit Trends */}
          <section className="bg-black/40 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                  Security Audit Distribution
                </h2>
              </div>
              <span className="text-xs font-mono bg-red-500/10 text-red-500 px-2 py-1 rounded">
                {auditTrends.length} audit types
              </span>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {auditTrends.length > 0 ? (
                auditTrends.map((trend, index) => (
                  <div 
                    key={`${trend.action}-${index}`} 
                    className="group flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium text-gray-300 truncate max-w-[180px]">
                        {trend.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-lg">
                        {trend._count}
                      </span>
                      <span className="text-xs text-gray-500">audits</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <ShieldAlert className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No audit data available</p>
                  <p className="text-xs text-gray-600 mt-1">Security audits will appear here</p>
                </div>
              )}
            </div>
          </section>

          {/* Security Recommendations */}
          <section className="bg-black/40 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Lock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-amber-500">
                  Security Recommendations
                </h2>
                <p className="text-xs text-gray-500 mt-1">Based on current system metrics</p>
              </div>
            </div>
            <div className="space-y-4">
              <SecurityRecommendation 
                title="Key Distribution"
                status={trend.keys === "low" ? "warning" : trend.keys === "high" ? "warning" : "ok"}
                message={trend.keys === "low" 
                  ? "Low key coverage. Consider issuing more keys to active members."
                  : trend.keys === "high" 
                  ? "High key coverage. Monitor for unauthorized access."
                  : "Key distribution is within optimal range."
                }
              />
              <SecurityRecommendation 
                title="Engagement Levels"
                status={engagement.length === 0 ? "warning" : "ok"}
                message={engagement.length === 0
                  ? "No engagement data. Consider promoting content or checking tracking."
                  : "Content engagement is being tracked normally."
                }
              />
              <SecurityRecommendation 
                title="Audit Coverage"
                status={auditTrends.length === 0 ? "warning" : "ok"}
                message={auditTrends.length === 0
                  ? "No security audits recorded. Verify audit logging is enabled."
                  : "Security audit system is operational."
                }
              />
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <footer className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
            <div className="mb-3 md:mb-0">
              <p className="mb-1">Abraham of London • Strategic Intelligence Dashboard v3.0</p>
              <p className="text-[10px] text-gray-700">
                This report contains sensitive operational data. Do not distribute.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>System: Operational</span>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="text-xs text-amber-500 hover:text-amber-400 transition hover:underline"
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

// Stat Card Component
function StatCard({ title, value, icon, trend, subtitle }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode;
  trend: 'normal' | 'high' | 'low' | 'critical';
  subtitle?: string;
}) {
  const trendConfig = {
    normal: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    high: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    low: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  };

  const config = trendConfig[trend];

  return (
    <div className={`${config.bg} ${config.border} border p-5 rounded-xl transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-black/20">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className={`text-3xl font-mono font-bold ${config.color}`}>
          {value.toLocaleString()}
        </p>
        <span className={`text-xs font-bold px-2 py-1 rounded ${config.bg}`}>
          {trend.toUpperCase()}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-current to-current/50 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(value / (trend === 'critical' ? 5 : 10), 100)}%` }}
        />
      </div>
    </div>
  );
}

// Security Recommendation Component
function SecurityRecommendation({ title, status, message }: { 
  title: string; 
  status: 'ok' | 'warning' | 'critical';
  message: string;
}) {
  const statusConfig = {
    ok: { 
      icon: '✅', 
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    warning: { 
      icon: '⚠️', 
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    },
    critical: { 
      icon: '🚨', 
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.bg} ${config.border} border p-4 rounded-lg transition-all hover:scale-[1.01]`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{config.icon}</span>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${config.color} mb-1`}>
            {title}
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default BoardIntelligence;