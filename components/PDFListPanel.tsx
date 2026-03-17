/* components/PDFListPanel.tsx — UPDATED FOR PDFTYPE */

import React from 'react';
import type { PDFType } from "@/types/pdf-dashboard"; // ✅ Sync types across files

interface PDF {
  id: string;
  title: string;
  description: string;
  category: string;
  type: PDFType | string; // ✅ Flexible to handle both for UI safety
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
      <div className="text-center py-12 border border-dashed border-white/5 rounded-xl">
        <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-mono">Registry Empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      {pdfs.map((pdf) => (
        <div
          key={pdf.id}
          onClick={() => onSelectPDF(pdf.id)}
          className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
            selectedPDFId === pdf.id
              ? 'border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-900/10'
              : 'border-white/5 bg-zinc-900/20 hover:bg-white/[0.04]'
          } ${!pdf.exists ? 'opacity-60' : ''}`}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-xs font-bold truncate ${
                  selectedPDFId === pdf.id ? 'text-amber-200' : 'text-zinc-300'
                }`}>
                  {pdf.title}
                </h3>
                {!pdf.exists && (
                  <span className="text-[7px] px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-sm font-black uppercase tracking-tighter">
                    Missing
                  </span>
                )}
              </div>
              
              <p className="text-[10px] text-zinc-500 line-clamp-1 italic mb-2">
                {pdf.description}
              </p>

              <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500">
                <span className="uppercase">{pdf.category}</span>
                <span>/</span>
                <span className="text-zinc-600">{(pdf.fileSize ? (pdf.fileSize / 1024 / 1024).toFixed(1) : '0.0')} MB</span>
              </div>
            </div>

            <div className="shrink-0">
              {pdf.exists ? (
                <div className="text-emerald-500/80 text-[10px] font-mono">VALID</div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onGeneratePDF(pdf.id); }}
                  disabled={isGenerating}
                  className="px-3 py-1 bg-amber-600 text-black text-[9px] font-black uppercase rounded hover:bg-amber-500 disabled:opacity-30 transition-colors"
                >
                  {isGenerating ? '...' : 'Generate'}
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