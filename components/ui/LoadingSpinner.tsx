// components/ui/LoadingSpinner.tsx - CORRECTED
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray' | 'purple';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'blue',
  text,
  fullScreen = false,
  overlay = false,
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-600',
    purple: 'text-purple-600'
  };

  const spinner = (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${colorClasses[color]}`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${sizeClasses[size]} rounded-full border-2 border-solid border-current border-t-transparent opacity-20`}></div>
      </div>
      {text && (
        <span className={`ml-3 font-medium ${colorClasses[color]}`}>
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
        <div className="text-center">
          {spinner}
          <p className="mt-4 text-gray-600">Loading your experience...</p>
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Skeleton Loader Component
export const SkeletonLoader: React.FC<{
  type?: 'text' | 'card' | 'list' | 'image';
  count?: number;
  className?: string;
}> = ({ type = 'card', count = 1, className = '' }) => {
  const skeletons = [];

  switch (type) {
    case 'text':
      for (let i = 0; i < count; i++) {
        skeletons.push(
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          </div>
        );
      }
      break;

    case 'card':
      for (let i = 0; i < count; i++) {
        skeletons.push(
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        );
      }
      break;

    case 'list':
      for (let i = 0; i < count; i++) {
        skeletons.push(
          <div key={i} className="flex items-center space-x-4 p-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        );
      }
      break;

    case 'image':
      for (let i = 0; i < count; i++) {
        skeletons.push(
          <div key={i} className="bg-gray-200 rounded-lg animate-pulse aspect-video"></div>
        );
      }
      break;
  }

  return <div className={className}>{skeletons}</div>;
};

// If you need a default export for backward compatibility, add:
export default LoadingSpinner;