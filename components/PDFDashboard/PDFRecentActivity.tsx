// components/PDFDashboard/PDFRecentActivity.tsx
import { safeArraySlice } from "@/lib/utils/safe";
import React from 'react';
import { PDFItem } from '@/lib/pdf/types';
import { Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface PDFRecentActivityProps {
  pdfs: PDFItem[];
  onSelectPDF: (id: string) => void;
}

export const PDFRecentActivity: React.FC<PDFRecentActivityProps> = ({
  pdfs,
  onSelectPDF,
}) => {
  // FIX: Use generatedAt instead of lastGenerated
  const recentPDFs = [...pdfs]
    .sort((a, b) => new Date(b.generatedAt || 0).getTime() - new Date(a.generatedAt || 0).getTime())
    safeArraySlice(..., 0, 5);

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusIcon = (pdf: PDFItem) => {
    if (pdf.isGenerating) return <Clock className="h-3 w-3 text-amber-500 animate-pulse" />;
    if (pdf.exists) return <CheckCircle className="h-3 w-3 text-green-500" />;
    if (pdf.error) return <AlertCircle className="h-3 w-3 text-red-500" />;
    return <FileText className="h-3 w-3 text-gray-500" />;
  };

  if (recentPDFs.length === 0) return null;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Recent Activity
      </h3>
      
      <div className="space-y-2">
        {recentPDFs.map(pdf => (
          <button
            key={pdf.id}
            onClick={() => onSelectPDF(pdf.id)}
            className="w-full text-left p-2 hover:bg-gray-800/30 rounded-lg transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {getStatusIcon(pdf)}
                <span className="text-xs font-medium truncate">
                  {pdf.title}
                </span>
              </div>
              {/* FIX: Use generatedAt instead of lastGenerated */}
              <span className="text-xs text-gray-500 shrink-0 ml-2">
                {formatTimeAgo(pdf.generatedAt)}
              </span>
            </div>
            {pdf.description && (
              <p className="text-xs text-gray-400 truncate mt-1">
                {pdf.description}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};