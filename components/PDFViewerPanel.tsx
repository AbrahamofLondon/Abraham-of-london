import React from 'react';
import IQPDF from './IQPDF';

interface PDF {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  exists: boolean;
  fileSize?: number;
  outputPath: string;
}

interface PDFViewerPanelProps {
  pdf: PDF | null;
  isGenerating: boolean;
  onGeneratePDF: (id: string) => void;
  refreshKey: number;
}

const PDFViewerPanel: React.FC<PDFViewerPanelProps> = ({
  pdf,
  isGenerating,
  onGeneratePDF,
  refreshKey,
}) => {
  if (!pdf) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-2xl border-2 border-dashed border-white/5">
        <div className="text-center opacity-20">
          <div className="text-6xl mb-4">📖</div>
          <p className="text-sm uppercase tracking-[0.4em]">Select a PDF</p>
          <p className="text-xs text-gray-500 mt-2">
            Choose a PDF from the list to preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl md:text-2xl font-serif font-bold text-white">
                {pdf.title}
              </h2>
              <span className="text-[10px] px-2 py-1 rounded-full bg-gray-800 text-gray-300 uppercase font-bold">
                {pdf.type}
              </span>
            </div>
            <p className="text-sm text-gray-400 italic">
              {pdf.description}
            </p>
          </div>
          <div className="flex gap-3">
            {!pdf.exists ? (
              <button
                onClick={() => onGeneratePDF(pdf.id)}
                disabled={isGenerating}
                className="rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
              >
                ⚡ Generate PDF
              </button>
            ) : (
              <button
                onClick={() => onGeneratePDF(pdf.id)}
                disabled={isGenerating}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-200 transition-all hover:bg-amber-500/20 disabled:opacity-50"
              >
                🔄 Regenerate
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="p-3 rounded-lg bg-gray-900/30 border border-gray-800">
            <div className="text-[10px] text-gray-400 uppercase font-bold">Category</div>
            <div className="text-sm text-white mt-1">{pdf.category}</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-900/30 border border-gray-800">
            <div className="text-[10px] text-gray-400 uppercase font-bold">Status</div>
            <div className={`text-sm mt-1 ${pdf.exists ? 'text-emerald-400' : 'text-rose-400'}`}>
              {pdf.exists ? 'Available' : 'Not Generated'}
            </div>
          </div>
          {pdf.fileSize && (
            <div className="p-3 rounded-lg bg-gray-900/30 border border-gray-800">
              <div className="text-[10px] text-gray-400 uppercase font-bold">Size</div>
              <div className="text-sm text-white mt-1">
                {(pdf.fileSize / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          )}
          <div className="p-3 rounded-lg bg-gray-900/30 border border-gray-800">
            <div className="text-[10px] text-gray-400 uppercase font-bold">ID</div>
            <div className="text-xs font-mono text-gray-400 mt-1 truncate">
              {pdf.id}
            </div>
          </div>
        </div>
      </div>
      
      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner">
        {pdf.exists ? (
          <IQPDF
            key={`${pdf.id}-${refreshKey}`}
            src={`${pdf.outputPath}?v=${refreshKey}`}
            title={pdf.title}
            height="500px"
          />
        ) : (
          <div className="flex h-[500px] flex-col items-center justify-center p-8 text-center">
            <div className="text-6xl mb-4 opacity-20">📄</div>
            <h3 className="text-lg font-bold text-gray-300 mb-2">
              PDF Not Generated Yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              This PDF hasn't been generated yet. Click the "Generate PDF" button above to create it.
            </p>
            <button
              onClick={() => onGeneratePDF(pdf.id)}
              disabled={isGenerating}
              className="rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 font-bold uppercase tracking-wider text-white transition-all hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate PDF Now'}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default PDFViewerPanel;