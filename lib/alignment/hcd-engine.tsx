'use client';

import * as React from "react";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Activity, 
  Zap, 
  Fingerprint, 
  RefreshCcw,
  Search,
  CheckCircle2,
  X,
  Filter,
  BarChart2,
  AlertTriangle,
  ChevronRight,
  Database,
  ShieldCheck,
  Cpu,
  Clock
} from "lucide-react";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/* TYPES & MOCK DATA                                                          */
/* -------------------------------------------------------------------------- */

const REGISTRY_BRIEFS = [
  { id: "IB-075", title: "Institutional Drift: Canary Wharf Node", category: "Structural", friction: 82, tags: ["Infrastructure", "London"] },
  { id: "IB-074", title: "Narrative Consistency Audit", category: "Operational", friction: 45, tags: ["Governance"] },
  { id: "IB-072", title: "Capital Agility vs Governance", category: "Financial", friction: 91, tags: ["Liquidity", "Risk"] },
  { id: "IB-068", title: "Executive Alignment Variance", category: "Structural", friction: 64, tags: ["Leadership"] },
  { id: "IB-065", title: "Protocol 4.2 Compliance Gap", category: "Operational", friction: 30, tags: ["Compliance"] },
  { id: "IB-061", title: "Sovereign Asset Liquidation Protocol", category: "Financial", friction: 12, tags: ["Assets"] },
  { id: "IB-059", title: "The Architecture of Trust v2", category: "Structural", friction: 5, tags: ["Ethics"] },
];

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function OGRLiveTerminal() {
  const [metrics, setMetrics] = useState({ resonance: 0.82, load: 12, friction: 42 });
  const [isSimulating, setIsSimulating] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(true);
  const [selectedBriefs, setSelectedBriefs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "High Friction" | "Structural">("All");
  const [log, setLog] = useState<string[]>([
    "[SYSTEM] OGR Core v4.2.1 initialized",
    "[AUTH] Node LONDON_CANARY_WHARF active",
    "[DB] Connecting to Sovereign Ledger"
  ]);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

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
      toast.error("Registry injection required", { 
        description: "Select briefs to prime the OGR engine.",
      });
      setIsRegistryOpen(true);
      return;
    }

    setIsSimulating(true);
    setLog(prev => [...prev, `[PROC] Injecting ${selectedBriefs.length} contextual briefs`]);
    
    await new Promise(r => setTimeout(r, 800));
    setLog(prev => [...prev, `[CALC] Evaluating resonance delta across ${selectedBriefs.length} nodes`]);
    
    await new Promise(r => setTimeout(r, 1200));
    const newRes = Math.random() * (0.98 - 0.70) + 0.70;
    setMetrics(prev => ({ ...prev, resonance: newRes }));
    
    setLog(prev => [...prev, `[SUCCESS] New systemic resonance: ${(newRes * 100).toFixed(2)}%`]);
    setIsSimulating(false);
    
    toast.success("Audit complete", {
      description: "Institutional signal stabilized.",
    });
  };

  return (
    <main className="min-h-screen bg-[#FCFAF7] text-neutral-800 selection:bg-neutral-200 selection:text-neutral-900 font-sans flex overflow-hidden">
      
      {/* Registry Sidebar */}
      <AnimatePresence>
        {isRegistryOpen && (
          <motion.aside 
            initial={{ x: -380 }}
            animate={{ x: 0 }}
            exit={{ x: -380 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="w-[360px] border-r border-neutral-200 bg-white flex flex-col z-50 relative shadow-md"
          >
            <div className="p-5 border-b border-neutral-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database size={12} className="text-neutral-400" />
                <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-500">Portfolio Index</span>
              </div>
              <button onClick={() => setIsRegistryOpen(false)} className="p-1.5 hover:bg-neutral-100 transition-all text-neutral-400 hover:text-neutral-600">
                <X size={12} />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2 size-3 text-neutral-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID or title..." 
                  className="w-full border border-neutral-200 bg-white py-2 pl-9 pr-3 text-[9px] font-mono focus:border-neutral-400 outline-none transition-all placeholder:text-neutral-400"
                />
              </div>

              <div className="flex gap-2">
                {(["All", "High Friction", "Structural"] as const).map((f) => (
                  <button 
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={`flex-1 py-1.5 text-[7px] font-mono uppercase tracking-wider border transition-all ${
                      filterType === f 
                        ? 'bg-neutral-800 border-neutral-800 text-white' 
                        : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {filteredBriefs.map(brief => (
                <button 
                  key={brief.id}
                  onClick={() => toggleBrief(brief.id)}
                  className={`w-full text-left p-4 border transition-all relative ${
                    selectedBriefs.includes(brief.id) 
                      ? 'border-neutral-300 bg-neutral-50' 
                      : 'border-neutral-100 bg-white hover:bg-neutral-50'
                  }`}
                >
                  {selectedBriefs.includes(brief.id) && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 size={10} className="text-neutral-500" />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[7px] font-mono text-neutral-400">{brief.id}</span>
                    {brief.friction > 70 && <AlertTriangle size={9} className="text-neutral-500" />}
                  </div>
                  <h5 className="text-[10px] font-medium mb-2 leading-snug text-neutral-700">{brief.title}</h5>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                      {brief.tags.map(t => (
                        <span key={t} className="text-[6px] px-1.5 py-0.5 bg-neutral-100 text-neutral-500">#{t}</span>
                      ))}
                    </div>
                    <span className={`text-[7px] font-mono ${brief.friction > 70 ? 'text-neutral-600' : 'text-neutral-400'}`}>{brief.friction}%</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-5 border-t border-neutral-100 bg-neutral-50/30">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[7px] font-mono text-neutral-500 uppercase tracking-wider">Active Context</span>
                <span className="text-[8px] text-neutral-600 font-mono">{selectedBriefs.length} briefs</span>
              </div>
              <button 
                disabled={selectedBriefs.length === 0}
                onClick={() => setIsRegistryOpen(false)}
                className="w-full py-2.5 bg-neutral-800 text-white text-[8px] font-mono uppercase tracking-wider hover:bg-neutral-700 transition-all disabled:opacity-30 flex items-center justify-center gap-1.5"
              >
                Inject to Terminal <ChevronRight size={10} />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Terminal Workspace */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        
        {/* Sidebar Trigger */}
        {!isRegistryOpen && (
          <button 
            onClick={() => setIsRegistryOpen(true)}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 group"
          >
            <div className="flex items-center gap-2 px-2 py-8 bg-white border border-neutral-200 text-neutral-500 shadow-sm hover:border-neutral-300 transition-all [writing-mode:vertical-lr] rotate-180">
              <span className="text-[7px] font-mono uppercase tracking-wider">Registry</span>
            </div>
          </button>
        )}

        {/* Terminal Header */}
        <header className="px-8 py-6 border-b border-neutral-100 flex flex-col md:flex-row justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <div className="p-2 border border-neutral-200">
              <Terminal className="w-4 h-4 text-neutral-600" />
            </div>
            <div>
              <h1 className="text-lg font-light tracking-tight text-neutral-800">Sovereign Live Terminal</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-[6px] font-mono uppercase tracking-wider text-neutral-500">
                  <ShieldCheck size={8} className="text-neutral-500" /> SECURE
                </span>
                <span className="text-neutral-300">|</span>
                <span className="text-[6px] font-mono text-neutral-400">PROTOCOL: OGR-IV</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <div className="flex flex-col items-end mr-2">
              <span className="text-[6px] font-mono text-neutral-400 uppercase">Uptime</span>
              <span className="text-[9px] font-mono text-neutral-600">14:02:88</span>
            </div>
            <button 
              onClick={runDiagnostic}
              disabled={isSimulating}
              className="group flex items-center gap-2 px-6 py-2.5 bg-neutral-800 text-white font-mono text-[8px] uppercase tracking-wider hover:bg-neutral-700 transition-all disabled:opacity-40"
            >
              {isSimulating ? <RefreshCcw className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
              <span>{isSimulating ? "Processing..." : "Initiate Audit"}</span>
            </button>
          </div>
        </header>

        {/* Terminal Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-neutral-50/20">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Log Stream */}
            <section className="lg:col-span-1 bg-white border border-neutral-100 flex flex-col shadow-sm">
              <div className="p-3 border-b border-neutral-100 flex justify-between items-center">
                <h3 className="text-[7px] font-mono uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <Activity size={10} className="text-neutral-500" /> Telemetry
                </h3>
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-neutral-300" />
                  <div className="w-1 h-1 rounded-full bg-neutral-300" />
                  <div className="w-1 h-1 rounded-full bg-neutral-500" />
                </div>
              </div>
              <div className="p-4 font-mono text-[8px] text-neutral-500 flex-1 overflow-y-auto space-y-1.5 h-[320px]">
                {log.map((line, i) => (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={i} className="flex gap-2">
                    <span className="text-neutral-300">[{String(i).padStart(2, '0')}]</span>
                    <span className="leading-relaxed">{line}</span>
                  </motion.div>
                ))}
                <div ref={logEndRef} />
              </div>
            </section>

            {/* Central Visualization */}
            <section className="lg:col-span-2 bg-white border border-neutral-100 flex flex-col items-center justify-center relative p-8 shadow-sm">
              <div className="flex flex-col items-center">
                <div className="p-12 border border-neutral-200 rounded-full flex flex-col items-center bg-white">
                  <motion.span 
                    key={metrics.resonance}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl font-light tracking-tighter text-neutral-800"
                  >
                    {(metrics.resonance * 100).toFixed(1)}%
                  </motion.span>
                  <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-500 mt-3">
                    Systemic Resonance
                  </span>
                </div>
                
                <div className="mt-8 flex gap-12">
                  <div className="text-center">
                    <p className="text-[6px] font-mono text-neutral-400 uppercase mb-1">Compute Load</p>
                    <p className="text-[10px] font-mono text-neutral-600">{metrics.load}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[6px] font-mono text-neutral-400 uppercase mb-1">Dissonance</p>
                    <p className="text-[10px] font-mono text-neutral-600">0.024</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Active Context */}
            <section className="lg:col-span-1 flex flex-col gap-4">
              <div className="p-4 border border-neutral-100 bg-white flex-1 shadow-sm">
                <h4 className="text-[8px] font-mono uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-3 flex items-center gap-1.5">
                  <Cpu size={10} className="text-neutral-500" /> Active Logic
                </h4>
                <div className="mt-4 space-y-2">
                  {selectedBriefs.length > 0 ? selectedBriefs.map(id => (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={id} 
                      className="flex items-center justify-between p-2 border border-neutral-100 hover:border-neutral-200 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <BarChart2 size={10} className="text-neutral-400" />
                        <span className="text-[8px] font-mono text-neutral-600">{id}</span>
                      </div>
                      <button onClick={() => toggleBrief(id)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                        <X size={8} />
                      </button>
                    </motion.div>
                  )) : (
                    <div className="text-[8px] font-mono text-neutral-400 italic py-8 text-center border border-dashed border-neutral-200 px-3">
                      No logic injected
                      <span className="mt-1 block text-[7px]">Select briefs from registry</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 border border-neutral-200 bg-neutral-50/50 flex items-center gap-2">
                <Fingerprint size={14} className="text-neutral-400" />
                <div>
                  <p className="text-[6px] font-mono text-neutral-500 uppercase">Identity</p>
                  <p className="text-[8px] text-neutral-600 font-mono">Sovereign Root</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}