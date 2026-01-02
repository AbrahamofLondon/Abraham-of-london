/* pages/board/intelligence.tsx */
import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { getStrategicHealthReport, StrategicHealthReport } from '@/lib/server/analytics';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert, Users, Zap, TrendingUp } from 'lucide-react';

interface Props {
  report: StrategicHealthReport | null;
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const report = await getStrategicHealthReport();
    // Safely serialize the report
    return { 
      props: { 
        report: report ? JSON.parse(JSON.stringify(report)) : null 
      } 
    };
  } catch (_err) {
    console.error('Failed to fetch strategic health report:', _err);
    return { props: { report: null } };
  }
};

const BoardIntelligence: NextPage<Props> = ({ report }) => {
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
          />
          <StatCard 
            title="Active Keys" 
            value={summary.activeKeys} 
            icon={<Zap className="text-amber-400" />} 
          />
          <StatCard 
            title="30d Intakes" 
            value={summary.recentIntakes} 
            icon={<TrendingUp className="text-emerald-400" />} 
          />
          <StatCard 
            title="Perimeter Breaches" 
            value={summary.perimeterBreaches} 
            icon={<ShieldAlert className="text-red-400" />} 
          />
        </div>

        {/* CHARTS SECTION */}
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Engagement Chart */}
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

          {/* Audit Trends */}
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

        {/* Additional Insights Section */}
        <section className="mt-12 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">
            Key Insights
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <InsightCard 
              title="Engagement Health"
              value={engagement.length > 0 ? 
                `${Math.round(engagement.reduce((acc, curr) => acc + curr.viewCount, 0) / engagement.length)} avg views` : 
                "No data"
              }
              status="neutral"
            />
            <InsightCard 
              title="Security Activity"
              value={auditTrends.length > 0 ? 
                `${auditTrends.reduce((acc, curr) => acc + curr._count, 0)} total audits` : 
                "No data"
              }
              status="positive"
            />
            <InsightCard 
              title="Principal Ratio"
              value={summary.activeKeys > 0 ? 
                `${(summary.totalMembers / summary.activeKeys).toFixed(1)} members/key` : 
                "No keys"
              }
              status="neutral"
            />
          </div>
        </section>
      </main>
    </Layout>
  );
};

// Stat Card Component
function StatCard({ title, value, icon }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] transition-all duration-300 hover:border-white/10">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {title}
        </p>
        {icon}
      </div>
      <p className="text-3xl font-mono font-bold">
        {value.toLocaleString()}
      </p>
      <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-amber-500/50 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value / 10, 100)}%` }}
        />
      </div>
    </div>
  );
}

// Insight Card Component
function InsightCard({ title, value, status }: { 
  title: string; 
  value: string;
  status: 'positive' | 'negative' | 'neutral';
}) {
  const statusColors = {
    positive: 'text-emerald-400',
    negative: 'text-red-400',
    neutral: 'text-amber-400'
  };

  return (
    <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
        {title}
      </p>
      <p className={`text-lg font-mono font-bold ${statusColors[status]}`}>
        {value}
      </p>
    </div>
  );
}

export default BoardIntelligence;