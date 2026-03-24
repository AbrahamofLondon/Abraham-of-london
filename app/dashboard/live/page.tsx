/* app/dashboard/live/page.tsx — OGR TERMINAL WITH DYNAMIC REGISTRY SEARCH */
'use client';

import * as React from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Activity, 
  Zap, 
  ShieldAlert, 
  Fingerprint, 
  RefreshCcw,
  Search,
  CheckCircle2,
  X,
  Filter,
  BarChart2,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

// High-Fidelity Mock Portfolio (Representative of your 75 Briefs)
const REGISTRY_BRIEFS = [
  { id: "IB-075", title: "Institutional Drift: Canary Wharf Node", category: "Structural", friction: 82, tags: ["Infrastructure", "London"] },
  { id: "IB-074", title: "Narrative Consistency Audit", category: "Operational", friction: 45, tags: ["Governance"] },
  { id: "IB-072", title: "Capital Agility vs Governance", category: "Financial", friction: 91, tags: ["Liquidity", "Risk"] },
  { id: "IB-068", title: "Executive Alignment Variance", category: "Structural", friction: 64, tags: ["Leadership"] },
  { id: "IB-065", title: "Protocol 4.2 Compliance Gap", category: "Operational", friction: 30, tags: ["Compliance"] },
];

export default function OGRLiveTerminal() {
  const [metrics, setMetrics] = useState({ friction: 42, alignment: 78, certainty: 64, resonance: 0.82 });
  const [isSimulating, setIsSimulating] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [selectedBriefs, setSelectedBriefs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "High Friction" | "Structural">("All");
  const [log, setLog] = useState<string[]>(["[SYSTEM]: OGR Core Initialized...", "[AUTH]: Node LONDON_CANARY_WHARF Active"]);

  // Dynamic Filtering Logic
  const filteredBriefs = useMemo(() => {
    return REGISTRY_BRIEFS.filter(brief => {
      const matchesSearch = brief.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            brief.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === "All" || 
                            (filterType === "High Friction" && brief.friction > 70) ||
                            (filterType === "Structural" && brief.category === "Structural");
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterType]);

  const toggleBrief = (id: string) => {
    setSelectedBriefs(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const runDiagnostic = async () => {
    if (selectedBriefs.length === 0) {
      toast.error("Registry Injection Required", { description: "Select briefs to prime the simulation." });
      setIsRegistryOpen(true);
      return;
    }
    setIsSimulating(true);
    setLog(prev => [...prev.slice(-10), `[PROC]: Injecting ${selectedBriefs.length} Contextual Briefs...`]);
    
    // Logic simulation
    await new Promise(r => setTimeout(r, 2000));
    
    setIsSimulating(false);
    toast.success("Simulation Complete", {
      description: "Institutional signal stabilized via Registry context.",
    });
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#8A6A2F]/30 font-sans flex overflow-hidden">
      
      {/* SOVEREIGN REGISTRY SIDEBAR */}
      <AnimatePresence>
        {isRegistryOpen && (
          <motion.aside 
            initial={{ x: -350 }}
            animate={{ x: 0 }}
            exit={{ x: -350 }}
            className="w-[350px] border-r border-white/5 bg-[#080808] flex flex-col z-50 shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-3">
                <Filter size={14} className="text-[#8A6A2F]" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">Registry Search</span>
              </div>
              <button onClick={() => setIsRegistryOpen(false)}><X size={14} className="text-zinc-600" /></button>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-3.5 text-zinc-600" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ID OR KEYWORD..." 
                  className="w-full bg-white/[0.03] border border-white/10 py-2.5 pl-10 pr-4 text-[10px] font-mono focus:border-[#8A6A2F]/50 outline-none transition-all"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2">
                {["All", "High Friction", "Structural"].map((f) => (
                  <button 
                    key={f}
                    onClick={() => setFilterType(f as any)}
                    className={`flex-1 py-1.5 text-[8px] font-mono uppercase tracking-widest border transition-all ${filterType === f ? 'bg-[#8A6A2F]/20 border-[#8A6A2F] text-white' : 'bg-transparent border-white/10 text-zinc-500'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Briefs List */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3 custom-scrollbar">
              {filteredBriefs.map(brief => (
                <button 
                  key={brief.id}
                  onClick={() => toggleBrief(brief.id)}
                  className={`w-full text-left p-4 border transition-all relative group ${selectedBriefs.includes(brief.id) ? 'border-[#8A6A2F] bg-[#8A6A2F]/5' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03]'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[8px] font-mono text-[#8A6A2F]">{brief.id}</span>
                    <div className="flex items-center gap-2">
                      {brief.friction > 70 && <AlertTriangle size={10} className="text-amber-500" />}
                      {selectedBriefs.includes(brief.id) && <CheckCircle2 size={12} className="text-[#8A6A2F]" />}
                    </div>
                  </div>
                  <h5 className="text-[11px] font-serif mb-3 leading-snug group-hover:text-[#8A6A2F] transition-colors">{brief.title}</h5>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                      {brief.tags.map(t => (
                        <span key={t} className="text-[7px] px-1.5 py-0.5 bg-zinc-900 text-zinc-500 rounded-sm">#{t}</span>
                      ))}
                    </div>
                    <span className="text-[8px] font-mono text-zinc-600">{brief.friction}% FRICTION</span>
                  </div>
                </button>
              ))}
              {filteredBriefs.length === 0 && (
                <div className="py-10 text-center text-[10px] font-mono text-zinc-600 uppercase tracking-widest">No Intelligence Matches</div>
              )}
            </div>

            <div className="p-6 bg-black border-t border-white/5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-mono text-zinc-500 uppercase">Selected Context</span>
                <span className="text-[10px] text-white font-serif">{selectedBriefs.length} Briefs</span>
              </div>
              <button 
                disabled={selectedBriefs.length === 0}
                onClick={() => setIsRegistryOpen(false)}
                className="w-full py-3 bg-[#8A6A2F] text-white text-[9px] font-mono uppercase tracking-[0.2em] hover:bg-[#A68342] transition-all disabled:opacity-20"
              >
                Inject Into OGR
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT Area (Same as previous with Registry Toggle) */}
      <div className="flex-1 relative overflow-y-auto">
        {!isRegistryOpen && (
          <button 
            onClick={() => setIsRegistryOpen(true)}
            className="fixed left-6 top-1/2 -translate-y-1/2 z-40 group"
          >
            <div className="flex items-center gap-3 px-4 py-8 bg-[#8A6A2F]/10 border border-[#8A6A2F]/30 text-[#8A6A2F] backdrop-blur-md hover:bg-[#8A6A2F] hover:text-white transition-all [writing-mode:vertical-lr] rotate-180">
               <span className="text-[9px] font-mono uppercase tracking-[0.3em]">Open Registry Portfolio</span>
            </div>
          </button>
        )}

        <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-8 gap-6">
            <div className="flex items-center gap-6">
              <div className="p-3 bg-[#8A6A2F]/10 border border-[#8A6A2F]/30 shadow-[0_0_20px_rgba(138,106,47,0.1)]">
                <Terminal className="w-6 h-6 text-[#8A6A2F]" />
              </div>
              <div>
                <h1 className="text-2xl font-serif tracking-tight">OGR Operational Terminal</h1>
                <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-mono mt-1">
                   Institutional Alignment: {(metrics.resonance * 100).toFixed(1)}% Resonance
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={runDiagnostic}
                disabled={isSimulating}
                className="group flex items-center gap-3 px-8 py-4 bg-white text-black font-mono text-[10px] uppercase tracking-widest hover:bg-[#8A6A2F] hover:text-white transition-all disabled:opacity-50 shadow-xl"
              >
                {isSimulating ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {isSimulating ? "Processing Context..." : "Simulate Outcome"}
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
             {/* Use existing telemetry and visualizer sections from previous code */}
             <section className="lg:col-span-1 bg-white/[0.02] border border-white/5 p-6 space-y-6">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Activity size={12} className="text-[#8A6A2F]" /> Telemetry
              </h3>
              <div className="space-y-3 font-mono text-[10px] text-zinc-400">
                {log.map((line, i) => <div key={i} className="border-l border-[#8A6A2F]/20 pl-3">{line}</div>)}
              </div>
            </section>

            <section className="lg:col-span-2 relative aspect-video bg-white/[0.01] border border-white/5 flex items-center justify-center overflow-hidden">
               {/* Visualizer Logic */}
               <div className="relative bg-black p-12 border border-white/10 rounded-full flex flex-col items-center">
                  <span className="text-4xl font-serif italic text-white/90">{(metrics.resonance * 100).toFixed(1)}%</span>
                  <span className="text-[8px] font-mono uppercase tracking-[0.4em] text-[#8A6A2F] mt-2">Resonance</span>
               </div>
            </section>

            <section className="lg:col-span-1 p-6 border border-white/5 bg-white/[0.02] space-y-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Injected Portfolio</h4>
                <div className="space-y-4">
                   {selectedBriefs.length > 0 ? selectedBriefs.map(id => (
                     <div key={id} className="flex items-center gap-3 p-2 bg-white/[0.03] border border-white/5">
                        <BarChart2 size={12} className="text-[#8A6A2F]" />
                        <span className="text-[9px] font-mono text-zinc-400">{id}</span>
                     </div>
                   )) : (
                     <div className="text-[9px] font-mono text-zinc-600 italic">No context active.</div>
                   )}
                </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}