import React from 'react';

interface PDFQuickActionsProps {
  selectedCount: number;
  isGenerating: boolean;
  onRefresh: () => void;
  onGenerateAll: () => void;
  onBatchDelete: () => void;
  onClearSelection: () => void;
}

export const PDFQuickActions: React.FC<PDFQuickActionsProps> = ({
  selectedCount,
  isGenerating,
  onRefresh,
  onGenerateAll,
  onBatchDelete,
  onClearSelection,
}) => {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">Selected:</span>
        <span className="font-semibold">{selectedCount}</span>
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <>
            <button
              onClick={onBatchDelete}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors text-sm"
            >
              Delete Selected ({selectedCount})
            </button>
            <button
              onClick={onClearSelection}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Clear
            </button>
          </>
        )}
        
        <button
          onClick={onRefresh}
          disabled={isGenerating}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
        >
          Refresh
        </button>
        
        <button
          onClick={onGenerateAll}
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
        >
          {isGenerating ? 'Generating...' : 'Generate All'}
        </button>
      </div>
    </div>
  );
};