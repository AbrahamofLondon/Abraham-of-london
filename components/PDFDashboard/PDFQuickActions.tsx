// components/PDFDashboard/PDFQuickActions.tsx
import React from 'react';
import { RefreshCw, Download, Tag, Filter, Grid, List, Settings } from 'lucide-react';

interface PDFQuickActionsProps {
  isGenerating: boolean;
  selectedCount: number;
  onGenerateAll: () => void;
  onRefresh: () => void;
  onBatchTag: () => void;
  onSettingsClick?: () => void;
}

export const PDFQuickActions: React.FC<PDFQuickActionsProps> = ({
  isGenerating,
  selectedCount,
  onGenerateAll,
  onRefresh,
  onBatchTag,
  onSettingsClick,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={isGenerating}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
        
        <button
          onClick={onGenerateAll}
          disabled={isGenerating}
          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Generate All Missing
        </button>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2 ml-2">
            <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
              {selectedCount} selected
            </span>
            <button
              onClick={onBatchTag}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg flex items-center gap-1"
            >
              <Tag className="h-3 w-3" />
              Tag Selected
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          title="Toggle Grid/List View"
        >
          <Grid className="h-4 w-4" />
        </button>
        
        <button
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          title="Filter Options"
        >
          <Filter className="h-4 w-4" />
        </button>
        
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};