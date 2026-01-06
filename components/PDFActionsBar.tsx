import React from 'react';

interface PDFActionsBarProps {
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

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{pdf.title}</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-400">{pdf.category}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              pdf.status === 'generated' ? 'bg-green-500/20 text-green-400' :
              pdf.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {pdf.status}
            </span>
            {pdf.fileSize && (
              <span className="text-xs text-gray-500">
                {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {pdf.status !== 'generated' && (
          <button
            onClick={onGeneratePDF}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        )}

        {canEdit && (
          <>
            <button
              onClick={onDuplicatePDF}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium text-sm"
            >
              Duplicate
            </button>
            <button
              onClick={onRenamePDF}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium text-sm"
            >
              Rename
            </button>
          </>
        )}

        {canDelete && (
          <button
            onClick={onDeletePDF}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium text-sm"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};