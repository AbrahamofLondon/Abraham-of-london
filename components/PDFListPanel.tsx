import React from 'react';

interface PDF {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  exists: boolean;
  fileSize?: number;
}

interface PDFListPanelProps {
  pdfs: PDF[];
  selectedPDFId: string | null;
  isGenerating: boolean;
  onSelectPDF: (id: string) => void;
  onGeneratePDF: (id: string) => void;
}

const PDFListPanel: React.FC<PDFListPanelProps> = ({
  pdfs,
  selectedPDFId,
  isGenerating,
  onSelectPDF,
  onGeneratePDF,
}) => {
  if (pdfs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-3xl mb-2">📭</div>
        <p className="text-sm">No PDFs found</p>
        <p className="text-xs mt-1">Try a different search or category</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {pdfs.map((pdf) => (
        <div
          key={pdf.id}
          className={`w-full text-left p-3 md:p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
            selectedPDFId === pdf.id
              ? 'border-amber-500/50 bg-amber-500/10'
              : 'border-white/5 bg-transparent hover:bg-white/[0.03]'
          } ${!pdf.exists ? 'opacity-60' : ''}`}
          onClick={() => onSelectPDF(pdf.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-bold text-sm truncate ${
                  selectedPDFId === pdf.id ? 'text-amber-200' : 'text-gray-300'
                }`}>
                  {pdf.title}
                </h3>
                {!pdf.exists && (
                  <span className="text-[8px] px-1 py-0.5 bg-rose-500/20 text-rose-300 rounded uppercase font-bold">
                    Missing
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 line-clamp-2 mb-2">
                {pdf.description}
              </p>
              <div className="flex items-center gap-3 text-[9px]">
                <span className="px-2 py-0.5 bg-gray-900/50 rounded-full text-gray-400">
                  {pdf.category}
                </span>
                <span className="px-2 py-0.5 bg-gray-900/50 rounded-full text-gray-400">
                  {pdf.type}
                </span>
                {pdf.fileSize && (
                  <span className="text-gray-600">
                    {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </div>
            </div>
            <div className="ml-3">
              {pdf.exists ? (
                <div className="text-[8px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  ✓
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGeneratePDF(pdf.id);
                  }}
                  disabled={isGenerating}
                  className="text-[8px] font-bold uppercase bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2 py-1 rounded transition-all disabled:opacity-50"
                >
                  Generate
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PDFListPanel;