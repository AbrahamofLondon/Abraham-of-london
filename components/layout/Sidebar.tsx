/* components/layout/Sidebar.tsx — ROUTER-FREE (SSOT ALIGNED) */
import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Users, 
  Settings, 
  HelpCircle,
  TrendingUp,
  BookOpen,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  /** Current path for active state (passed from parent) */
  currentPath?: string;
  /** Optional: Pass brief counts or categories for UI badges */
  briefCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen = true,
  currentPath = '/',
  briefCount = 75
}) => {
  const path = currentPath;

  const menuItems = [
    { path: '/inner-circle/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { 
      path: '/inner-circle/content', 
      label: 'Content Library', 
      icon: <FileText className="w-5 h-5" />,
      badge: briefCount > 0 ? briefCount : null 
    },
    { path: '/inner-circle/insights', label: 'Intelligence Vault', icon: <ShieldCheck className="w-5 h-5" /> },
    { path: '/inner-circle/tools', label: 'Analytical Tools', icon: <BarChart3 className="w-5 h-5" /> },
    { path: '/inner-circle/education', label: 'Canon Training', icon: <BookOpen className="w-5 h-5" /> },
  ];

  const bottomMenuItems = [
    { path: '/inner-circle/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { path: '/inner-circle/help', label: 'Help & Support', icon: <HelpCircle className="w-5 h-5" /> },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      {/* Branding Segment */}
      <div className="p-6 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-md">
            <Zap className="text-amber-400 w-5 h-5" fill="currentColor" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">Inner Circle</h1>
            <p className="text-[10px] uppercase tracking-widest text-blue-600 font-bold">Institutional</p>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Operations
        </div>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = path === item.path || (item.path !== '/inner-circle/dashboard' && path.startsWith(item.path));
            
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`group flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-inner'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`${isActive ? 'text-amber-400' : 'text-gray-400 group-hover:text-gray-600'}`}>
                      {item.icon}
                    </span>
                    <span className="font-semibold text-sm">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-amber-400 text-slate-900' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Intelligence Sections */}
        <div className="mt-8 px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          Classified
        </div>
        <ul className="space-y-1">
          <li>
            <Link 
              href="/inner-circle/content?category=briefs"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span>Intelligence Briefs</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/inner-circle/content?category=canon"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-500 hover:text-purple-600 transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span>Core Canon</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* User Actions */}
      <div className="p-4 space-y-4 border-t border-gray-100 bg-gray-50/30">
        <ul className="space-y-1">
          {bottomMenuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className="flex items-center space-x-3 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="text-gray-400">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="bg-slate-900 rounded-xl p-4 text-white relative overflow-hidden">
           <div className="relative z-10">
            <h4 className="font-bold text-xs mb-1">Status: Operator</h4>
            <p className="text-[10px] text-gray-400 mb-3">Clearance level confirmed.</p>
            <Link
              href="/inner-circle/upgrade"
              className="block text-center bg-amber-400 text-slate-900 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-amber-300 transition-colors"
            >
              Higher Clearance
            </Link>
          </div>
          <ShieldCheck className="absolute -right-2 -bottom-2 w-12 h-12 text-white/5" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;