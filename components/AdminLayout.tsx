import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Users, 
  BarChart3, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  const navItems = [
    {
      title: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      href: '/admin',
      exact: true
    },
    {
      title: 'PDF Intelligence',
      icon: <FileText size={20} />,
      href: '/admin/pdf-dashboard',
      badge: 'New'
    },
    {
      title: 'Content Management',
      icon: <BarChart3 size={20} />,
      href: '/admin/content',
      children: [
        { title: 'Articles', href: '/admin/content/articles' },
        { title: 'Media', href: '/admin/content/media' },
        { title: 'Templates', href: '/admin/content/templates' }
      ]
    },
    {
      title: 'User Management',
      icon: <Users size={20} />,
      href: '/admin/users'
    },
    {
      title: 'System Settings',
      icon: <Settings size={20} />,
      href: '/admin/settings',
      children: [
        { title: 'General', href: '/admin/settings/general' },
        { title: 'API Keys', href: '/admin/settings/api' },
        { title: 'Logs', href: '/admin/settings/logs' }
      ]
    }
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return router.pathname === href;
    return router.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white shadow-md border"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white 
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600" />
            <div>
              <h1 className="text-xl font-bold">Admin Portal</h1>
              <p className="text-xs text-gray-400">Institutional Publishing</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            const hasChildren = item.children && item.children.length > 0;
            
            return (
              <div key={item.title}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center justify-between p-3 rounded-lg transition-all
                    ${active 
                      ? 'bg-amber-500/20 text-amber-300 border-l-4 border-amber-500' 
                      : 'hover:bg-gray-800'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span className="font-medium">{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className="text-xs px-2 py-1 bg-amber-500/30 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {hasChildren && <ChevronRight size={16} className="ml-auto" />}
                </Link>

                {/* Submenu */}
                {hasChildren && active && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`
                          block p-2 text-sm rounded hover:bg-gray-800
                          ${router.pathname === child.href ? 'text-amber-300' : 'text-gray-400'}
                        `}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="font-bold">AD</span>
            </div>
            <div className="flex-1">
              <p className="font-medium">Admin User</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {navItems.find(item => isActive(item.href))?.title || 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-500">
                Institutional Publishing • Dynamic Registry
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              </button>
              <div className="text-right">
                <p className="text-sm font-medium">Last sync: 2 min ago</p>
                <p className="text-xs text-gray-500">All systems operational</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
