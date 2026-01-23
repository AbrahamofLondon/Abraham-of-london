// components/layout/Sidebar.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Users, 
  Settings, 
  HelpCircle,
  TrendingUp,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
  const router = useRouter();
  const currentPath = router.pathname;

  const menuItems = [
    { path: '/inner-circle/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/inner-circle/content', label: 'Content Library', icon: <FileText className="w-5 h-5" /> },
    { path: '/inner-circle/insights', label: 'Insights', icon: <TrendingUp className="w-5 h-5" /> },
    { path: '/inner-circle/community', label: 'Community', icon: <Users className="w-5 h-5" /> },
    { path: '/inner-circle/tools', label: 'Tools', icon: <BarChart3 className="w-5 h-5" /> },
    { path: '/inner-circle/education', label: 'Education', icon: <BookOpen className="w-5 h-5" /> },
  ];

  const bottomMenuItems = [
    { path: '/inner-circle/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { path: '/inner-circle/help', label: 'Help & Support', icon: <HelpCircle className="w-5 h-5" /> },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">IC</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Inner Circle</h1>
            <p className="text-xs text-gray-500">Premium Access</p>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path || currentPath.startsWith(item.path);
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200"></div>

        {/* Bottom Menu */}
        <ul className="space-y-1">
          {bottomMenuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-500">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Upgrade Banner */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <h4 className="font-semibold text-gray-900 text-sm mb-2">Upgrade Your Tier</h4>
          <p className="text-xs text-gray-600 mb-3">
            Unlock premium features and exclusive content.
          </p>
          <Link
            href="/inner-circle/upgrade"
            className="block text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;