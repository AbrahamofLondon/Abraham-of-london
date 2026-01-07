/* pages/board/c.tsx */
import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { validateAdminAccess } from '@/lib/server/validation';
import { logAuditEvent, AUDIT_ACTIONS, AUDIT_CATEGORIES } from '@/lib/server/audit';
import prisma from '@/lib/prisma';
import { 
  Activity, 
  Shield, 
  Key, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Download,
  Eye,
  Clock,
  Database,
  Server,
  Network,
  ShieldCheck,
  Lock,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

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
    status: 'healthy' | 'warning' | 'critical';
    alerts: number;
  };
  recentAlerts: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
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
        resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
        resourceId: 'system-control',
        status: 'failed',
        severity: 'high',
        details: {
          userAgent,
          attemptedPath: '/board/c',
          reason: auth.reason || 'insufficient_privileges'
        }
      });
      
      // Return 404 to hide existence of the page
      return {
        notFound: true,
      };
    }

    // 2. Fetch System Metrics in Parallel
    const [
      // Database metrics
      totalMembers,
      activeSessions,
      totalDownloads,
      recentErrors,
      cacheEntries,
      // System metrics from audit logs
      recentAuditLogs,
      failedJobs,
      maintenanceLogs,
      // Session data for traffic
      hourlyTraffic,
      // User activity status
      userStatusCounts
    ] = await Promise.all([
      // Total members
      prisma.innerCircleMember.count(),
      
      // Active sessions (not expired)
      prisma.session.count({
        where: {
          expiresAt: { gt: new Date() }
        }
      }),
      
      // Total downloads (last 24 hours)
      prisma.downloadAuditEvent.count({
        where: {
          createdAt: { 
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          success: true
        }
      }),
      
      // Recent errors (last hour)
      prisma.systemAuditLog.count({
        where: {
          createdAt: { 
            gte: new Date(Date.now() - 60 * 60 * 1000)
          },
          severity: { in: ['medium', 'high'] },
          status: 'failed'
        }
      }),
      
      // Active cache entries (not expired)
      prisma.cacheEntry.count({
        where: {
          expiresAt: { gt: new Date() }
        }
      }),
      
      // Recent audit logs (last 24 hours)
      prisma.systemAuditLog.groupBy({
        by: ['action'],
        _count: { id: true },
        where: {
          createdAt: { 
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        orderBy: {
          _count: { id: 'desc' }
        },
        take: 10
      }),
      
      // Recent failed jobs (last 24 hours)
      prisma.failedJob.count({
        where: {
          failedAt: { 
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Recent maintenance operations
      prisma.maintenanceLog.count({
        where: {
          startedAt: { 
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          status: { not: 'completed' }
        }
      }),
      
      // Hourly traffic data (last 12 hours)
      (async () => {
        const hours = [];
        const now = new Date();
        
        for (let i = 11; i >= 0; i--) {
          const hourStart = new Date(now);
          hourStart.setHours(now.getHours() - i, 0, 0, 0);
          const hourEnd = new Date(hourStart);
          hourEnd.setHours(hourStart.getHours() + 1);
          
          const hourLabel = hourStart.toLocaleTimeString('en-US', { 
            hour: 'numeric',
            hour12: true 
          }).replace(' ', '');
          
          const [requests, downloads, errors] = await Promise.all([
            // Requests (audit logs)
            prisma.systemAuditLog.count({
              where: {
                createdAt: {
                  gte: hourStart,
                  lt: hourEnd
                }
              }
            }),
            // Downloads
            prisma.downloadAuditEvent.count({
              where: {
                createdAt: {
                  gte: hourStart,
                  lt: hourEnd
                },
                success: true
              }
            }),
            // Errors
            prisma.systemAuditLog.count({
              where: {
                createdAt: {
                  gte: hourStart,
                  lt: hourEnd
                },
                status: 'failed',
                severity: { in: ['medium', 'high'] }
              }
            })
          ]);
          
          hours.push({
            hour: hourLabel,
            requests,
            downloads,
            errors
          });
        }
        
        return hours;
      })(),
      
      // User activity status distribution
      (async () => {
        const statusCounts = await prisma.innerCircleMember.groupBy({
          by: ['status'],
          _count: { id: true }
        });
        
        const total = statusCounts.reduce((sum, item) => sum + item._count.id, 0);
        
        return statusCounts.map(item => ({
          status: item.status,
          count: item._count.id,
          percentage: total > 0 ? Math.round((item._count.id / total) * 100) : 0
        }));
      })()
    ]);

    // Calculate system health score (0-100)
    const errorRate = recentErrors > 0 ? Math.min(recentErrors / 10, 1) : 0; // Cap at 10 errors per hour
    const failedJobsRate = failedJobs > 0 ? Math.min(failedJobs / 5, 1) : 0; // Cap at 5 failed jobs per day
    const maintenanceScore = maintenanceLogs > 0 ? 0.3 : 1; // Penalty for pending maintenance
    
    const healthScore = Math.round(
      100 * (1 - (errorRate * 0.4 + failedJobsRate * 0.3 + (1 - maintenanceScore) * 0.3))
    );

    // Determine system status
    let systemStatus: 'healthy' | 'warning' | 'critical';
    if (healthScore >= 80) {
      systemStatus = 'healthy';
    } else if (healthScore >= 60) {
      systemStatus = 'warning';
    } else {
      systemStatus = 'critical';
    }

    // Prepare system metrics
    const metrics: SystemMetrics = {
      uptime: 99.9, // This would ideally come from a monitoring system
      databaseSize: 0, // Would need to query database size
      cacheHitRate: cacheEntries > 0 ? 85 : 0, // Simplified cache hit rate
      activeConnections: activeSessions,
      errorRate: recentErrors
    };

    // Prepare recent alerts from audit logs
    const recentAlerts = await prisma.systemAuditLog.findMany({
      where: {
        createdAt: { 
          gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // Last 2 hours
        },
        severity: { in: ['medium', 'high'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        action: true,
        errorMessage: true,
        createdAt: true,
        severity: true
      }
    });

    const fetchDuration = Date.now() - startTime;

    // 3. Log successful access
    await logAuditEvent({
      actorType: 'admin',
      actorId: auth.userId,
      actorEmail: (auth as any).email,
      ipAddress: clientIp,
      action: AUDIT_ACTIONS.READ,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      resourceId: 'system-control',
      status: 'success',
      details: {
        userAgent,
        fetchDuration,
        metrics: {
          healthScore,
          totalMembers,
          activeSessions,
          recentAlerts: recentAlerts.length
        }
      }
    });

    return {
      props: {
        metrics,
        trafficData: hourlyTraffic,
        userActivity: userStatusCounts,
        systemHealth: {
          score: healthScore,
          status: systemStatus,
          alerts: recentAlerts.length
        },
        recentAlerts: recentAlerts.map(alert => ({
          id: alert.id,
          type: alert.action,
          message: alert.errorMessage || 'No error message',
          timestamp: alert.createdAt.toISOString(),
          severity: alert.severity as 'low' | 'medium' | 'high'
        })),
        sessionInfo: {
          email: (auth as any).email,
          lastActivity: new Date().toISOString()
        }
      }
    };

  } catch (error) {
    console.error('System Control Dashboard Error:', error);
    
    // Log the error
    await logAuditEvent({
      actorType: 'system',
      ipAddress: clientIp,
      action: AUDIT_ACTIONS.API_ERROR,
      resourceType: AUDIT_CATEGORIES.SYSTEM_OPERATION,
      resourceId: 'system-control',
      status: 'failed',
      severity: 'high',
      details: {
        error: error instanceof Error ? error.message : String(error)
      }
    });

    return {
      props: {
        metrics: {
          uptime: 0,
          databaseSize: 0,
          cacheHitRate: 0,
          activeConnections: 0,
          errorRate: 0
        },
        trafficData: [],
        userActivity: [],
        systemHealth: {
          score: 0,
          status: 'critical',
          alerts: 0
        },
        recentAlerts: [],
        error: process.env.NODE_ENV === 'development' 
          ? (error as Error).message 
          : 'Unable to load system metrics'
      }
    };
  }
};

// Color palettes
const STATUS_COLORS = {
  healthy: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444'
};

const USER_STATUS_COLORS = {
  active: '#10B981',
  inactive: '#6B7280',
  suspended: '#EF4444',
  pending: '#F59E0B'
};

const TRAFFIC_COLORS = {
  requests: '#3B82F6',
  downloads: '#8B5CF6',
  errors: '#EF4444'
};

const SystemControlDashboard: NextPage<Props> = ({ 
  metrics, 
  trafficData, 
  userActivity, 
  systemHealth,
  recentAlerts,
  error 
}) => {
  if (error) {
    return (
      <Layout title="System Control">
        <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">System Error</h2>
              <p className="text-gray-400 mb-4">Unable to load system control dashboard</p>
              <p className="text-sm text-gray-500 font-mono p-3 bg-black/30 rounded border border-red-500/20">
                {error}
              </p>
            </div>
          </div>
        </main>
      </Layout>
    );
  }

  // Format bytes for display
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <Layout title="System Control">
      <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
        {/* Security Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Server className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-500 uppercase tracking-wider">SYSTEM CONTROL PANEL</p>
                <p className="text-xs text-gray-400">Infrastructure Monitoring & Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-bold">Status</p>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: STATUS_COLORS[systemHealth.status] }}
                  ></div>
                  <p className="text-sm font-bold capitalize">{systemHealth.status}</p>
                </div>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-xs text-gray-400">Last Updated</p>
                <p className="text-sm font-mono">{new Date().toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="max-w-7xl mx-auto mb-12">
          <div className="mb-2">
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] italic">
              Infrastructure Monitoring
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif italic font-bold text-white">
                System <span className="text-white/30">Control Center</span>
              </h1>
              <p className="text-gray-500 text-sm mt-2">
                Real-time monitoring, diagnostics, and system administration
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">Health Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold" style={{ color: STATUS_COLORS[systemHealth.status] }}>
                    {systemHealth.score}
                  </p>
                  <span className="text-gray-600">/100</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* SYSTEM METRICS GRID */}
        <div className="max-w-7xl mx-auto mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              subtitle="Cache efficiency"
            />
            <MetricCard 
              title="Error Rate" 
              value={metrics.errorRate.toString()}
              icon={<AlertTriangle className="text-amber-400" />}
              status={metrics.errorRate > 5 ? "critical" : metrics.errorRate > 0 ? "warning" : "healthy"}
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

        {/* MAIN CONTENT - CHARTS & ALERTS */}
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6 mb-12">
          {/* Traffic Chart */}
          <div className="lg:col-span-2">
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                    Traffic Overview (12h)
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-400">Requests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-xs text-gray-400">Downloads</span>
                  </div>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#9CA3AF' }}
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

          {/* User Activity Distribution */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                    User Activity
                  </h2>
                </div>
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">
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
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {userActivity.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          // @ts-ignore
                          fill={USER_STATUS_COLORS[entry.status] || '#6B7280'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} users`, 'Count']}
                      contentStyle={{ 
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ALERTS & QUICK ACTIONS */}
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6 mb-12">
          {/* Recent Alerts */}
          <div className="lg:col-span-2">
            <div className="bg-black/40 border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                    Recent Alerts
                  </h2>
                </div>
                <span className="text-xs font-mono bg-amber-500/10 text-amber-500 px-2 py-1 rounded">
                  {recentAlerts.length} active
                </span>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {recentAlerts.length > 0 ? (
                  recentAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`p-4 rounded-lg border transition-all hover:scale-[1.01] ${
                        alert.severity === 'high' 
                          ? 'bg-red-500/10 border-red-500/20 hover:border-red-500/40' 
                          : alert.severity === 'medium'
                          ? 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40'
                          : 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            alert.severity === 'high' ? 'bg-red-500' :
                            alert.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                          }`}></div>
                          <p className="text-sm font-bold text-white">{alert.type}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{alert.message}</p>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs px-2 py-1 rounded ${
                          alert.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                          alert.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <button className="text-xs text-gray-400 hover:text-white transition">
                          Investigate →
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ShieldCheck className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
                    <p className="text-gray-400">No active alerts</p>
                    <p className="text-xs text-gray-600 mt-1">All systems operating normally</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-6">
                <Key className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                  Quick Actions
                </h2>
              </div>
              <div className="space-y-3">
                <ActionButton 
                  icon={<Database className="w-4 h-4" />}
                  label="Database Backup"
                  description="Create immediate backup"
                  color="blue"
                />
                <ActionButton 
                  icon={<Shield className="w-4 h-4" />}
                  label="Security Scan"
                  description="Run system security audit"
                  color="amber"
                />
                <ActionButton 
                  icon={<BarChart3 className="w-4 h-4" />}
                  label="Clear Cache"
                  description="Purge all cache entries"
                  color="purple"
                />
                <ActionButton 
                  icon={<Server className="w-4 h-4" />}
                  label="Restart Services"
                  description="Graceful restart of all services"
                  color="red"
                />
                <ActionButton 
                  icon={<PieChartIcon className="w-4 h-4" />}
                  label="Generate Report"
                  description="Create system health report"
                  color="emerald"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
            <div className="mb-3 md:mb-0">
              <p className="mb-1">Abraham of London • System Control v2.0</p>
              <p className="text-[10px] text-gray-700">
                Access restricted to authorized system administrators only
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3" />
                <span>Encrypted Connection • TLS 1.3</span>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="text-xs text-blue-500 hover:text-blue-400 transition hover:underline"
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

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  icon, 
  status, 
  subtitle 
}: { 
  title: string; 
  value: string;
  icon: React.ReactNode;
  status: 'healthy' | 'warning' | 'critical';
  subtitle?: string;
}) {
  const statusConfig = {
    healthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.bg} ${config.border} border p-4 rounded-xl transition-all hover:scale-[1.02]`}>
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
      <p className={`text-2xl font-mono font-bold ${config.color}`}>
        {value}
      </p>
      <div className="mt-2 h-1 w-full bg-black/30 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-700 ${config.color.replace('text-', 'bg-')}`}
          style={{ width: status === 'healthy' ? '90%' : status === 'warning' ? '60%' : '30%' }}
        />
      </div>
    </div>
  );
}

// Action Button Component
function ActionButton({ 
  icon, 
  label, 
  description, 
  color 
}: { 
  icon: React.ReactNode;
  label: string;
  description: string;
  color: 'blue' | 'amber' | 'purple' | 'red' | 'emerald';
}) {
  const colorConfig = {
    blue: 'border-blue-500/20 hover:border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10',
    amber: 'border-amber-500/20 hover:border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10',
    purple: 'border-purple-500/20 hover:border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10',
    red: 'border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10'
  };

  return (
    <button className={`w-full p-4 rounded-lg border ${colorConfig[color]} transition-all hover:scale-[1.01]`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
          color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
          color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
          color === 'red' ? 'bg-red-500/20 text-red-400' :
          'bg-emerald-500/20 text-emerald-400'
        }`}>
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
