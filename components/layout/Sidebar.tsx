/* components/layout/Sidebar.tsx — ROUTER-FREE (SSOT ALIGNED) */
"use client";

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, FileText, BarChart3, Settings, 
  HelpCircle, BookOpen, ShieldCheck, Zap 
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  /** Current path passed from parent (e.g. window.location.pathname) */
  currentPath?: string;
  briefCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen = true,
  currentPath = '/',
  briefCount = 75
}) => {
  
  // Primary Navigation Items
  const menuItems = [
    { id: 'dash', path: '/inner-circle/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'vault', path: '/vault/briefs', label: 'Intelligence Vault', icon: <ShieldCheck className="w-5 h-5" />, badge: briefCount },
    { id: 'canon', path: '/canon', label: 'Core Canon', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'lib', path: '/library', label: 'Library', icon: <FileText className="w-5 h-5" /> },
  ];

  // Secondary/Bottom Navigation Items
  const bottomMenuItems = [
    { id: 'settings', path: '/inner-circle/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { id: 'help', path: '/inner-circle/help', label: 'Help & Support', icon: <HelpCircle className="w-5 h-5" /> },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm select-none">
      {/* Branding Segment */}
      <div className="p-6 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-lg border border-white/10">
            <Zap className="text-amber-400 w-5 h-5" fill="currentColor" />
          </div>
          <div>
            <h1 className="font-black text-[13px] text-gray-900 uppercase tracking-wider">Inner Circle</h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-blue-600 font-bold">Institutional</p>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="px-3 mb-3 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-[0.15em]">
          Operations
        </div>
        <ul className="space-y-1.5">
          {menuItems.map((item, idx) => {
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
            
            return (
              <li key={`sidebar-nav-${item.id}-${idx}`}>
                <Link
                  href={item.path}
                  className={`group flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={isActive ? 'text-amber-400' : 'text-gray-400 group-hover:text-gray-600'}>
                      {item.icon}
                    </span>
                    <span className="font-bold text-xs uppercase tracking-tight">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isActive ? 'bg-amber-400 text-black' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Intelligence Quick Links */}
        <div className="mt-8 px-3 mb-3 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-[0.15em]">
          Classified
        </div>
        <ul className="space-y-1">
          <li>
            <Link 
              href="/vault/briefs"
              className="flex items-center space-x-3 px-4 py-2 text-[11px] font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-wide"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
              <span>Intelligence Briefs</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/canon"
              className="flex items-center space-x-3 px-4 py-2 text-[11px] font-bold text-gray-500 hover:text-amber-600 transition-colors uppercase tracking-wide"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
              <span>Core Canon</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* User Actions & Clearance Status */}
      <div className="p-4 space-y-4 border-t border-gray-100 bg-gray-50/30">
        <ul className="space-y-1">
          {bottomMenuItems.map((item, idx) => (
            <li key={`sidebar-bottom-${item.id}-${idx}`}>
              <Link
                href={item.path}
                className="flex items-center space-x-3 px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-tight"
              >
                <span className="text-gray-400">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="bg-slate-900 rounded-xl p-4 text-white relative overflow-hidden border border-white/5 shadow-2xl">
           <div className="relative z-10">
            <h4 className="font-black text-[10px] mb-1 uppercase tracking-widest text-amber-400">Status: Operator</h4>
            <p className="text-[10px] font-mono text-gray-400 mb-3 opacity-80">Clearance level confirmed.</p>
            <Link
              href="/artifacts"
              className="block text-center bg-white text-black py-2 px-4 rounded font-black text-[9px] uppercase tracking-[0.2em] hover:bg-amber-400 transition-all duration-300"
            >
              Higher Clearance
            </Link>
          </div>
          <ShieldCheck className="absolute -right-2 -bottom-2 w-14 h-14 text-white/5 rotate-12" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;