// components/PDFDashboard/index.tsx
import React from 'react';
import { Header } from './Header';
import { StatusMessage } from './StatusMessage';
import { Sidebar } from './Sidebar';
import { PDFViewer } from './PDFViewer';
import { usePDFDashboard } from '@/hooks/usePDFDashboard';

const PDFDashboard: React.FC = () => {
  const {
    selectedPDF,
    isGenerating,
    generationStatus,
    filterState,
    filteredPDFs,
    categories,
    stats,
    setSelectedPDFId,
    generatePDF,
    generateAllPDFs,
    refreshPDFList,
    updateFilter,
    setGenerationStatus,
  } = usePDFDashboard();

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header
          stats={stats}
          filterState={filterState}
          categories={categories}
          isGenerating={isGenerating}
          onRefresh={refreshPDFList}
          onGenerateAll={generateAllPDFs}
          onFilterChange={updateFilter}
        />

        {generationStatus && (
          <StatusMessage
            message={generationStatus.message}
            type={generationStatus.type}
            onDismiss={() => setGenerationStatus(null)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          <Sidebar
            pdfs={filteredPDFs}
            selectedPDFId={selectedPDF?.id || null}
            stats={stats}
            isGenerating={isGenerating}
            onSelectPDF={setSelectedPDFId}
            onGeneratePDF={generatePDF}
          />

          <PDFViewer
            pdf={selectedPDF}
            isGenerating={isGenerating}
            onGeneratePDF={generatePDF}
            refreshKey={stats.totalPDFs}
          />
        </div>
      </div>
    </div>
  );
};

export default PDFDashboard;