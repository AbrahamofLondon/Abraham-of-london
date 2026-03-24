'use client';

import React from 'react';
import { BookOpen, Star, ArrowDownCircle, Users, Copy } from 'lucide-react';

interface ScriptEntry {
  id: string;
  domain: string;
  content: string;
  decay: number;
  author: string;
  uses: number;
}

export function InstitutionalLibrary({ scripts }: { scripts: ScriptEntry[] }) {
  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-neutral-100 pb-8">
        <div>
          <h3 className="text-3xl font-black uppercase tracking-tighter">Institutional Library</h3>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.3em] mt-2">
            Validated Intervention Repository
          </p>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {scripts.length} Scripts</span>
          <span className="h-3 w-[1px] bg-neutral-200" />
          <span className="flex items-center gap-1 text-[#8A6A2F]"><Star className="w-3 h-3 fill-current" /> Peer Verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scripts.map((script) => (
          <div key={script.id} className="bg-white border border-neutral-200 p-8 hover:shadow-2xl transition-all group flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="bg-neutral-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-neutral-500">
                  {script.domain}
                </span>
                <div className="text-right">
                  <p className="text-[10px] font-black text-emerald-600">-{script.decay}% Friction</p>
                  <p className="text-[8px] font-bold text-neutral-400 uppercase">Avg. Decay Rate</p>
                </div>
              </div>

              <p className="text-sm font-bold leading-relaxed mb-8 text-neutral-800 italic">
                "{script.content}"
              </p>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-neutral-50">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] font-black">
                  {script.author[0]}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                  Lead: {script.author}
                </span>
              </div>
              
              <button className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-[#8A6A2F] transition-colors">
                <Copy className="w-3 h-3" /> Use Script
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}