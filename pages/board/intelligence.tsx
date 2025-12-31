/* pages/board/c */
import { GetServerSideProps, NextPage } from 'next';
import Layout from '@/components/Layout';
import { getStrategicHealthReport, StrategicHealthReport } from '@/lib/server/analytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldAlert, Users, Zap, TrendingUp } from 'lucide-react';

interface Props {
  report: StrategicHealthReport;
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const report = await getStrategicHealthReport();
    return { props: { report: JSON.parse(JSON.stringify(report)) } };
  } catch (err) {
    return { props: { report: null } };
  }
};

const BoardIntelligence: NextPage<Props> = ({ report }) => {
  if (!report) return <Layout>Institutional data unavailable.</Layout>;

  return (
    <Layout title="Strategic Intelligence">
      <main className="min-h-screen bg-[#050609] text-white p-8">
        <header className="mb-12">
          <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-2">Institutional Oversight</p>
          <h1 className="text-4xl font-serif italic font-bold">Strategic <span className="text-white/40">Health Report</span></h1>
        </header>

        {/* SUMMARY GRID */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <StatCard title="Principals" value={report.summary.totalMembers} icon={<Users className="text-blue-400" />} />
          <StatCard title="Active Keys" value={report.summary.activeKeys} icon={<Zap className="text-amber-400" />} />
          <StatCard title="30d Intakes" value={report.summary.recentIntakes} icon={<TrendingUp className="text-emerald-400" />} />
          <StatCard title="Perimeter Breaches" value={report.summary.perimeterBreaches} icon={<ShieldAlert className="text-red-400" />} />
        </div>

        {/* CHARTS SECTION */}
        <div className="grid lg:grid-cols-2 gap-10">
          <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-8">Content Engagement</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.engagement}>
                  <XAxis dataKey="shortSlug" hide />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#111', border: 'none'}} />
                  <Bar dataKey="viewCount" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-8">Security Audit Distribution</h2>
            <div className="space-y-4">
              {report.auditTrends.map((trend, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-mono text-gray-400">{trend.action}</span>
                  <span className="font-bold">{trend._count}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
};

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] transition-all">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{title}</p>
        {icon}
      </div>
      <p className="text-3xl font-mono font-bold">{value}</p>
    </div>
  );
}

export default BoardIntelligence;
