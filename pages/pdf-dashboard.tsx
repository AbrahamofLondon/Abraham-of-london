// pages/pdf-dashboard.tsx
import React, { useState, useEffect } from 'react';
import { getAllPDFs, PDFConfig, getPDFById } from '../scripts';
import IQPDF from '@/components/IQPDF';

const PDFDashboard: React.FC = () => {
  const [pdfs, setPdfs] = useState<PDFConfig[]>([]);
  const [selectedPDFId, setSelectedPDFId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Load PDFs on mount and when refresh counter changes
  useEffect(() => {
    const allPDFs = getAllPDFs();
    setPdfs(allPDFs);
    
    // Auto-select first PDF if none selected
    if (allPDFs.length > 0 && !selectedPDFId) {
      setSelectedPDFId(allPDFs[0].id);
    }
  }, [refreshCounter]);
  
  const selectedPDF = selectedPDFId ? getPDFById(selectedPDFId) : null;
  
  // Get unique categories
  const categories = ['all', ...new Set(pdfs.map(pdf => pdf.category))];
  
  // Filter PDFs based on search and category
  const filteredPDFs = pdfs.filter(pdf => {
    const matchesSearch = searchQuery === '' || 
      pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pdf.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pdf.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || pdf.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  const handleGeneratePDF = async (id: string) => {
    setGenerating(true);
    setGenerationStatus(`Generating ${id}...`);
    
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setGenerationStatus(`✅ ${data.filename} generated successfully`);
        // Force refresh of PDF list
        setRefreshCounter(prev => prev + 1);
      } else {
        setGenerationStatus(`❌ Failed to generate: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setGenerationStatus(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };
  
  const handleGenerateAll = async () => {
    setGenerating(true);
    setGenerationStatus('Generating all known PDFs...');
    
    try {
      const response = await fetch('/api/generate-all-pdfs', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setGenerationStatus(`✅ Generated ${data.count} PDFs successfully`);
        setRefreshCounter(prev => prev + 1);
      } else {
        setGenerationStatus(`❌ Bulk generation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setGenerationStatus(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };
  
  const handleRefreshList = () => {
    setRefreshCounter(prev => prev + 1);
    setGenerationStatus('📂 PDF list refreshed');
    setTimeout(() => setGenerationStatus(null), 3000);
  };
  
  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12 border-b border-white/10 pb-6 md:pb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">
                Institutional Publishing • Dynamic Registry
              </p>
              <h1 className="text-2xl md:text-4xl font-serif font-bold italic">
                PDF <span className="text-white/40">Intelligence Dashboard</span>
              </h1>
              <p className="text-xs text-gray-500 mt-2 italic">
                {pdfs.length} PDFs available • {pdfs.filter(p => p.exists).length} on filesystem
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRefreshList}
                className="rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-300 transition-all hover:bg-gray-800"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleGenerateAll}
                disabled={generating}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-200 transition-all hover:bg-amber-500/20 disabled:opacity-50"
              >
                {generating ? '⚡ Generating...' : '🚀 Generate All'}
              </button>
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search PDFs by title, description, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white focus:border-amber-500/50 focus:outline-none"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? '📁 All Categories' : `🏷️ ${category}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>
        
        {/* Status Message */}
        {generationStatus && (
          <div className={`mb-6 rounded-xl p-4 text-sm font-medium border ${
            generationStatus.includes('✅') 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : generationStatus.includes('❌')
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            {generationStatus}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          {/* Sidebar - PDF List */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 md:p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                  Document Registry ({filteredPDFs.length})
                </h2>
                <span className="text-xs text-gray-500 font-mono">
                  {pdfs.filter(p => p.exists).length}/{pdfs.length} files
                </span>
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {filteredPDFs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-3xl mb-2">📭</div>
                    <p className="text-sm">No PDFs found</p>
                    <p className="text-xs mt-1">Try a different search or category</p>
                  </div>
                ) : (
                  filteredPDFs.map((pdf) => (
                    <div
                      key={pdf.id}
                      className={`w-full text-left p-3 md:p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                        selectedPDFId === pdf.id
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-white/5 bg-transparent hover:bg-white/[0.03]'
                      } ${!pdf.exists ? 'opacity-60' : ''}`}
                      onClick={() => setSelectedPDFId(pdf.id)}
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
                                handleGeneratePDF(pdf.id);
                              }}
                              disabled={generating}
                              className="text-[8px] font-bold uppercase bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2 py-1 rounded transition-all disabled:opacity-50"
                            >
                              Generate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-gray-900/30 border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Total PDFs</div>
                    <div className="text-lg font-bold text-white">{pdfs.length}</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-900/30 border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">On Disk</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {pdfs.filter(p => p.exists).length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content - PDF Viewer */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 md:p-8 shadow-2xl min-h-[600px] md:min-h-[800px]">
              {selectedPDF ? (
                <>
                  <div className="mb-6 md:mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-xl md:text-2xl font-serif font-bold text-white">
                            {selectedPDF.title}
                          </h2>
                          <span className="text-[10px] px-2 py-1 rounded-full bg-gray-800 text-gray-300 uppercase font-bold">
                            {selectedPDF.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 italic">
                          {selectedPDF.description}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        {!selectedPDF.exists ? (
                          <button
                            onClick={() => handleGeneratePDF(selectedPDF.id)}
                            disabled={generating}
                            className="rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
                          >
                            ⚡ Generate PDF
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGeneratePDF(selectedPDF.id)}
                            disabled={generating}
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
                        <div className="text-sm text-white mt-1">{selectedPDF.category}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-900/30 border border-gray-800">
                        <div className="text-[10px] text-gray-400 uppercase font-bold">Status</div>
                        <div className={`text-sm mt-1 ${selectedPDF.exists ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {selectedPDF.exists ? 'Available' : 'Not Generated'}
                        </div>
                      </div>
                      {selectedPDF.fileSize && (
                        <div className="p-3 rounded-lg bg-gray-900/30 border border-gray-800">
                          <div className="text-[10px] text-gray-400 uppercase font-bold">Size</div>
                          <div className="text-sm text-white mt-1">
                            {(selectedPDF.fileSize / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      )}
                      <div className="p-3 rounded-lg bg-gray-900/30 border border-gray-800">
                        <div className="text-[10px] text-gray-400 uppercase font-bold">ID</div>
                        <div className="text-xs font-mono text-gray-400 mt-1 truncate">
                          {selectedPDF.id}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner">
                    {selectedPDF.exists ? (
                      <IQPDF
                        key={`${selectedPDF.id}-${refreshCounter}`}
                        src={`${selectedPDF.outputPath}?v=${refreshCounter}`}
                        title={selectedPDF.title}
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
                          onClick={() => handleGeneratePDF(selectedPDF.id)}
                          disabled={generating}
                          className="rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 font-bold uppercase tracking-wider text-white transition-all hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
                        >
                          {generating ? 'Generating...' : 'Generate PDF Now'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-[500px] items-center justify-center rounded-2xl border-2 border-dashed border-white/5">
                  <div className="text-center opacity-20">
                    <div className="text-6xl mb-4">📖</div>
                    <p className="text-sm uppercase tracking-[0.4em]">Select a PDF</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Choose a PDF from the list to preview
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFDashboard;