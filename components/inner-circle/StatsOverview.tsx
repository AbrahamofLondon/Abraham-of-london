// components/inner-circle/StatsOverview.tsx - PRODUCTION READY
import React from 'react';
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  Clock, 
  Users, 
  Award,
  Target,
  BarChart3
} from 'lucide-react';

interface StatsOverviewProps {
  totalContent: number;
  totalViews: number;
  totalLikes: number;
  userStats: {
    totalContentAccessed: number;
    averageTimeSpent?: number;
    completionRate?: number;
  };
  tier: string;
  weeklyGrowth?: {
    content: number;
    views: number;
    engagement: number;
  };
}

const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalContent,
  totalViews,
  totalLikes,
  userStats,
  tier,
  weeklyGrowth = {
    content: 5.2,
    views: 12.3,
    engagement: 8.7
  }
}) => {
  const getTierStats = () => {
    switch (tier) {
      case 'inner-circle-elite':
        return {
          color: 'from-purple-600 to-pink-600',
          label: 'Elite',
          benefits: ['All Content', 'Priority Support', 'Early Access', 'Custom Insights']
        };
      case 'inner-circle-plus':
        return {
          color: 'from-blue-600 to-indigo-600',
          label: 'Plus',
          benefits: ['Premium Content', 'Advanced Tools', 'Community Access']
        };
      case 'inner-circle':
        return {
          color: 'from-green-600 to-teal-600',
          label: 'Basic',
          benefits: ['Core Content', 'Basic Tools', 'Email Support']
        };
      default:
        return {
          color: 'from-gray-600 to-gray-700',
          label: 'Guest',
          benefits: ['Limited Access', 'Basic Features']
        };
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const renderStatCard = (icon: React.ReactNode, label: string, value: number | string, change?: number) => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center mb-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mr-3">
                {icon}
              </div>
              <span className="text-sm font-medium text-gray-600">{label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
            {change !== undefined && (
              <div className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className={`w-4 h-4 inline ${change >= 0 ? '' : 'rotate-180'}`} />
                <span className="ml-1">{Math.abs(change)}% this week</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const tierInfo = getTierStats();

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl shadow-sm p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
          <p className="text-gray-600">Welcome to your Inner Circle dashboard. Here's what's happening.</p>
        </div>
        
        <div className="mt-4 lg:mt-0">
          <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${tierInfo.color} text-white font-medium`}>
            <Award className="w-4 h-4 mr-2" />
            {tierInfo.label} Tier
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {renderStatCard(
          <BarChart3 className="w-5 h-5" />,
          'Total Content',
          formatNumber(totalContent),
          weeklyGrowth.content
        )}
        
        {renderStatCard(
          <Eye className="w-5 h-5" />,
          'Total Views',
          formatNumber(totalViews),
          weeklyGrowth.views
        )}
        
        {renderStatCard(
          <Heart className="w-5 h-5" />,
          'Total Likes',
          formatNumber(totalLikes),
          weeklyGrowth.engagement
        )}
        
        {renderStatCard(
          <Users className="w-5 h-5" />,
          'Your Access',
          userStats.totalContentAccessed,
          undefined
        )}
      </div>

      {/* Tier Benefits & User Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier Benefits */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Tier Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tierInfo.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Progress to Next Tier</h4>
                  <p className="text-sm text-gray-600">Complete more content to unlock higher tiers</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.min(Math.floor((userStats.totalContentAccessed / 50) * 100), 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.floor((userStats.totalContentAccessed / 50) * 100), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Stats */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mr-3">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Content Completed</div>
                  <div className="text-sm text-gray-600">This month</div>
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900">{userStats.totalContentAccessed}</div>
            </div>

            {userStats.averageTimeSpent && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-green-100 text-green-600 mr-3">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Avg. Time Spent</div>
                    <div className="text-sm text-gray-600">Per session</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-900">{userStats.averageTimeSpent}m</div>
              </div>
            )}

            {userStats.completionRate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-600 mr-3">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Completion Rate</div>
                    <div className="text-sm text-gray-600">Overall</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-900">{userStats.completionRate}%</div>
              </div>
            )}

            <div className="pt-4 border-t border-blue-100">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Weekly Engagement</div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-2xl font-bold text-gray-900">{weeklyGrowth.engagement}%</div>
                  <div className={`flex items-center ${weeklyGrowth.engagement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`w-4 h-4 ${weeklyGrowth.engagement >= 0 ? '' : 'rotate-180'}`} />
                    <span className="ml-1 text-sm font-medium">from last week</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;