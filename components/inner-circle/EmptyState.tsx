// components/inner-circle/EmptyState.tsx - PRODUCTION READY
import React from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  PlusCircle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  secondaryActionLabel?: string;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'search' | 'error' | 'success' | 'upgrade';
  showSuggestions?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  secondaryActionLabel,
  onAction,
  onSecondaryAction,
  icon,
  variant = 'default',
  showSuggestions = true
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'search':
        return {
          icon: <Search className="w-12 h-12 text-gray-400" />,
          bgColor: 'bg-gray-50',
          iconBg: 'bg-gray-100',
          borderColor: 'border-gray-200'
        };
      case 'error':
        return {
          icon: <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>,
          bgColor: 'bg-red-50',
          iconBg: 'bg-red-100',
          borderColor: 'border-red-200'
        };
      case 'success':
        return {
          icon: <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>,
          bgColor: 'bg-green-50',
          iconBg: 'bg-green-100',
          borderColor: 'border-green-200'
        };
      case 'upgrade':
        return {
          icon: <TrendingUp className="w-12 h-12 text-purple-400" />,
          bgColor: 'bg-gradient-to-r from-purple-50 to-pink-50',
          iconBg: 'bg-gradient-to-r from-purple-100 to-pink-100',
          borderColor: 'border-purple-200'
        };
      default:
        return {
          icon: <FileText className="w-12 h-12 text-gray-400" />,
          bgColor: 'bg-gray-50',
          iconBg: 'bg-gray-100',
          borderColor: 'border-gray-200'
        };
    }
  };

  const variantStyles = getVariantStyles();

  const suggestions = [
    { label: 'Try different search terms', icon: <Search className="w-4 h-4" /> },
    { label: 'Clear all filters', icon: <Filter className="w-4 h-4" /> },
    { label: 'Check your tier permissions', icon: <TrendingUp className="w-4 h-4" /> },
    { label: 'Browse all categories', icon: <RefreshCw className="w-4 h-4" /> }
  ];

  const upgradeSuggestions = [
    { label: 'Unlock premium content', icon: <PlusCircle className="w-4 h-4" /> },
    { label: 'Get exclusive insights', icon: <TrendingUp className="w-4 h-4" /> },
    { label: 'Access advanced tools', icon: <FileText className="w-4 h-4" /> },
    { label: 'Join elite community', icon: <ArrowRight className="w-4 h-4" /> }
  ];

  const activeSuggestions = variant === 'upgrade' ? upgradeSuggestions : suggestions;

  return (
    <div className={`rounded-2xl ${variantStyles.bgColor} border ${variantStyles.borderColor} p-8`}>
      <div className="max-w-md mx-auto text-center">
        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${variantStyles.iconBg} mb-6`}>
          {icon || variantStyles.icon}
        </div>

        {/* Title & Message */}
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 mb-8">{message}</p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                variant === 'upgrade'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {actionLabel}
            </button>
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <div className="border-t border-gray-200 pt-8">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              {variant === 'upgrade' ? 'What you\'ll get:' : 'Quick suggestions:'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <div className={`p-1.5 rounded-md ${
                    variant === 'upgrade' 
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600'
                      : 'bg-blue-100 text-blue-600'
                  } mr-3`}>
                    {suggestion.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{suggestion.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade CTA for non-upgrade variants */}
        {variant !== 'upgrade' && showSuggestions && (
          <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900">Want more content?</h5>
                <p className="text-sm text-gray-600 mt-1">Upgrade your tier for exclusive access</p>
              </div>
              <button
                onClick={() => window.location.href = '/inner-circle/upgrade'}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-md transition-shadow"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;