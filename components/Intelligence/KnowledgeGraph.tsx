/* components/Intelligence/KnowledgeGraph.tsx */
import React from 'react';
import { Network, ZoomIn, ZoomOut, Maximize2, Share2 } from 'lucide-react';

export const KnowledgeGraph: React.FC<{ frameworks: any[] }> = ({ frameworks }) => {
  // Logic: In a full build, this uses D3.js or React Force Graph
  return (
    <div className="relative w-full h-[700px] bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden mt-12">
      {/* HUD Controls */}
      <div className="absolute top-6 left-6 z-10 space-y-4">
        <div>
          <h3 className="text-white font-bold text-lg uppercase tracking-tighter flex items-center gap-2">
            <Network className="text-amber-500" size={18} /> Master Pattern Topology
          </h3>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Relational_Intelligence_Map</p>
        </div>
        
        <div className="flex flex-col gap-2">
          <ControlButton icon={<ZoomIn size={14} />} label="Zoom In" />
          <ControlButton icon={<ZoomOut size={14} />} label="Zoom Out" />
          <ControlButton icon={<Maximize2 size={14} />} label="Reset View" />
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-10 bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[9px] font-black text-zinc-400 uppercase">Primary Dossier</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-[9px] font-black text-zinc-400 uppercase">Private Annotation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-px w-4 bg-zinc-700" />
            <span className="text-[9px] font-black text-zinc-400 uppercase">Strategic Dependency</span>
          </div>
        </div>
      </div>

      {/* The Visual Canvas (Simplified Mock) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Central Hub */}
        <div className="relative">
          <div className="h-4 w-4 bg-amber-500 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-pulse" />
          
          {/* Orbits & Lines - Representing the 75 briefs */}
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className="absolute border border-white/5 rounded-full"
              style={{ 
                width: `${(i + 1) * 100}px`, 
                height: `${(i + 1) * 100}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.3 - (i * 0.02)
              }}
            />
          ))}
          
          {/* Floating Data Nodes */}
          <div className="absolute -top-40 -left-40 bg-zinc-900 border border-amber-500/30 p-3 rounded-lg text-[9px] font-bold uppercase whitespace-nowrap">
            Tax Optimization → Trust Structures
          </div>
          <div className="absolute top-20 left-60 bg-zinc-900 border border-blue-500/30 p-3 rounded-lg text-[9px] font-bold uppercase whitespace-nowrap">
            Private Note: Q1 Liquidity Review
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 flex gap-3">
        <button className="bg-white text-black px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center gap-2">
          <Share2 size={12} /> Export Map
        </button>
      </div>
    </div>
  );
};

const ControlButton = ({ icon, label }: any) => (
  <button className="p-2 bg-zinc-900 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:border-white/20 transition-all group relative">
    {icon}
    <span className="absolute left-full ml-2 px-2 py-1 bg-black text-[8px] uppercase font-bold text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
      {label}
    </span>
  </button>
);