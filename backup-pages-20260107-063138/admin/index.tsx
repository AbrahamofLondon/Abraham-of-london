import React from 'react';
import Link from 'next/link'; // ADD THIS IMPORT
import AdminLayout from '@/components/AdminLayout';
import { 
  TrendingUp, 
  FileText, 
  Users, 
  Database,
  AlertCircle,
  CheckCircle2,
  ChevronRight // ADD THIS IMPORT
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
    { title: 'Generate All PDFs', href: '/admin/pdf-dashboard', color: 'bg-gradient-to-r from-amber-500 to-orange-500' },
    { title: 'View System Logs', href: '/admin/settings/logs', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { title: 'Manage Users', href: '/admin/users', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { title: 'API Documentation', href: '/admin/settings/api', color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
  ];

  return (
    <AdminLayout>
      {/* Welcome Banner */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, Administrator</h1>
            <p className="text-gray-300">
              Your PDF Intelligence Dashboard is ready. {stats[0].value} documents available for management.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-sm text-gray-400">Last system check</p>
              <p className="text-xl font-bold">2 minutes ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div 
            key={stat.title} 
            className={`${stat.color} border rounded-xl p-6 transition-all hover:shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              {stat.icon}
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                stat.change.startsWith('+') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</h3>
            <p className="text-gray-600">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className={`${action.color} text-white rounded-xl p-6 transition-transform hover:scale-[1.02] hover:shadow-xl block`}
              >
                <h3 className="text-lg font-bold mb-2">{action.title}</h3>
                <p className="text-white/80 text-sm">Click to navigate →</p>
              </Link>
            ))}
          </div>

          {/* PDF Dashboard Card */}
          <div className="mt-8 p-6 border border-gray-200 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  🚀 PDF Intelligence Dashboard
                </h3>
                <p className="text-gray-600 mb-4">
                  Access advanced PDF generation, management, and analytics tools.
                </p>
                <Link
                  href="/admin/pdf-dashboard"
                  className="inline-flex items-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:shadow-lg transition-all"
                >
                  Open Dashboard
                  <ChevronRight size={16} className="ml-2" />
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="text-4xl">📊</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
            <Link href="/admin/settings/logs" className="text-sm text-amber-600 hover:text-amber-700">
              View all →
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div 
                key={activity.id} 
                className="p-4 bg-white border border-gray-200 rounded-xl"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-800">{activity.action}</p>
                    <p className="text-sm text-gray-500">by {activity.user}</p>
                  </div>
                  {activity.status === 'success' ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : activity.status === 'error' ? (
                    <AlertCircle size={20} className="text-red-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-blue-500" />
                  )}
                </div>
                <p className="text-xs text-gray-400">{activity.time}</p>
              </div>
            ))}
          </div>

          {/* System Status */}
          <div className="mt-8 p-6 bg-gray-900 text-white rounded-xl">
            <h3 className="text-lg font-bold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>PDF Generation API</span>
                <span className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Database</span>
                <span className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Storage</span>
                <span className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                  85% Used
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
