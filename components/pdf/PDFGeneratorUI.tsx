'use client';

import React, { useState } from 'react';
import { generatePDFsAction, getAssetStatus } from '@/lib/pdf/generate-server';
import { PDFGenerationConfig } from '@/lib/pdf/generate';

/**
 * SOVEREIGN PDF GENERATOR UI
 * Provides a clean interface for orchestrating the 75-brief portfolio generation.
 */
export default function PDFGeneratorUI() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (quality: 'standard' | 'premium' | 'enterprise') => {
    setIsGenerating(true);
    setError(null);
    
    const config: PDFGenerationConfig = {
      quality,
      logLevel: 'debug',
      retries: 2
    };

    try {
      const response = await generatePDFsAction(config);
      
      if (response.success) {
        setResults(response);
      } else {
        setError(response.error || 'Generation completed with failures.');
        setResults(response);
      }
    } catch (err: any) {
      setError(err.message || 'A critical connection error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Intelligence Portfolio Engine</h2>
        <p className="text-gray-500">Orchestrate the generation and optimization of Legacy Architecture Canvases.</p>
      </div>

      {/* ACTION CONTROLS */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => handleGenerate('premium')}
          disabled={isGenerating}
          className={`px-6 py-2 bg-slate-900 text-white rounded-md font-medium transition-all ${
            isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'
          }`}
        >
          {isGenerating ? 'Generating Portfolio...' : 'Generate Premium Assets'}
        </button>
        
        <button
          onClick={() => handleGenerate('enterprise')}
          disabled={isGenerating}
          className="px-6 py-2 border border-amber-500 text-amber-700 rounded-md font-medium hover:bg-amber-50"
        >
          Generate Enterprise (HQ)
        </button>
      </div>

      {/* FEEDBACK SYSTEM */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="font-bold">Execution Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total" value={results.summary.total} />
            <StatCard label="Success" value={results.summary.successful} color="text-green-600" />
            <StatCard label="Duration" value={`${(results.summary.totalDuration / 1000).toFixed(2)}s`} />
          </div>

          <div className="border border-gray-100 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Asset Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {results.details.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 font-mono text-xs">{item.name}</td>
                    <td className="px-4 py-2">
                      {item.success ? (
                        <span className="text-green-600 font-medium">✓ Ready</span>
                      ) : (
                        <span className="text-red-500 font-medium">✗ Failed</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-400">{item.duration}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-md flex items-center justify-between">
            <span className="text-sm font-medium">Assets are saved to /public/assets/downloads</span>
            <a 
              href="/assets/downloads/legacy-architecture-canvas-a4-premium.pdf" 
              download 
              className="text-xs underline font-bold"
            >
              DOWNLOAD LATEST (A4)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'text-gray-900' }: { label: string; value: any; color?: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
      <p className="text-xs text-gray-500 uppercase font-bold">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}