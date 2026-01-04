// components/PDFDashboard/Sidebar.tsx
import React from 'react';
import { PDFItem } from '@/lib/pdf/types';
import { Stats } from '@/hooks/usePDFDashboard';
import { FileText, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface SidebarProps {
  pdfs: PDFItem[];
  selectedPDFId: string | null;
  stats: Stats;
  isGenerating: boolean;
  onSelectPDF: (id: string) => void;
  onGeneratePDF: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pdfs,
  selectedPDFId,
  stats,
  isGenerating,
  onSelectPDF,
  onGeneratePDF,
}) => {
  const getStatusIcon = (pdf: PDFItem) => {
    if (pdf.isGenerating) {
      return <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />;
    }
    if (pdf.exists) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (pdf.error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getStatusText = (pdf: PDFItem) => {
    if (pdf.isGenerating) return 'Generating...';
    if (pdf.exists) return 'Ready';
    if (pdf.error) return 'Error';
    return 'Missing';
  };

  return (
    <div className="lg:col-span-4 space-y-6">
      {/* Stats Overview */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">PDF Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-3">
            <p className="text-sm text-gray-400">Total PDFs</p>
            <p className="text-2xl font-bold mt-1">{stats.totalPDFs}</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3">
            <p className="text-sm text-gray-400">Generated</p>
            <p className="text-2xl font-bold mt-1 text-green-400">{stats.generated}</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3">
            <p className="text-sm text-gray-400">Missing</p>
            <p className="text-2xl font-bold mt-1 text-amber-400">{stats.missing}</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3">
            <p className="text-sm text-gray-400">Errors</p>
            <p className="text-2xl font-bold mt-1 text-red-400">{stats.errors}</p>
          </div>
        </div>
      </div>

      {/* PDF List */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">PDF List</h3>
          <div className="text-sm text-gray-400">
            {pdfs.length} items
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {pdfs.map((pdf) => (
            <button
              key={pdf.id}
              onClick={() => onSelectPDF(pdf.id)}
              className={`w-full text-left p-4 rounded-lg transition-all ${
                selectedPDFId === pdf.id
                  ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800'
                  : 'bg-gray-800/20 hover:bg-gray-800/40 border border-gray-800/50'
              }`}
              disabled={pdf.isGenerating || isGenerating}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-medium text-sm">{pdf.title}</p>
                    <p className="text-xs text-gray-400">{pdf.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(pdf)}
                  <span className={`text-xs font-medium ${
                    pdf.exists ? 'text-green-400' :
                    pdf.error ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {getStatusText(pdf)}
                  </span>
                </div>
              </div>

              {!pdf.exists && !pdf.isGenerating && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGeneratePDF(pdf.id);
                  }}
                  className="mt-3 w-full py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 transition-all"
                  disabled={isGenerating}
                >
                  Generate PDF
                </button>
              )}
            </button>
          ))}
        </div>

        {pdfs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No PDFs found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};