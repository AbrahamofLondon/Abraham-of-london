/* components/Frameworks/TacticalTimeline.tsx */
import React from 'react';
import { Calendar, Clock, CheckCircle2, Flag } from 'lucide-react';
import type { Framework } from '@/lib/resources/strategic-frameworks.static';

export const TacticalTimeline: React.FC<{ playbook: Framework['applicationPlaybook'] }> = ({ playbook }) => {
  return (
    <div className="my-16 relative">
      <div className="flex justify-between items-end mb-10 border-b border-white/5 pb-6">
        <div>
          <h3 className="text-white font-bold text-xl uppercase tracking-tighter flex items-center gap-3">
            <Clock className="text-emerald-500" size={20} /> Tactical Execution Roadmap
          </h3>
          <p className="text-zinc-500 text-sm font-mono mt-1 uppercase tracking-widest">Velocity_Calibration_Track</p>
        </div>
        <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">
          <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Current Phase</span>
          <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-zinc-800" /> Backlog</span>
        </div>
      </div>

      <div className="relative space-y-2">
        {/* The Vertical Line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-emerald-500/50 via-zinc-800 to-transparent md:left-1/2 md:-translate-x-1/2" />

        {playbook.map((step, i) => {
          const isEven = i % 2 === 0;
          return (
            <div key={i} className={`relative flex items-start md:items-center gap-8 md:gap-0 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
              
              {/* Timeline Content */}
              <div className="flex-1 pb-12 md:pb-8">
                <div className={`bg-zinc-900/40 border border-white/5 p-6 rounded-2xl hover:border-emerald-500/30 transition-all duration-300 group ${isEven ? 'md:mr-12' : 'md:ml-12'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Phase_0{step.step}</span>
                    <CheckCircle2 size={14} className="text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h4 className="text-white font-bold text-sm uppercase mb-2 leading-tight">{step.detail}</h4>
                  <div className="inline-flex items-center gap-2 bg-black/50 px-3 py-1 rounded-md border border-white/5">
                    <Flag size={10} className="text-amber-500" />
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-tighter">Deliverable: {step.deliverable}</span>
                  </div>
                </div>
              </div>

              {/* Central Node */}
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center z-10">
                <div className="h-8 w-8 rounded-full bg-black border-2 border-zinc-800 flex items-center justify-center group-hover:border-emerald-500 transition-colors shadow-2xl shadow-emerald-500/20">
                  <span className="text-[10px] font-black text-white">{step.step}</span>
                </div>
              </div>

              {/* Empty Space for balancing the grid */}
              <div className="hidden md:block flex-1" />
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-2 rounded-full flex items-center gap-3">
          <Calendar size={14} className="text-emerald-500" />
          <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Institutional Deployment Ready</span>
        </div>
      </div>
    </div>
  );
};