import React from 'react';
import { PDFDocument } from '@/types/pdf';

interface PDFActionsBarProps {
  pdf: PDFDocument;
  isGenerating: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  onGeneratePDF: () => void;
  onDeletePDF: () => void;
  onDuplicatePDF: () => void;
  onRenamePDF: () => void;
  onUpdateMetadata: () => void;
  onShare: () => void;
}

export const PDFActionsBar: React.FC<PDFActionsBarProps> = ({
  pdf,
  isGenerating,
  canEdit,
  canDelete,
  canShare,
  onGeneratePDF,
  onDeletePDF,
  onDuplicatePDF,
  onRenamePDF,
  onUpdateMetadata,
  onShare,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold truncate max-w-md">{pdf.title}</h2>
        <span className={`px-3 py-1 text-xs rounded-full ${
          pdf.status === 'generated' ? 'bg-green-500/20 text-green-400' :
          pdf.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {pdf.status}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {pdf.status !== 'generated' && (
          <button
            onClick={onGeneratePDF}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        )}

        {canEdit && (
          <>
            <button
              onClick={onDuplicatePDF}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Duplicate
            </button>
            <button
              onClick={onRenamePDF}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Rename
            </button>
          </>
        )}

        {canShare && (
          <button
            onClick={onShare}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Share
          </button>
        )}

        {canDelete && (
          <button
            onClick={onDeletePDF}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};
