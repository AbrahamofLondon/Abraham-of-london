// components/ui/LoadingOverlay.tsx
import React from 'react';

interface LoadingOverlayProps {
  message?: string;
  show?: boolean;
  fullscreen?: boolean;
  transparent?: boolean;
  zIndex?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  show = true,
  fullscreen = false,
  transparent = false,
  zIndex = 50,
}) => {
  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center ${
        transparent ? 'bg-transparent' : 'bg-gray-950/80 backdrop-blur-sm'
      } ${fullscreen ? 'min-h-screen' : ''}`}
      style={{ zIndex }}
    >
      <div className="text-center">
        <div className="relative inline-block">
          {/* Outer spinner */}
          <div className="h-16 w-16 rounded-full border-4 border-gray-700"></div>
          
          {/* Inner animated spinner */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
          
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-blue-400"></div>
          </div>
        </div>
        
        {message && (
          <div className="mt-6">
            <p className="text-gray-300 text-lg font-medium mb-2">{message}</p>
            <div className="flex justify-center space-x-1">
              <div className="h-1 w-1 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="h-1 w-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-1 w-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};