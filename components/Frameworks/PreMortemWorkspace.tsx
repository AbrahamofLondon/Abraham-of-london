/* components/Frameworks/PreMortemWorkspace.tsx */
import React from 'react';
import { ShieldCheck, XCircle, AlertCircle, ChevronDown } from 'lucide-react';

interface MitigationState {
  [key: string]: boolean;
}

export const PreMortemWorkspace: React.FC<{ failureModes: string[] }> = ({ failureModes }) => {
  const [mitigated, setMitigated] = React.useState<MitigationState>({});

  const toggleMitigation = (index: number) => {
    setMitigated(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const totalRisks = failureModes.length;
  const mitigatedCount = Object.values(mitigated).filter(Boolean).length;
  const readinessPercentage = Math.round((mitigatedCount / totalRisks) * 100);

  return (
    <div className="my-16 bg-zinc-900/20 border border-zinc-800 rounded-3xl overflow-hidden">
      {/* Header with Readiness Meter */}
      <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div>
          <h3 className="text-white font-bold text-xl uppercase tracking-tighter flex items-center gap-3">
            <ShieldCheck className="text-amber-500" size={22} /> Pre-Mortem Mitigation Workspace
          </h3>
          <p className="text-zinc-500 text-sm font-mono mt-1 uppercase tracking-widest text-[10px]">Strategic_Readiness_Protocol</p>
        </div>
        
        <div className="flex items-center gap-4 bg-black/40 border border-white/10 px-6 py-3 rounded-2xl">
          <div className="text-right">
            <span className="block text-[10px] font-black text-zinc-500 uppercase">Institutional Readiness</span>
            <span className="text-2xl font-black text-white font-mono">{readinessPercentage}%</span>
          </div>
          <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-700" 
              style={{ width: `${readinessPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Interactive List */}
      <div className="divide-y divide-white/5">
        {failureModes.map((mode, i) => (
          <div 
            key={i} 
            className={`p-6 flex items-start gap-6 transition-colors duration-300 ${mitigated[i] ? 'bg-emerald-500/[0.02]' : 'hover:bg-white/[0.01]'}`}
          >
            <button 
              onClick={() => toggleMitigation(i)}
              className={`mt-1 h-6 w-6 rounded-md border flex items-center justify-center transition-all ${
                mitigated[i] 
                  ? 'bg-emerald-500 border-emerald-500 text-black' 
                  : 'bg-transparent border-zinc-700 text-transparent'
              }`}
            >
              <ShieldCheck size={14} />
            </button>
            
            <div className="flex-1 group cursor-pointer" onClick={() => toggleMitigation(i)}>
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-[10px] font-mono uppercase tracking-tighter ${mitigated[i] ? 'text-emerald-500' : 'text-zinc-500'}`}>
                  {mitigated[i] ? 'Vulnerability_Neutralized' : `Vulnerability_0${i + 1}`}
                </span>
                {!mitigated[i] && <AlertCircle size={10} className="text-rose-500 animate-pulse" />}
              </div>
              <p className={`text-sm leading-relaxed ${mitigated[i] ? 'text-zinc-500 line-through' : 'text-white font-medium'}`}>
                {mode}
              </p>
            </div>

            <div className="hidden md:block">
              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${
                mitigated[i] ? 'border-emerald-500/20 text-emerald-500' : 'border-zinc-800 text-zinc-600'
              }`}>
                {mitigated[i] ? 'Verified' : 'Action Required'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Certification */}
      <div className="p-6 bg-black/40 flex justify-center">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <AlertCircle size={12} /> Neutralize all vulnerabilities to certify deployment readiness.
        </p>
      </div>
    </div>
  );
};