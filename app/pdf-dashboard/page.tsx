// app/pdf-dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { TelemetryData } from '@/lib/types/telemetry';

type DashboardState = {
  data: TelemetryData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
};

const initialState: DashboardState = {
  data: null,
  loading: true,
  error: null,
  lastUpdated: null
};

export default function PdfDashboard() {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>(initialState);
  const [isPrinting, setIsPrinting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTelemetry = useCallback(async () => {
    try {
      const response = await fetch('/api/telemetry/resonance');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: TelemetryData = await response.json();
      
      // Validate response structure
      if (typeof data.resonance !== 'number' || !Array.isArray(data.logs)) {
        throw new Error('Invalid telemetry data structure');
      }
      
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch telemetry';
      console.error('[Dashboard] Fetch error:', err);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        data: prev.data // Preserve existing data if available
      }));
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    
    intervalRef.current = setInterval(fetchTelemetry, 30000); // 30 seconds
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchTelemetry]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleExportData = () => {
    if (!state.data) return;
    
    try {
      const exportData = {
        ...state.data,
        exportedAt: new Date().toISOString(),
        version: '1.6'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      const fileName = `sovereign-telemetry-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', fileName);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      
    } catch (err) {
      console.error('[Dashboard] Export failed:', err);
      alert('Failed to export data');
    }
  };

  // Loading state
  if (state.loading && !state.data) {
    return (
      <>
        <Header minimal />
        <div className="min-h-screen bg-black flex items-center justify-center pt-24">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60 text-xs uppercase tracking-wider">Initializing telemetry stream...</p>
          </div>
        </div>
      </>
    );
  }

  // Error state with retry
  if (state.error && !state.data) {
    return (
      <>
        <Header minimal />
        <div className="min-h-screen bg-black flex items-center justify-center p-4 pt-24">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h1 className="text-white text-lg mb-2">Telemetry Unavailable</h1>
            <p className="text-white/40 text-xs mb-6">{state.error}</p>
            <button
              onClick={fetchTelemetry}
              className="px-6 py-2 border border-white/20 text-white/80 text-xs uppercase tracking-wider hover:bg-white/5 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </>
    );
  }

  const { data } = state;
  if (!data) return null;

  const isDisordered = data.resonance < 60;

  return (
    <>
      <Header minimal />
      
      <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black pt-24 print:pt-0 print:bg-white print:text-black">
        <style jsx global>{`
          @media print {
            body {
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
            .print\\:block {
              display: block !important;
            }
            .print\\:bg-white {
              background-color: white !important;
            }
            .print\\:text-black {
              color: black !important;
            }
            .print\\:border-gray-200 {
              border-color: #e5e7eb !important;
            }
            .print\\:text-gray-500 {
              color: #6b7280 !important;
            }
            .print\\:text-gray-600 {
              color: #4b5563 !important;
            }
          }
        `}</style>

        <div className="max-w-7xl mx-auto px-6 pb-12">
          {/* Header Controls */}
          <div className="flex justify-between items-center mb-8 no-print">
            <div>
              <h1 className="text-2xl font-light tracking-tight">Sovereign Telemetry</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">
                Protocol OGR-IV • Node Canary Wharf
              </p>
              {state.lastUpdated && (
                <p className="text-[8px] text-white/30 mt-2">
                  Last updated: {state.lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="p-2 border border-white/10 hover:bg-white/5 transition-all disabled:opacity-50"
                title="Print report"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
              
              <button
                onClick={handleExportData}
                className="p-2 border border-white/10 hover:bg-white/5 transition-all"
                title="Export JSON data"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              
              <button
                onClick={fetchTelemetry}
                className="p-2 border border-white/10 hover:bg-white/5 transition-all"
                title="Refresh data"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Alert Banner */}
          {isDisordered && (
            <div className="mb-8 p-4 bg-red-500/10 border-l-4 border-red-500 print:border-red-500 print:bg-red-50">
              <p className="text-xs text-red-400 print:text-red-700">
                ⚠️ SYSTEM ALERT: Resonance below critical threshold ({data.resonance}%). 
                Immediate intervention required.
              </p>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Key Metrics */}
            <div className="lg:col-span-1 space-y-6">
              {/* Resonance Card */}
              <div className="border border-white/10 p-6 print:border-gray-200">
                <div className="text-6xl font-light mb-2 print:text-black">
                  {data.resonance}%
                </div>
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-3 print:text-gray-500">
                  Systemic Resonance
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isDisordered ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${data.resonance}%` }}
                  />
                </div>
                <div className="mt-3 text-[8px] text-white/30 print:text-gray-400">
                  {data.resonance >= 80 ? 'Optimal' : data.resonance >= 60 ? 'Stable' : 'Critical'} state
                </div>
              </div>

              {/* Quick Stats */}
              <div className="border border-white/10 p-6 print:border-gray-200 space-y-3">
                <h3 className="text-[9px] uppercase tracking-wider text-white/40 print:text-gray-500">
                  System Statistics
                </h3>
                <div className="space-y-2">
                  <StatRow label="Active Nodes" value={data.activeNodes.toString()} />
                  <StatRow label="Friction Index" value={`${data.metrics.friction}%`} />
                  <StatRow label="Burnout Index" value={`${data.metrics.burnoutIndex}%`} />
                  <StatRow label="System Load" value={`${data.metrics.load}%`} />
                  <StatRow label="Dissonance" value={data.metrics.dissonance.toFixed(3)} />
                </div>
              </div>
            </div>

            {/* Right Column - Metrics Grid */}
            <div className="lg:col-span-2 space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <MetricCard 
                  label="Replacement Liability" 
                  value={`$${(data.metrics.replacementLiability / 1000).toFixed(0)}K`}
                  description="Estimated cost of open issues"
                />
                <MetricCard 
                  label="Average Utilization" 
                  value={`${data.metrics.avgUtilization}%`}
                  description="Resource efficiency"
                />
              </div>

              {/* Telemetry Logs */}
              <div className="border border-white/10 rounded p-6 print:border-gray-200">
                <h3 className="text-[10px] uppercase tracking-wider text-white/40 mb-4 print:text-gray-500">
                  Telemetry Log
                </h3>
                <div className="space-y-1.5 font-mono text-[8px] text-white/60 leading-relaxed print:text-gray-600 max-h-96 overflow-y-auto">
                  {data.logs.slice(0, 20).map((log, idx) => (
                    <p key={idx} className="break-all border-b border-white/5 pb-1 print:border-gray-100">
                      {log}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print Footer */}
        <footer className="hidden print:block text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200">
          <p>Sovereign Alignment Registry v1.6 | Generated: {new Date().toLocaleString()}</p>
          <p className="text-[8px] mt-1">Protocol OGR-IV | Node: Canary Wharf | Classification: Restricted</p>
        </footer>
      </div>
    </>
  );
}

// Helper Components
function MetricCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="border border-white/10 p-4 print:border-gray-200">
      <div className="text-2xl font-light mb-1 print:text-black">{value}</div>
      <div className="text-[9px] font-mono uppercase tracking-wider text-white/40 print:text-gray-500">
        {label}
      </div>
      <div className="text-[7px] text-white/20 mt-1 print:text-gray-400">
        {description}
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-white/40 print:text-gray-500">{label}</span>
      <span className="text-white font-mono print:text-black">{value}</span>
    </div>
  );
}