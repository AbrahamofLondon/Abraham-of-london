import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { getStrategicHealthReport, StrategicHealthReport } from '@/lib/server/analytics';
import { validateAdminAccess } from '@/lib/server/validation';
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from '@/lib/server/audit';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert, Users, Zap, TrendingUp, Lock } from 'lucide-react';

interface Props {
  report: StrategicHealthReport | null;
  error?: string;
  sessionInfo?: {
    email?: string;
    lastActivity?: string;
  };
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
        actorType: 'member', // FIX: Changed 'user' to 'member' (representing anonymous user)
        actorId: 'anonymous',
        ipAddress: clientIp,
        action: AUDIT_ACTIONS.ACCESS_DENIED,
        resourceType: AUDIT_CATEGORIES.ADMIN_ACTION,
        resourceId: 'board-intelligence',
        status: 'failed',
        severity: 'high',
        details: {
          userAgent,
          attemptedPath: '/board/c',
          reason: auth.reason || 'insufficient_privileges'
        }
      });
      
      // Return 404 instead of 403 to hide existence of the page
      return {
        notFound: true,
      };
    }

    // 2. Fetch the report
    const report = await getStrategicHealthReport();
    const fetchDuration = Date.now() - startTime;

    // 3. Log successful access
    await logAuditEvent({
      actorType: 'admin',
      actorId: auth.userId,
      actorEmail: auth.email,
      ipAddress: clientIp,
      action: AUDIT_ACTIONS.READ, // FIX: Ensured valid action
      resourceType: AUDIT_CATEGORIES.ADMIN_ACTION,
      resourceId: 'board-intelligence',
      status: 'success',
      details: {
        userAgent,
        fetchDuration,
        reportDataPoints: {
          members: report?.summary?.totalMembers || 0,
          keys: report?.summary?.activeKeys || 0,
          breaches: report?.summary?.perimeterBreaches || 0
        }
      }
    });

    // 4. Return the data with sanitization
    return {
      props: {
        report: report ? JSON.parse(JSON.stringify(report)) : null,
        sessionInfo: {
          email: auth.email,
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
      action: AUDIT_ACTIONS.API_ERROR, // FIX: Ensured valid action
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

    return {
      props: {
        report: null,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Unable to load report'
      },
    };
  }
};

const BoardIntelligence: NextPage<Props> = ({ report, error }) => {
  if (error) {
    return (
      <Layout title="Strategic Intelligence">
        <main className="min-h-screen bg-[#050609] text-white p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-400">System Error</p>
              <p className="text-sm text-gray-500 mt-2">{error}</p>
            </div>
          </div>
        </main>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout title="Strategic Intelligence">
        <main className="min-h-screen bg-[#050609] text-white p-8">
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

  const { summary, engagement, auditTrends } = report;

  return (
    <Layout title="Strategic Intelligence">
      <main className="min-h-screen bg-[#050609] text-white p-8">
        {/* Security Header */}
        <div className="flex justify-between items-center mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-amber-500">RESTRICTED ACCESS</p>
              <p className="text-xs text-gray-400">Institutional Oversight - Classified Data</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Last Updated</p>
            <p className="text-sm font-mono">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        <header className="mb-12">
          <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-2">
            Institutional Oversight
          </p>
          <h1 className="text-4xl font-serif italic font-bold">
            Strategic <span className="text-white/40">Health Report</span>
          </h1>
        </header>

        {/* SUMMARY GRID */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <StatCard 
            title="Principals" 
            value={summary.totalMembers} 
            icon={<Users className="text-blue-400" />}
            trend={summary.totalMembers > 100 ? "high" : "normal"}
          />
          <StatCard 
            title="Active Keys" 
            value={summary.activeKeys} 
            icon={<Zap className="text-amber-400" />}
            trend={summary.activeKeys < summary.totalMembers * 0.3 ? "low" : "normal"}
          />
          <StatCard 
            title="30d Intakes" 
            value={summary.recentIntakes} 
            icon={<TrendingUp className="text-emerald-400" />}
            trend={summary.recentIntakes > 10 ? "high" : "normal"}
          />
          <StatCard 
            title="Perimeter Breaches" 
            value={summary.perimeterBreaches} 
            icon={<ShieldAlert className="text-red-400" />}
            trend={summary.perimeterBreaches > 0 ? "critical" : "normal"}
          />
        </div>

        {/* CHARTS SECTION */}
        <div className="grid lg:grid-cols-2 gap-10">
          <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
                Content Engagement
              </h2>
              <span className="text-xs text-gray-500">
                {engagement.length} assets tracked
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
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      contentStyle={{ 
                        backgroundColor: '#111827', 
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        padding: '8px 12px'
                      }}
                      labelStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                      formatter={(value) => [value, 'Views']}
                    />
                    <Bar 
                      dataKey="viewCount" 
                      fill="#D4AF37"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No engagement data available</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
                Security Audit Distribution
              </h2>
              <span className="text-xs text-gray-500">
                {auditTrends.length} audit types
              </span>
            </div>
            <div className="space-y-4">
              {auditTrends.length > 0 ? (
                auditTrends.map((trend, index) => (
                  <div 
                    key={`${trend.action}-${index}`} 
                    className="flex items-center justify-between border-b border-white/5 pb-2 hover:bg-white/[0.02] px-2 py-1 rounded"
                  >
                    <span className="text-xs font-mono text-gray-400 truncate mr-4">
                      {trend.action}
                    </span>
                    <span className="font-bold text-white min-w-[40px] text-right">
                      {trend._count}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No audit data available</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Security Recommendations */}
        <section className="mt-12 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500">
              Security Recommendations
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <SecurityRecommendation 
              title="Key Distribution"
              status={summary.activeKeys < summary.totalMembers * 0.3 ? "warning" : "ok"}
              message={summary.activeKeys < summary.totalMembers * 0.3 
                ? "Consider issuing more keys to members"
                : "Key distribution is healthy"
              }
            />
            <SecurityRecommendation 
              title="Breach Response"
              status={summary.perimeterBreaches > 0 ? "critical" : "ok"}
              message={summary.perimeterBreaches > 0
                ? `${summary.perimeterBreaches} active breach(es) - Immediate action required`
                : "No active perimeter breaches detected"
              }
            />
          </div>
        </section>
      </main>
    </Layout>
  );
};

function StatCard({ title, value, icon, trend }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode;
  trend?: 'normal' | 'high' | 'low' | 'critical';
}) {
  const trendColors = {
    normal: 'bg-emerald-500/20 border-emerald-500/30',
    high: 'bg-amber-500/20 border-amber-500/30',
    low: 'bg-blue-500/20 border-blue-500/30',
    critical: 'bg-red-500/20 border-red-500/30'
  };

  return (
    <div className={`${trendColors[trend || 'normal']} border p-6 rounded-2xl transition-all duration-300`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{title}</p>
        {icon}
      </div>
      <p className="text-3xl font-mono font-bold">{value.toLocaleString()}</p>
      <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-amber-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value / (trend === 'critical' ? 5 : 10), 100)}%` }}
        />
      </div>
    </div>
  );
}

function SecurityRecommendation({ title, status, message }: { 
  title: string; 
  status: 'ok' | 'warning' | 'critical';
  message: string;
}) {
  const statusIcons = { ok: '✅', warning: '⚠️', critical: '🚨' };
  const statusColors = { ok: 'text-emerald-400', warning: 'text-amber-400', critical: 'text-red-400' };

  return (
    <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <span>{statusIcons[status]}</span>
        <p className={`text-xs font-bold uppercase tracking-widest ${statusColors[status]}`}>
          {title}
        </p>
      </div>
      <p className="text-sm text-gray-300">{message}</p>
    </div>
  );
}

export default BoardIntelligence;