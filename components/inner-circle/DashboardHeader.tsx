// components/inner-circle/DashboardHeader.tsx - PRODUCTION READY
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, Search, User, Settings, LogOut } from 'lucide-react';

interface DashboardHeaderProps {
  userTier: string;
  userName?: string;
  subscriptionStatus: string;
  lastLogin?: Date;
  onRefresh: () => void;
  onSearch?: (query: string) => void;
  showNotifications?: boolean;
  notificationCount?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userTier,
  userName = 'Member',
  subscriptionStatus,
  lastLogin,
  onRefresh,
  onSearch,
  showNotifications = true,
  notificationCount = 0
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleLogout = () => {
    // In production, call your logout API
    document.cookie = 'innerCircleAccess=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'innerCircleToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'inner-circle-elite':
        return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white';
      case 'inner-circle-plus':
        return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white';
      case 'inner-circle':
        return 'bg-gradient-to-r from-green-600 to-teal-600 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'inner-circle-elite':
        return 'Elite Member';
      case 'inner-circle-plus':
        return 'Plus Member';
      case 'inner-circle':
        return 'Member';
      default:
        return 'Guest';
    }
  };

  const formatLastLogin = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left section - Logo and Breadcrumbs */}
          <div className="flex items-center space-x-4">
            <Link href="/inner-circle" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Inner Circle</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTierBadgeColor(userTier)}`}>
                    {getTierLabel(userTier)}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="capitalize">{subscriptionStatus}</span>
                  {lastLogin && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">Last login: {formatLastLogin(lastLogin)}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* Middle section - Search */}
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSearch} className="relative">
              <div className={`relative flex items-center transition-all duration-200 ${
                isSearchFocused ? 'ring-2 ring-blue-500' : ''
              }`}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search content, insights, or members..."
                  className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-12 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Right section - User actions */}
          <div className="flex items-center space-x-4">
            {/* Refresh button */}
            <button
              onClick={onRefresh}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Notifications */}
            {showNotifications && (
              <div className="relative">
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500 capitalize">{userTier.replace(/-/g, ' ')}</p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <Link
                      href="/inner-circle/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      Your Profile
                    </Link>
                    <Link
                      href="/inner-circle/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Secondary navigation */}
        <div className="mt-4 flex items-center space-x-6 border-t border-gray-100 pt-4">
          <Link
            href="/inner-circle"
            className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1"
          >
            Dashboard
          </Link>
          <Link
            href="/inner-circle/content"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Content Library
          </Link>
          <Link
            href="/inner-circle/insights"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Insights
          </Link>
          <Link
            href="/inner-circle/community"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Community
          </Link>
          <Link
            href="/inner-circle/tools"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
          >
            Tools
          </Link>
          <Link
            href="/inner-circle/upgrade"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors ml-auto"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;