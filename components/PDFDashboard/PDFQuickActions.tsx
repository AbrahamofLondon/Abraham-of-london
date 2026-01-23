// components/PDFDashboard/PDFQuickActions.tsx
import React, { useCallback, useMemo, useState } from "react";

type Props = {
  isGenerating: boolean;
  selectedCount: number;

  onGenerateAll: () => Promise<void> | void;
  onRefresh: () => void;

  // ✅ matches your real batchTag signature
  onBatchTag: (tag: string, pdfIds?: string[]) => Promise<void> | void;

  // Optional: pass selected IDs directly from parent
  selectedIds?: string[];
};

export const PDFQuickActions: React.FC<Props> = ({
  isGenerating,
  selectedCount,
  onGenerateAll,
  onRefresh,
  onBatchTag,
  selectedIds,
}) => {
  const [tag, setTag] = useState("");

  const canTag = useMemo(
    () => selectedCount > 0 && tag.trim().length > 0,
    [selectedCount, tag]
  );

  const handleTag = useCallback(async () => {
    if (!canTag) return;

    const cleanTag = tag.trim();
    const ids = selectedIds && selectedIds.length > 0 ? selectedIds : undefined;

    await onBatchTag(cleanTag, ids);
    setTag("");
  }, [canTag, onBatchTag, tag, selectedIds]);

  return (
    <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between bg-gray-800/40 border border-gray-700/50 rounded-2xl p-4">
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={onRefresh}
          className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
        >
          Refresh
        </button>

        <button
          type="button"
          onClick={() => void onGenerateAll()}
          disabled={isGenerating}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
        >
          {isGenerating ? "Generating…" : "Generate All"}
        </button>

        <div className="text-sm text-gray-300 ml-1">
          Selected: <span className="font-semibold">{selectedCount}</span>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Tag selected PDFs…"
          className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />

        <button
          type="button"
          onClick={() => void handleTag()}
          disabled={!canTag}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
        >
          Apply Tag
        </button>
      </div>
    </div>
  );
};

export default React.memo(PDFQuickActions);