// components/PDFQuickActions.tsx
import * as React from "react";

export interface PDFQuickActionsProps {
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
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-700/50 bg-gray-800/30 p-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">Selected:</span>
        <span className="font-semibold">{selectedCount}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {selectedCount > 0 ? (
          <>
            <button
              onClick={onBatchDelete}
              className="rounded-lg bg-red-600/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30"
            >
              Delete Selected ({selectedCount})
            </button>

            <button
              onClick={onClearSelection}
              className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
            >
              Clear
            </button>
          </>
        ) : null}

        <button
          onClick={onRefresh}
          disabled={isGenerating}
          className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Refresh
        </button>

        <button
          onClick={onGenerateAll}
          disabled={isGenerating}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Generate All"}
        </button>
      </div>
    </div>
  );
};

export default PDFQuickActions;
