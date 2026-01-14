// components/PDFDashboard/PDFComparisonView.tsx
import React, { useState, useMemo } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  SplitSquareHorizontal, 
  SplitSquareVertical,
  Grid,
  List,
  Download,
  BarChart3,
  FileText,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface PDFComparisonViewProps {
  pdfIds: string[];
  onClose: () => void;
  pdfTitles?: Record<string, string>;
}

const PDFComparisonView: React.FC<PDFComparisonViewProps> = ({
  pdfIds,
  onClose,
  pdfTitles = {},
}) => {
  const [layout, setLayout] = useState<'horizontal' | 'vertical' | 'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['size', 'pages', 'status']);
  const [fullscreen, setFullscreen] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<'overview' | 'detailed' | 'side-by-side'>('overview');

  // Mock comparison data - in real app, fetch PDF metadata
  const comparisonData = useMemo(() => {
    return pdfIds.map((pdfId, index) => ({
      id: pdfId,
      title: pdfTitles[pdfId] || `PDF ${index + 1}`,
      size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
      pages: Math.floor(Math.random() * 50) + 10,
      status: ['generated', 'pending', 'error'][index % 3] as 'generated' | 'pending' | 'error',
      lastModified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: ['reports', 'manuals', 'financial', 'marketing'][index % 4],
      score: Math.floor(Math.random() * 100),
      metadata: {
        author: `Author ${index + 1}`,
        version: `v${(index % 3) + 1}.0`,
        tags: ['important', 'review', 'archive'].slice(0, (index % 3) + 1),
      }
    }));
  }, [pdfIds, pdfTitles]);

  const metrics = [
    { id: 'size', label: 'File Size', format: (value: string) => value },
    { id: 'pages', label: 'Page Count', format: (value: number) => `${value} pages` },
    { id: 'status', label: 'Status', format: (value: string) => value },
    { id: 'category', label: 'Category', format: (value: string) => value },
    { id: 'score', label: 'Quality Score', format: (value: number) => `${value}/100` },
    { id: 'lastModified', label: 'Last Modified', format: (value: string) => new Date(value).toLocaleDateString() },
  ];

  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'grid grid-cols-1 divide-y divide-gray-700';
      case 'vertical':
        return 'grid grid-cols-2 md:grid-cols-3 gap-4';
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
      case 'list':
        return 'space-y-4';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    }
  };

  const exportComparison = () => {
    const csvContent = [
      ['PDF ID', 'Title', 'Size', 'Pages', 'Status', 'Category', 'Score', 'Last Modified'],
      ...comparisonData.map(pdf => [
        pdf.id,
        pdf.title,
        pdf.size,
        pdf.pages.toString(),
        pdf.status,
        pdf.category,
        pdf.score.toString(),
        new Date(pdf.lastModified).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdf-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`mt-6 border border-gray-700/50 rounded-xl bg-gray-800/30 overflow-hidden transition-all ${
      fullscreen ? 'fixed inset-0 z-50 m-4 rounded-lg' : ''
    }`}>
      {/* Header */}
      <div className="border-b border-gray-700/50 p-4 bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              PDF Comparison
              <span className="text-sm px-2 py-1 bg-gray-700 rounded-full text-gray-300">
                {pdfIds.length} PDFs
              </span>
            </h3>
            
            <select
              value={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.value as any)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-sm"
            >
              <option value="overview">Overview</option>
              <option value="detailed">Detailed</option>
              <option value="side-by-side">Side-by-Side</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Layout Controls */}
            <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setLayout('horizontal')}
                className={`p-2 ${layout === 'horizontal' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                title="Horizontal Split"
              >
                <SplitSquareHorizontal className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLayout('vertical')}
                className={`p-2 ${layout === 'vertical' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                title="Vertical Split"
              >
                <SplitSquareVertical className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLayout('grid')}
                className={`p-2 ${layout === 'grid' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLayout('list')}
                className={`p-2 ${layout === 'list' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            
            <button
              onClick={exportComparison}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-sm flex items-center gap-2"
              title="Export Comparison"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              title={fullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
              title="Close Comparison"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Metrics Selector */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-400">Compare by:</span>
          {metrics.map(metric => (
            <button
              key={metric.id}
              onClick={() => {
                if (selectedMetrics.includes(metric.id)) {
                  setSelectedMetrics(selectedMetrics.filter(m => m !== metric.id));
                } else {
                  setSelectedMetrics([...selectedMetrics, metric.id]);
                }
              }}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedMetrics.includes(metric.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Content */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {comparisonMode === 'overview' ? (
          <div className={getLayoutClasses()}>
            {comparisonData.map((pdf, index) => (
              <div
                key={pdf.id}
                className={`p-4 border border-gray-700/50 rounded-lg bg-gray-900/30 hover:bg-gray-800/50 transition-colors ${
                  layout === 'horizontal' && index > 0 ? 'border-t' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-800 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-300">{pdf.title}</h4>
                      <p className="text-xs text-gray-500">{pdf.id}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    pdf.status === 'generated' ? 'bg-green-500/20 text-green-400' :
                    pdf.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {pdf.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {metrics
                    .filter(m => selectedMetrics.includes(m.id))
                    .map(metric => (
                      <div key={metric.id} className="text-sm">
                        <div className="text-gray-400">{metric.label}</div>
                        <div className="font-medium text-gray-300">
                          {metric.format(pdf[metric.id as keyof typeof pdf] as any)}
                        </div>
                      </div>
                    ))}
                </div>

                {pdf.metadata && (
                  <div className="mt-4 pt-4 border-t border-gray-700/30">
                    <div className="flex flex-wrap gap-1">
                      {pdf.metadata.tags?.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : comparisonMode === 'detailed' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">PDF</th>
                  {metrics
                    .filter(m => selectedMetrics.includes(m.id))
                    .map(metric => (
                      <th key={metric.id} className="text-left py-3 px-4 text-gray-400 font-medium">
                        {metric.label}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((pdf) => (
                  <tr key={pdf.id} className="border-b border-gray-700/30 hover:bg-gray-800/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-400" />
                        <div>
                          <div className="font-medium text-gray-300">{pdf.title}</div>
                          <div className="text-xs text-gray-500">{pdf.id}</div>
                        </div>
                      </div>
                    </td>
                    {metrics
                      .filter(m => selectedMetrics.includes(m.id))
                      .map(metric => (
                        <td key={metric.id} className="py-3 px-4 text-gray-300">
                          {metric.format(pdf[metric.id as keyof typeof pdf] as any)}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {comparisonData.map((pdf) => (
              <div key={pdf.id} className="border border-gray-700/50 rounded-lg p-4 bg-gray-900/30">
                <div className="aspect-video bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
                  <FileText className="h-16 w-16 text-gray-600" />
                </div>
                <div className="space-y-3">
                  {metrics
                    .filter(m => selectedMetrics.includes(m.id))
                    .map(metric => (
                      <div key={metric.id} className="flex justify-between items-center">
                        <span className="text-gray-400">{metric.label}:</span>
                        <span className="font-medium text-gray-300">
                          {metric.format(pdf[metric.id as keyof typeof pdf] as any)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700/50 p-4 bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {comparisonData.length} PDFs • 
            Layout: {layout} • 
            Mode: {comparisonMode}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-300">Page {currentPage}</span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFComparisonView;