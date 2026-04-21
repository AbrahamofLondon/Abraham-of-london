'use client';

import React, { useState } from 'react';
import { generatePDFsAction } from '@/lib/pdf/generate-server';
import type { PDFGenerationConfig } from '@/lib/pdf/generate';

type GenerationQuality = 'standard' | 'premium' | 'enterprise';

type PDFGenerationDetail = {
  name: string;
  success: boolean;
  duration: number;
  error?: string | null;
};

type PDFGenerationSummary = {
  total: number;
  successful: number;
  totalDuration: number;
};

type PDFGenerationActionResult = {
  success: boolean;
  error?: string | null;
  summary: PDFGenerationSummary;
  details: PDFGenerationDetail[];
};

function isActionResult(value: unknown): value is PDFGenerationActionResult {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<PDFGenerationActionResult>;

  return (
    typeof candidate.success === 'boolean' &&
    !!candidate.summary &&
    typeof candidate.summary.total === 'number' &&
    typeof candidate.summary.successful === 'number' &&
    typeof candidate.summary.totalDuration === 'number' &&
    Array.isArray(candidate.details)
  );
}

/**
 * SOVEREIGN PDF GENERATOR UI
 * Provides a clean interface for orchestrating the portfolio generation.
 */
export default function PDFGeneratorUI() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<PDFGenerationActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (quality: GenerationQuality) => {
    setIsGenerating(true);
    setError(null);
    setResults(null);

    const config: PDFGenerationConfig = {
      quality,
      logLevel: 'debug',
      retries: 2,
    };

    try {
      const response = await generatePDFsAction(config);

      if (!isActionResult(response)) {
        throw new Error('Invalid response received from PDF generation action.');
      }

      setResults(response);

      if (!response.success) {
        setError(response.error || 'Generation completed with failures.');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'A critical connection error occurred.';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Intelligence Portfolio Engine
        </h2>
        <p className="text-gray-500">
          Orchestrate the generation and optimization of Legacy Architecture
          Canvases.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => void handleGenerate('premium')}
          disabled={isGenerating}
          className={`rounded-md px-6 py-2 font-medium text-white transition-all ${
            isGenerating
              ? 'cursor-not-allowed bg-slate-900 opacity-50'
              : 'bg-slate-900 hover:bg-slate-800'
          }`}
        >
          {isGenerating ? 'Generating Portfolio...' : 'Generate Premium Assets'}
        </button>

        <button
          type="button"
          onClick={() => void handleGenerate('enterprise')}
          disabled={isGenerating}
          className={`rounded-md border px-6 py-2 font-medium transition-all ${
            isGenerating
              ? 'cursor-not-allowed border-amber-500 text-amber-700 opacity-50'
              : 'border-amber-500 text-amber-700 hover:bg-amber-50'
          }`}
        >
          Generate Enterprise (HQ)
        </button>
      </div>

      {error && (
        <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 text-red-700">
          <p className="font-bold">Execution Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {results && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-500">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard label="Total" value={results.summary.total} />
            <StatCard
              label="Success"
              value={results.summary.successful}
              color="text-green-600"
            />
            <StatCard
              label="Duration"
              value={`${(results.summary.totalDuration / 1000).toFixed(2)}s`}
            />
          </div>

          <div className="overflow-hidden rounded-md border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                    Asset Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">
                    Time
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 text-sm">
                {results.details.map((item) => (
                  <tr key={`${item.name}-${item.duration}`}>
                    <td className="px-4 py-2 font-mono text-xs">{item.name}</td>
                    <td className="px-4 py-2">
                      {item.success ? (
                        <span className="font-medium text-green-600">✓ Ready</span>
                      ) : (
                        <span className="font-medium text-red-500">
                          ✗ Failed
                          {item.error ? ` — ${item.error}` : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-400">{item.duration}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-md bg-blue-50 p-4 text-blue-800">
            <span className="text-sm font-medium">
              Assets are saved to /public/assets/downloads
            </span>
            <a
              href="/downloads/legacy-architecture-canvas"
              className="text-xs font-bold underline"
            >
              DOWNLOAD LATEST (A4)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color = 'text-gray-900',
}: {
  label: string;
  value: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center">
      <p className="text-xs font-bold uppercase text-gray-500">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}
