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
  const recentPDFs = safeArraySlice(
    [...pdfs].sort((a, b) => new Date(b.generatedAt || 0).getTime() - new Date(a.generatedAt || 0).getTime()),
    0,
    5
  );

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

  if (recentPDFs.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm shadow-lg">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          Recent Activity
        </h3>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-600/50 mx-auto mb-4" />
          <p className="text-gray-400 text-sm font-medium mb-2">No recent activity</p>
          <p className="text-gray-500 text-xs">PDFs you generate will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          Recent Activity
        </h3>
        <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-gray-800/50 to-gray-700/30 text-gray-400 rounded-full font-medium">
          {recentPDFs.length} PDFs
        </span>
      </div>
      
      <div className="space-y-3">
        {recentPDFs.map((pdf, index) => (
          <button
            key={pdf.id}
            onClick={() => onSelectPDF(pdf.id)}
            className="w-full text-left p-3 hover:bg-gradient-to-r hover:from-gray-800/40 hover:to-gray-700/30 rounded-xl transition-all duration-300 group border border-transparent hover:border-gray-600/30"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  {getStatusIcon(pdf)}
                  <div className={`absolute -inset-1 rounded-full ${
                    pdf.isGenerating 
                      ? 'bg-amber-500/10 animate-pulse' 
                      : pdf.exists 
                        ? 'bg-green-500/10' 
                        : pdf.error 
                          ? 'bg-red-500/10' 
                          : 'bg-gray-500/10'
                  } group-hover:scale-110 transition-transform duration-300`} />
                </div>
                <span className="text-xs font-medium text-gray-300 truncate group-hover:text-white transition-colors duration-300">
                  {pdf.title || `PDF ${index + 1}`}
                </span>
              </div>
              {/* FIX: Use generatedAt instead of lastGenerated */}
              <span className="text-xs text-gray-500 shrink-0 ml-2 group-hover:text-gray-300 transition-colors duration-300">
                {formatTimeAgo(pdf.generatedAt)}
              </span>
            </div>
            
            {pdf.description && (
              <p className="text-xs text-gray-400 truncate group-hover:text-gray-300 transition-colors duration-300">
                {pdf.description}
              </p>
            )}
            
            {pdf.error && (
              <div className="mt-2">
                <span className="text-xs px-2 py-1 bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-400 rounded-full">
                  Error: {pdf.error}
                </span>
              </div>
            )}
            
            {/* Progress indicator for generating PDFs */}
            {pdf.isGenerating && (
              <div className="mt-2">
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 animate-pulse" style={{ width: '50%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Generating...</p>
              </div>
            )}
            
            {/* File info for existing PDFs */}
            {pdf.exists && !pdf.error && pdf.fileSize && (
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                <span className="px-2 py-1 bg-gradient-to-r from-gray-800/30 to-gray-700/20 rounded-lg">
                  {pdf.fileSize}
                </span>
                {pdf.pageCount && (
                  <span className="px-2 py-1 bg-gradient-to-r from-gray-800/30 to-gray-700/20 rounded-lg">
                    {pdf.pageCount} pages
                  </span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700/30">
        <p className="text-xs text-gray-500 text-center">
          Showing {recentPDFs.length} of {pdfs.length} PDFs
        </p>
      </div>
    </div>
  );
};