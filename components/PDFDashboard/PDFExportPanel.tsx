// components/PDFDashboard/PDFExportPanel.tsx
import React, { useState } from 'react';
import { PDFItem } from '@/lib/pdf/types';
import { Download, FileText, File, Printer, Share2, Copy } from 'lucide-react';

interface PDFExportPanelProps {
  pdf: PDFItem;
  onExport: (format: string) => void;
}

export const PDFExportPanel: React.FC<PDFExportPanelProps> = ({
  pdf,
  onExport,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportFormats = [
    { id: 'pdf', label: 'PDF', icon: FileText },
    { id: 'html', label: 'HTML', icon: File },
    { id: 'text', label: 'Text', icon: FileText },
    { id: 'print', label: 'Print', icon: Printer },
  ];

  const handleCopyLink = () => {
    if (!pdf.fileUrl) return;
    
    navigator.clipboard.writeText(pdf.fileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!pdf.exists) return null;

  return (
    <div className="mt-6 pt-6 border-t border-gray-700/50">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-300">Export & Share</h4>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          {isOpen ? 'Hide Options' : 'Show Options'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {exportFormats.map((format) => (
            <button
              key={format.id}
              onClick={() => onExport(format.id)}
              className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg flex flex-col items-center gap-2 transition-colors"
            >
              <format.icon className="h-5 w-5 text-blue-400" />
              <span className="text-xs font-medium">{format.label}</span>
            </button>
          ))}
          
          <button
            onClick={handleCopyLink}
            className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-colors ${
              copied 
                ? 'bg-green-900/20 text-green-400' 
                : 'bg-gray-800/50 hover:bg-gray-800'
            }`}
          >
            <Copy className="h-5 w-5" />
            <span className="text-xs font-medium">
              {copied ? 'Copied!' : 'Copy Link'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};