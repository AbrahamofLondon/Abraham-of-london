// components/PDFActionsBar.tsx
import * as React from "react";

export interface PDFActionsBarProps {
  pdf: any;
  isGenerating: boolean;
  onGeneratePDF: () => void;
  onDeletePDF: () => void;
  onDuplicatePDF: () => void;
  onRenamePDF: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const PDFActionsBar: React.FC<PDFActionsBarProps> = ({
  pdf,
  isGenerating,
  onGeneratePDF,
  onDeletePDF,
  onDuplicatePDF,
  onRenamePDF,
  canEdit,
  canDelete,
}) => {
  if (!pdf) return null;

  const statusClass =
    pdf.status === "generated"
      ? "bg-green-500/20 text-green-400"
      : pdf.status === "pending"
        ? "bg-yellow-500/20 text-yellow-400"
        : "bg-red-500/20 text-red-400";

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-700/50 bg-gray-800/30 p-4">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold">{pdf.title}</h2>

          <div className="mt-1 flex items-center gap-3">
            <span className="text-sm text-gray-400">{pdf.category}</span>

            <span className={`rounded-full px-2 py-1 text-xs ${statusClass}`}>
              {pdf.status}
            </span>

            {pdf.fileSize ? (
              <span className="text-xs text-gray-500">
                {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {pdf.status !== "generated" ? (
          <button
            onClick={onGeneratePDF}
            disabled={isGenerating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate"}
          </button>
        ) : null}

        {canEdit ? (
          <>
            <button
              onClick={onDuplicatePDF}
              className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
            >
              Duplicate
            </button>

            <button
              onClick={onRenamePDF}
              className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
            >
              Rename
            </button>
          </>
        ) : null}

        {canDelete ? (
          <button
            onClick={onDeletePDF}
            className="rounded-lg bg-red-600/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-600/30"
          >
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default PDFActionsBar;
