// components/ui/LoadingState.tsx
import React from 'react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  showProgress?: boolean;
  progress?: number;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  subMessage,
  showProgress = false,
  progress = 0,
  theme = 'light',
  size = 'md',
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-b-2',
    lg: 'h-12 w-12 border-b-2',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const containerClasses = fullScreen 
    ? `min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`
    : `flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50/50'} rounded-lg p-8`;

  return (
    <div className={containerClasses}>
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-flex items-center justify-center mb-4">
          <div 
            className={`animate-spin rounded-full ${sizeClasses[size]} ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
            style={{
              borderTopColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
            }}
          />
        </div>

        {/* Message */}
        <p className={`font-medium ${textSizes[size]} ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'} mb-1`}>
          {message}
        </p>

        {/* Sub-message */}
        {subMessage && (
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {subMessage}
          </p>
        )}

        {/* Progress bar */}
        {showProgress && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            {progress > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {Math.round(progress)}% complete
              </p>
            )}
          </div>
        )}

        {/* Dots animation for indeterminate loading */}
        {!showProgress && (
          <div className="flex justify-center space-x-1 mt-2">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"
                style={{ animationDelay: `${dot * 0.2}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Variants for common use cases
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; color?: string }> = ({ 
  size = 'md', 
  color = 'blue' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const colorClasses = {
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-600',
  };

  return (
    <div className="flex items-center justify-center">
      <svg 
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

export const LoadingOverlay: React.FC<LoadingStateProps> = (props) => (
  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
    <LoadingState {...props} />
  </div>
);

LoadingState.displayName = 'LoadingState';
LoadingSpinner.displayName = 'LoadingSpinner';
LoadingOverlay.displayName = 'LoadingOverlay';