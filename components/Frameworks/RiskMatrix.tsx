/* components/Frameworks/RiskMatrix.tsx */
import React from 'react';
import { AlertTriangle, ShieldAlert, Zap } from 'lucide-react';

interface FailureModeMapping {
  mode: string;
  impact: 'Low' | 'Medium' | 'High';
  probability: 'Low' | 'Medium' | 'High';
}

export const RiskMatrix: React.FC<{ failureModes: string[] }> = ({ failureModes }) => {
  // Logic: In a real system, failureModes would be objects. 
  // Here, we derive mapping for the 75 intelligence briefs.
  const mappedRisks: FailureModeMapping[] = failureModes.map((mode, i) => ({
    mode,
    // Distributed for visualization logic
    impact: i % 3 === 0 ? 'High' : i % 2 === 0 ? 'Medium' : 'Low',
    probability: i % 3 === 0 ? 'Medium' : i % 2 === 0 ? 'High' : 'Low',
  }));

  const gridLevels = ['High', 'Medium', 'Low'];

  return (
    <div className="bg-zinc-900/30 border border-white/10 rounded-3xl p-8 my-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-white font-bold text-xl uppercase tracking-tighter flex items-center gap-3">
            <ShieldAlert className="text-rose-500" /> Systemic Risk Mapping
          </h3>
          <p className="text-zinc-500 text-sm font-mono mt-1 uppercase">Institutional_Vulnerability_Grid</p>
        </div>
        <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1 text-rose-500"><Zap size={10}/> Critical Path</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Y-Axis Label */}
        <div className="flex flex-col justify-between py-10 text-[10px] font-black text-zinc-600 uppercase [writing-mode:vertical-lr] rotate-180 items-center">
          Probability
        </div>

        {/* The Matrix Grid */}
        <div className="col-span-3 grid grid-cols-3 gap-2 aspect-square md:aspect-video">
          {gridLevels.map((pLevel) => (
            gridLevels.slice(0).reverse().map((iLevel) => {
              const risksInCell = mappedRisks.filter(r => r.probability === pLevel && r.impact === iLevel);
              const isCritical = pLevel === 'High' && iLevel === 'High';
              
              return (
                <div 
                  key={`${pLevel}-${iLevel}`} 
                  className={`relative border p-3 rounded-xl transition-all duration-500 overflow-hidden
                    ${isCritical ? 'border-rose-500/40 bg-rose-500/10' : 'border-white/5 bg-white/[0.02]'}
                  `}
                >
                  <div className="absolute top-2 right-2 text-[8px] font-mono text-zinc-700 uppercase">
                    P:{pLevel[0]} / I:{iLevel[0]}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {risksInCell.map((_, idx) => (
                      <div key={idx} className={`h-3 w-3 rounded-full animate-pulse ${isCritical ? 'bg-rose-500' : 'bg-amber-500/50'}`} />
                    ))}
                  </div>
                  
                  {risksInCell.length > 0 && (
                    <div className="mt-2 text-[9px] leading-tight text-zinc-400 font-medium">
                      {risksInCell.length} Threat{risksInCell.length > 1 ? 's' : ''} Detected
                    </div>
                  )}
                </div>
              );
            })
          ))}
          {/* X-Axis Labels */}
          <div className="col-start-2 col-span-3 flex justify-between px-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-4">
            <span>Low Impact</span>
            <span>High Impact</span>
          </div>
        </div>
      </div>

      {/* Detail Breakdown */}
      <div className="mt-12 space-y-3">
        {mappedRisks.filter(r => r.impact === 'High').map((risk, i) => (
          <div key={i} className="flex items-center gap-4 bg-black/40 border border-white/5 p-4 rounded-xl">
            <AlertTriangle className="text-rose-500 shrink-0" size={16} />
            <p className="text-xs text-zinc-300 leading-relaxed font-mono uppercase">{risk.mode}</p>
          </div>
        ))}
      </div>
    </div>
  );
};