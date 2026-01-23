// components/layout/Header.tsx
import React from 'react';
import Link from 'next/link';
import { User, Bell, Search } from 'lucide-react';

interface HeaderProps {
  userTier?: string;
}

const Header: React.FC<HeaderProps> = ({ userTier }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IC</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Inner Circle</span>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
              <Search className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">Member</p>
                <p className="text-xs text-gray-500 capitalize">
                  {userTier?.replace(/-/g, ' ') || 'inner circle'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;