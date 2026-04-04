'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Activity, 
  BarChart3, 
  Download, 
  Eye, 
  Printer, 
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
  Shield
} from 'lucide-react';

/**
 * SOVEREIGN LIVE TERMINAL: PDF ANALYTICS ENGINE
 * Protocol: OGR-IV / Node: Canary Wharf
 * Enhanced with print/PDF export capabilities
 */

interface TelemetryData {
  resonance: number;
  activeNodes: number;
  logs: string[];
  metrics: {
    load: number;
    friction: number;
    dissonance: number;
    burnoutIndex: number;
    replacementLiability: number;
    avgUtilization: number;
  };
}

const PdfAnalyticsDashboard = () => {
  const router = useRouter();
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    resonance: 0,
    activeNodes: 0,
    logs: ["[SYSTEM] INITIALIZING OGR CORE..."],
    metrics: {
      load: 12,
      friction: 42,
      dissonance: 0.18,
      burnoutIndex: 0,
      replacementLiability: 0,
      avgUtilization: 12
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<number | null>(75);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch('/api/telemetry/resonance');
        const data = await response.json();
        
        setTelemetry({
          resonance: data.resonance ?? 82.0,
          activeNodes: data.activeNodes ?? 47,
          logs: data.logs || ["[SYSTEM] OGR CORE ONLINE", "[INFO] TELEMETRY STREAM ACTIVE"],
          metrics: {
            load: data.load ?? 12,
            friction: data.friction ?? 42,
            dissonance: data.dissonance ?? 0.18,
            burnoutIndex: data.burnoutIndex ?? 0,
            replacementLiability: data.replacementLiability ?? 0,
            avgUtilization: data.avgUtilization ?? 12
          }
        });
        setIsLoading(false);
      } catch (error) {
        setTelemetry(prev => ({
          ...prev,
          logs: ["[ERROR] CONNECTION TO NEON DB SEVERED", ...prev.logs]
        }));
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      window.print(); // In production, use a proper PDF library
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(telemetry, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `sovereign-telemetry-${new Date().toISOString()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const briefs = [
    { id: 75, title: "Institutional Drift: Canary Wharf Node", type: "Structural", friction: 75, active: true },
    { id: 74, title: "Leadership Alignment Index", type: "Strategic", friction: 68, active: false },
    { id: 72, title: "Operational Dissonance Report", type: "Operational", friction: 72, active: false },
    { id: 68, title: "Human Capital Resilience", type: "Human Capital", friction: 45, active: false },
    { id: 65, title: "Cultural Cohesion Metrics", type: "Cultural", friction: 38, active: false },
    { id: 61, title: "Strategic Intent Gap", type: "Strategic", friction: 82, active: false },
    { id: 59, title: "Digital Transformation", type: "Digital", friction: 55, active: false }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black overflow-hidden print:bg-white print:text-black">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:text-black {
            color: black !important;
          }
          .print\\:border-black {
            border-color: black !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="p-6 flex justify-between items-start border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50 print:border-gray-200 print:bg-white print:text-black">
        <div>
          <h1 className="text-lg tracking-[0.3em] uppercase font-light">Sovereign Live Terminal</h1>
          <p className="text-[10px] text-white/30 tracking-widest uppercase mt-1 print:text-gray-500">
            Protocol: OGR-IV / Node: Canary Wharf
          </p>
        </div>
        <div className="flex gap-4 print:hidden">
          <div className="flex bg-white/5 border border-white/10 p-1">
            <button className="px-4 py-1 text-[10px] uppercase bg-white text-black font-bold">Resonance</button>
            <button className="px-4 py-1 text-[10px] uppercase text-white/40 hover:text-white transition-all">
              Human Capital
            </button>
          </div>
          
          {/* Export Controls */}
          <div className="flex gap-2">
            <button 
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="p-2 border border-white/10 hover:bg-white/5 transition-all disabled:opacity-50"
              title="Generate PDF"
            >
              {isGeneratingPDF ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
            </button>
            <button 
              onClick={handleExportData}
              className="p-2 border border-white/10 hover:bg-white/5 transition-all"
              title="Export Data"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 h-[calc(100vh-84px)] print:h-auto">
        {/* Sidebar: Intelligence Brief Portfolio */}
        <aside className="col-span-3 border-r border-white/5 p-6 overflow-y-auto bg-[#050505] print:border-gray-200 print:bg-white print:text-black">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-[10px] uppercase tracking-[0.4em] text-white/30 print:text-gray-400">
              Portfolio Index
            </h2>
            <span className="text-[10px] text-white/20 print:text-gray-400">{briefs.length} Briefs</span>
          </div>
          
          <div className="space-y-6">
            {briefs.map((brief) => (
              <div 
                key={brief.id} 
                className={`group cursor-pointer relative ${selectedBrief === brief.id ? 'bg-white/5' : ''} print:bg-transparent`}
                onClick={() => setSelectedBrief(brief.id)}
              >
                <div className="flex items-start gap-4 p-2">
                  <span className="text-[10px] text-white/20 mt-1 print:text-gray-400">IB-0{brief.id}</span>
                  <div className="flex-1">
                    <h3 className="text-xs uppercase tracking-wider group-hover:text-white transition-colors print:text-black">
                      {brief.title}
                    </h3>
                    <div className="flex gap-3 mt-2">
                      <span className="text-[8px] px-2 py-0.5 border border-white/10 text-white/40 uppercase print:border-gray-300 print:text-gray-500">
                        {brief.type}
                      </span>
                      <span className="text-[8px] text-white/20 py-0.5 print:text-gray-400">
                        F {brief.friction}
                      </span>
                    </div>
                  </div>
                  {brief.active && (
                    <div className="ml-auto w-1 h-1 bg-yellow-500 rounded-full animate-pulse print:bg-gray-500" />
                  )}
                </div>
                <div className={`absolute -left-6 top-0 bottom-0 w-1 bg-white transition-opacity print:bg-black ${selectedBrief === brief.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
              </div>
            ))}
          </div>
        </aside>

        {/* Center: Systemic Resonance Engine */}
        <main className="col-span-6 flex flex-col items-center justify-center relative bg-[#080808] print:bg-white" ref={dashboardRef}>
          <div className="relative w-[450px] h-[450px] flex items-center justify-center print:border-gray-200">
            <div className="absolute inset-0 border border-white/[0.03] rounded-full scale-110 print:border-gray-100" />
            <div className="absolute inset-0 border border-white/[0.05] rounded-full rotate-45 print:border-gray-100" />
            
            <div className="text-center z-10">
              <span className="text-9xl font-extralight tracking-tighter tabular-nums print:text-black">
                {isLoading ? "--.-" : telemetry.resonance.toFixed(1)}%
              </span>
              <p className="text-[10px] uppercase tracking-[0.8em] text-white/30 mt-4 print:text-gray-400">
                Systemic Resonance
              </p>
            </div>

            <div className="absolute bottom-10 flex gap-8">
              <Metric label="Load" value={`${telemetry.metrics.load}%`} />
              <Metric label="Friction" value={`${telemetry.metrics.friction}%`} />
              <Metric label="Dissonance" value={telemetry.metrics.dissonance.toFixed(3)} />
            </div>
          </div>
          
          {/* Replacement Liability Card */}
          <div className="absolute bottom-12 left-12 p-6 border border-white/5 bg-white/[0.02] w-64 print:border-gray-200 print:bg-gray-50">
            <h4 className="text-[10px] uppercase tracking-widest text-white/20 mb-2 print:text-gray-400">
              Replacement Liability
            </h4>
            <div className="text-3xl font-light print:text-black">
              ${(telemetry.metrics.replacementLiability / 1000).toFixed(0)}K
            </div>
            <div className="w-full bg-white/5 h-1 mt-4 print:bg-gray-200">
              <div 
                className="bg-white/20 h-full print:bg-gray-400"
                style={{ width: `${telemetry.metrics.burnoutIndex}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[8px] uppercase text-white/20 print:text-gray-400">
              <span>Burnout Index</span>
              <span>{telemetry.metrics.burnoutIndex}%</span>
            </div>
          </div>
        </main>

        {/* Right Sidebar: Telemetry & Operational Pulse */}
        <aside className="col-span-3 p-6 flex flex-col gap-6 border-l border-white/5 bg-[#050505] print:border-gray-200 print:bg-white">
          {/* Live Telemetry */}
          <section className="flex-1">
            <h3 className="text-[10px] uppercase tracking-widest text-white/30 mb-6 flex items-center gap-3 print:text-gray-400">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse print:bg-gray-400" />
              Live Telemetry
            </h3>
            <div className="space-y-3 font-mono text-[9px] text-white/40 leading-relaxed uppercase print:text-gray-500">
              {telemetry.logs.slice(0, 8).map((log, idx) => (
                <p key={idx}>{`[${String(idx).padStart(2, '0')}] ${log}`}</p>
              ))}
            </div>
          </section>

          {/* Operational Pulse */}
          <section className="bg-white/[0.03] p-6 border border-white/10 print:bg-gray-50 print:border-gray-200">
            <h3 className="text-[10px] uppercase tracking-widest text-white/60 mb-6 font-bold print:text-gray-700">
              Operational Pulse
            </h3>
            <div className="space-y-4 text-[10px] uppercase tracking-wider">
              <PulseItem label="Avg Utilization" value={`${telemetry.metrics.avgUtilization}%`} />
              <PulseItem label="System Dissonance" value={telemetry.metrics.dissonance.toFixed(3)} />
              <PulseItem label="Active Nodes" value={telemetry.activeNodes.toString()} />
              <PulseItem label="System Load" value={`${telemetry.metrics.load}%`} />
              <PulseItem label="Friction Index" value={`${telemetry.metrics.friction}%`} />
            </div>
          </section>

          {/* Quick Stats */}
          <section className="grid grid-cols-2 gap-2 print:hidden">
            <div className="p-3 border border-white/10 text-center">
              <TrendingUp className="w-3 h-3 mx-auto mb-1 text-white/40" />
              <p className="text-[8px] uppercase text-white/30">Stability</p>
              <p className="text-sm font-bold">{100 - telemetry.metrics.dissonance * 100}%</p>
            </div>
            <div className="p-3 border border-white/10 text-center">
              <Users className="w-3 h-3 mx-auto mb-1 text-white/40" />
              <p className="text-[8px] uppercase text-white/30">Active Sessions</p>
              <p className="text-sm font-bold">{Math.floor(telemetry.activeNodes * 0.6)}</p>
            </div>
          </section>
        </aside>
      </div>

      {/* Footer with PDF Metadata */}
      <footer className="hidden print:block text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200">
        <p>Sovereign Alignment Registry v1.6 | Generated: {new Date().toLocaleString()}</p>
        <p className="text-[8px] mt-1">Protocol OGR-IV | Node: Canary Wharf | Classification: Restricted</p>
      </footer>
    </div>
  );
};

// Helper Components
const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="text-center px-4">
    <span className="block text-white text-xs mb-1 print:text-black">{value}</span>
    <span className="text-[8px] uppercase tracking-widest text-white/20 print:text-gray-400">{label}</span>
  </div>
);

const PulseItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between border-b border-white/5 pb-2 print:border-gray-200">
    <span className="text-white/30 print:text-gray-500">{label}</span>
    <span className="text-white print:text-black">{value}</span>
  </div>
);

export default PdfAnalyticsDashboard;