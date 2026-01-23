// components/inner-circle/QuickActions.tsx - PRODUCTION READY
import React from 'react';
import {
  Settings,
  CreditCard,
  Users,
  HelpCircle,
  Share2,
  Bell,
  BookOpen,
  Download,
  Star,
  Zap,
  Mail,
  Shield
} from 'lucide-react';

interface QuickActionsProps {
  userTier: string;
  onViewProfile: () => void;
  onUpgrade: () => void;
  onManageSubscription: () => void;
  onInviteFriend: () => void;
  onContactSupport: () => void;
  onSettings?: () => void;
  onNotifications?: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  userTier,
  onViewProfile,
  onUpgrade,
  onManageSubscription,
  onInviteFriend,
  onContactSupport,
  onSettings,
  onNotifications
}) => {
  const actions = [
    {
      id: 'profile',
      icon: <Users className="w-5 h-5" />,
      label: 'Your Profile',
      description: 'View and edit your profile',
      onClick: onViewProfile,
      color: 'bg-blue-100 text-blue-600',
      available: true
    },
    {
      id: 'upgrade',
      icon: <Zap className="w-5 h-5" />,
      label: 'Upgrade Plan',
      description: 'Unlock premium features',
      onClick: onUpgrade,
      color: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600',
      available: userTier !== 'inner-circle-elite'
    },
    {
      id: 'subscription',
      icon: <CreditCard className="w-5 h-5" />,
      label: 'Subscription',
      description: 'Manage billing & plan',
      onClick: onManageSubscription,
      color: 'bg-green-100 text-green-600',
      available: true
    },
    {
      id: 'invite',
      icon: <Share2 className="w-5 h-5" />,
      label: 'Invite Friends',
      description: 'Earn rewards for referrals',
      onClick: onInviteFriend,
      color: 'bg-orange-100 text-orange-600',
      available: true
    },
    {
      id: 'downloads',
      icon: <Download className="w-5 h-5" />,
      label: 'Downloads',
      description: 'Your saved content',
      onClick: () => window.open('/inner-circle/downloads', '_blank'),
      color: 'bg-indigo-100 text-indigo-600',
      available: true
    },
    {
      id: 'bookmarks',
      icon: <BookOpen className="w-5 h-5" />,
      label: 'Bookmarks',
      description: 'Saved articles & insights',
      onClick: () => window.open('/inner-circle/bookmarks', '_blank'),
      color: 'bg-pink-100 text-pink-600',
      available: true
    }
  ];

  const supportActions = [
    {
      id: 'support',
      icon: <HelpCircle className="w-5 h-5" />,
      label: 'Help & Support',
      onClick: onContactSupport,
      available: true
    },
    {
      id: 'settings',
      icon: <Settings className="w-5 h-5" />,
      label: 'Settings',
      onClick: onSettings || (() => window.open('/inner-circle/settings', '_blank')),
      available: true
    },
    {
      id: 'notifications',
      icon: <Bell className="w-5 h-5" />,
      label: 'Notifications',
      onClick: onNotifications || (() => window.open('/inner-circle/notifications', '_blank')),
      available: true
    }
  ];

  const getTierSpecificActions = () => {
    switch (userTier) {
      case 'inner-circle-elite':
        return [
          {
            id: 'priority-support',
            icon: <Shield className="w-5 h-5" />,
            label: 'Priority Support',
            description: '24/7 dedicated support',
            onClick: () => window.open('/inner-circle/priority-support', '_blank'),
            color: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-600',
            available: true
          },
          {
            id: 'elite-insights',
            icon: <Star className="w-5 h-5" />,
            label: 'Elite Insights',
            description: 'Exclusive research & data',
            onClick: () => window.open('/inner-circle/elite-insights', '_blank'),
            color: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-600',
            available: true
          }
        ];
      case 'inner-circle-plus':
        return [
          {
            id: 'advanced-tools',
            icon: <Settings className="w-5 h-5" />,
            label: 'Advanced Tools',
            description: 'Premium analysis tools',
            onClick: () => window.open('/inner-circle/tools', '_blank'),
            color: 'bg-blue-100 text-blue-600',
            available: true
          }
        ];
      default:
        return [];
    }
  };

  const tierActions = getTierSpecificActions();

  return (
    <div className="space-y-6">
      {/* Quick Actions Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <span className="text-xs text-gray-500">Jump to common tasks</span>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={!action.available}
            className={`flex items-center p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all duration-200 ${
              !action.available ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${action.color} mr-4`}>
              {action.icon}
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900">{action.label}</div>
              <div className="text-sm text-gray-600">{action.description}</div>
            </div>
            <div className="text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Tier-Specific Actions */}
      {tierActions.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Tier Benefits</h4>
          <div className="grid grid-cols-1 gap-3">
            {tierActions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className="flex items-center p-3 rounded-lg border border-gray-200 bg-white hover:shadow-sm transition-all duration-200"
              >
                <div className={`p-1.5 rounded-md ${action.color} mr-3`}>
                  {action.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{action.label}</div>
                  <div className="text-xs text-gray-600">{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Support Actions */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-2">
          {supportActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex flex-col items-center p-3 rounded-lg border border-gray-200 bg-white hover:shadow-sm transition-all duration-200"
            >
              <div className="p-1.5 rounded-md bg-gray-100 text-gray-600 mb-2">
                {action.icon}
              </div>
              <span className="text-xs font-medium text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Help Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mr-3">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">Need Help?</h4>
            <p className="text-sm text-gray-600 mb-3">
              Our support team is here to help you get the most out of your membership.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={onContactSupport}
                className="flex-1 bg-white text-blue-600 border border-blue-200 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Contact Support
              </button>
              <button
                onClick={() => window.open('/inner-circle/faq', '_blank')}
                className="flex-1 bg-transparent text-gray-600 border border-gray-300 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                View FAQ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Signup */}
      {userTier !== 'inner-circle-elite' && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="flex items-start">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600 mr-3">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">Weekly Insights</h4>
              <p className="text-sm text-gray-600 mb-3">
                Get curated insights delivered to your inbox every week.
              </p>
              <button
                onClick={() => window.open('/inner-circle/newsletter', '_blank')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Subscribe to Newsletter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActions;