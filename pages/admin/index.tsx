/* pages/admin/index.tsx — ADMINISTRATIVE CONTROL CENTER */
import React from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { 
  TrendingUp, 
  FileText, 
  Users, 
  Database,
  AlertCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total PDFs',
      value: '148',
      change: '+12%',
      icon: <FileText className="text-blue-500" size={24} />,
      color: 'bg-blue-50 border-blue-100'
    },
    {
      title: 'Active Users',
      value: '42',
      change: '+5%',
      icon: <Users className="text-green-500" size={24} />,
      color: 'bg-green-50 border-green-100'
    },
    {
      title: 'Storage Used',
      value: '3.2 GB',
      change: '+8%',
      icon: <Database className="text-purple-500" size={24} />,
      color: 'bg-purple-50 border-purple-100'
    },
    {
      title: 'System Health',
      value: '98%',
      change: '+2%',
      icon: <TrendingUp className="text-amber-500" size={24} />,
      color: 'bg-amber-50 border-amber-100'
    }
  ];

  const recentActivity = [
    { id: 1, action: 'Generated Q4 Report.pdf', user: 'Admin', time: '2 min ago', status: 'success' },
    { id: 2, action: 'Updated user permissions', user: 'System', time: '15 min ago', status: 'info' },
    { id: 3, action: 'Failed to generate Invoice_001.pdf', user: 'Auto', time: '1 hour ago', status: 'error' },
    { id: 4, action: 'Scheduled weekly report generation', user: 'Admin', time: '3 hours ago', status: 'success' },
  ];

  const quickActions = [
    { title: 'PDF Management', href: '/admin/pdf-dashboard', color: 'bg-gradient-to-r from-amber-500 to-orange-500' },
    { title: 'PDF File Status', href: '/admin/pdf-status', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { title: 'View System Logs', href: '/admin/settings/logs', color: 'bg-gradient-to-r from-indigo-500 to-purple-500' },
    { title: 'Manage Users', href: '/admin/users', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { title: 'API Documentation', href: '/admin/settings/api', color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
  ];

  return (
    <AdminLayout>
      {/* Welcome Banner */}
      <div className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white shadow-2xl border border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">System Operational</span>
            </div>
            <h1 className="text-3xl font-serif font-bold mb-2">Institutional Administrator</h1>
            <p className="text-zinc-400 text-sm max-w-xl">
              The PDF Intelligence Pipeline is synchronized. {stats[0].value} restricted manuscripts are currently indexed and ready for distribution.
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="text-right p-4 border-l border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Last Heartbeat</p>
              <p className="text-2xl font-mono font-bold text-gold">02:14:59</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <div 
            key={stat.title} 
            className={`${stat.color} border rounded-2xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 group`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                stat.change.startsWith('+') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-3xl font-mono font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6">Strategic Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className={`${action.color} text-white rounded-2xl p-8 transition-all hover:shadow-2xl hover:brightness-110 active:scale-95 block relative overflow-hidden group`}
                >
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                    <p className="text-white/70 text-xs font-mono">Initialize Module →</p>
                  </div>
                  <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all" size={48} />
                </Link>
              ))}
            </div>
          </div>

          {/* PDF Dashboard Card */}
          <div className="p-8 border-2 border-dashed border-amber-200 rounded-[2rem] bg-amber-50/50 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest mb-4">
                  <TrendingUp size={12} />
                  Intelligence Layer
                </div>
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3">
                  Vault Analytics Engine
                </h3>
                <p className="text-gray-600 text-sm mb-8 leading-relaxed">
                  Monitor the decryption rates and dissemination of the 75 core briefs. Verify the integrity of PDF generation for institutional distribution.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/admin/pdf-dashboard"
                    className="inline-flex items-center px-8 py-4 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black hover:shadow-2xl transition-all"
                  >
                    Open Console
                    <ChevronRight size={14} className="ml-2" />
                  </Link>
                  <Link
                    href="/admin/pdf-status"
                    className="inline-flex items-center px-8 py-4 rounded-xl border-2 border-gray-900 text-gray-900 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    Integrity Status
                  </Link>
                </div>
              </div>
              <div className="hidden md:block opacity-10">
                <FileText size={180} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Audit Trail</h2>
              <Link href="/admin/settings/logs" className="text-[10px] font-black text-amber-600 hover:text-amber-700 uppercase tracking-widest">
                Full Logs →
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="max-w-[80%]">
                      <p className="text-sm font-bold text-gray-900 truncate">{activity.action}</p>
                      <p className="text-[10px] font-mono text-gray-400 mt-1 uppercase tracking-tighter">Auth: {activity.user}</p>
                    </div>
                    {activity.status === 'success' ? (
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    ) : activity.status === 'error' ? (
                      <AlertCircle size={18} className="text-rose-500 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{activity.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* System Status Monitoring */}
          <div className="p-8 bg-zinc-950 rounded-[2rem] text-white shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-zinc-500">Vault Integrity</h3>
            <div className="space-y-6">
              <StatusRow label="PDF Generator" status="Operational" />
              <StatusRow label="Postgres Cluster" status="Healthy" />
              <StatusRow label="S3 Cold Storage" status="85% Capacity" warning />
              <StatusRow label="Auth Gateway" status="Active" />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const StatusRow = ({ label, status, warning }: { label: string, status: string, warning?: boolean }) => (
  <div className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
    <span className="text-xs font-medium text-zinc-400">{label}</span>
    <span className="flex items-center text-[10px] font-mono uppercase font-bold">
      <div className={`w-2 h-2 rounded-full mr-2 ${warning ? 'bg-amber-500' : 'bg-emerald-500'}`} />
      {status}
    </span>
  </div>
);

export default AdminDashboard;