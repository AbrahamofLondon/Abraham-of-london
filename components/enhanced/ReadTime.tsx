import * as React from "react";
import { Clock } from "lucide-react";

interface ReadTimeProps {
  content: string;
  className?: string;
}

export const ReadTime: React.FC<ReadTimeProps> = ({ content, className = "" }) => {
  const calculateReadTime = React.useCallback((text: string): number => {
    if (!text) return 3;
    
    // Count words (simple approach)
    const words = text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
    
    const wpm = 200; // Average reading speed
    const minutes = Math.max(1, Math.ceil(words / wpm));
    
    return minutes;
  }, []);

  const minutes = React.useMemo(() => calculateReadTime(content), [content, calculateReadTime]);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-sm rounded-full" />
        <div className="relative flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100 shadow-sm">
          <Clock className="w-4 h-4 text-blue-600" />
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-blue-700">{minutes}</span>
            <span className="text-xs text-blue-600">min{minutes !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple version without gradients for fallback
export const SimpleReadTime: React.FC<ReadTimeProps> = ({ content, className = "" }) => {
  const minutes = React.useMemo(() => {
    if (!content) return 3;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [content]);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md ${className}`}>
      <Clock className="w-3.5 h-3.5 text-gray-600" />
      <span className="text-sm font-medium text-gray-700">{minutes} min</span>
    </div>
  );
};
