/* components/Frameworks/DecisionMemo.tsx */
import React from 'react';
import { FileText, Printer, ShieldCheck } from 'lucide-react';
import type { Framework } from '@/lib/resources/strategic-frameworks.static';

interface DecisionMemoProps {
  framework: Framework;
}

export const DecisionMemo: React.FC<DecisionMemoProps> = ({ framework }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="group">
      {/* UI Control: Only visible on screen */}
      <div className="print:hidden mb-12 flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <FileText className="text-amber-500" size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold">Executive Decision Memo</h4>
            <p className="text-zinc-500 text-sm">Distill this brief into a Board-ready artifact.</p>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-500 transition-colors"
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      {/* THE ARTIFACT: Optimized for Print */}
      <div className="print:block hidden bg-white text-black p-12 font-serif leading-tight border-[12px] border-black min-h-[1050px]">
        {/* Header Block */}
        <div className="border-b-2 border-black pb-8 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Decision Memo</h1>
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-600">
              Institutional ID: {framework.key} // {new Date().toLocaleDateString()}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold uppercase text-sm">Abraham of London</div>
            <div className="text-xs uppercase italic">Directorate Oversight</div>
          </div>
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-2 gap-8 mb-10 text-xs font-mono border-b border-zinc-200 pb-8">
          <div>
            <span className="block font-bold text-zinc-400 mb-1">SUBJECT</span>
            <span className="uppercase">{framework.title}</span>
          </div>
          <div>
            <span className="block font-bold text-zinc-400 mb-1">CLASSIFICATION</span>
            <span className="uppercase">{framework.tier.join(' / ')}</span>
          </div>
        </div>

        {/* Summary Directive */}
        <section className="mb-10">
          <h2 className="text-lg font-bold uppercase mb-4 bg-black text-white px-2 py-1 inline-block">01. Executive Summary</h2>
          <p className="text-md leading-relaxed italic border-l-4 border-zinc-300 pl-6">
            "{framework.oneLiner}"
          </p>
        </section>

        {/* Strategic Logic */}
        <section className="mb-10">
          <h2 className="text-lg font-bold uppercase mb-4 border-b-2 border-black">02. Institutional Logic</h2>
          <div className="grid grid-cols-2 gap-8">
            {framework.operatingLogic.slice(0, 2).map((logic, i) => (
              <div key={i}>
                <h3 className="font-bold text-sm mb-2 uppercase">{logic.title}</h3>
                <p className="text-sm text-zinc-700">{logic.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mandate / Next Steps */}
        <section className="mb-12">
          <h2 className="text-lg font-bold uppercase mb-4 border-b-2 border-black">03. Board Mandate</h2>
          <ul className="space-y-4">
            {framework.whatToDoNext.map((step, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="font-mono font-bold text-zinc-400">[{i+1}]</span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Signature Block */}
        <div className="mt-auto pt-12 border-t border-zinc-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldCheck size={32} className="text-black" />
            <div className="text-[10px] font-mono leading-none">
              <p className="font-bold">VERIFIED_INTEGRITY</p>
              <p className="text-zinc-400">Abraham of London Registry</p>
            </div>
          </div>
          <div className="w-48 border-b border-black text-right h-12 flex items-end">
            <span className="text-[10px] uppercase text-zinc-400 w-full">Authorized Principal Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
};