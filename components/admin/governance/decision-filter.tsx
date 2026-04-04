/* components/admin/governance/decision-filter.tsx */

export function DecisionFilter({ mandate }: { mandate: string }) {
  const gates = [
    { id: 'm', label: 'Mandate Alignment', sub: 'Does this serve the one-sentence mission?' },
    { id: 'p', label: 'Principle vs. Pressure', sub: 'Is this reactive to fear or ego?' },
    { id: 'l', label: 'Legacy Velocity', sub: 'Does this contribute to 100-year endurance?' }
  ];

  return (
    <div className="bg-[#0A0A0A] border border-white/10 p-10 text-white font-sans">
      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 opacity-50">
        Institutional Decision Gate // OGR-G1
      </h4>
      
      <div className="space-y-6">
        {gates.map((gate) => (
          <div key={gate.id} className="group border-l border-white/10 pl-6 py-2 hover:border-[#8A6A2F] transition-colors">
            <p className="text-xs font-bold uppercase tracking-widest">{gate.label}</p>
            <p className="text-[10px] text-neutral-500 italic mt-1">{gate.sub}</p>
            <div className="mt-4 flex gap-4">
              <button className="px-4 py-1 text-[8px] font-bold border border-white/20 hover:bg-white hover:text-black transition-all">AFFIRM</button>
              <button className="px-4 py-1 text-[8px] font-bold border border-red-900/50 text-red-500 hover:bg-red-900/20">REJECT</button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 pt-8 border-t border-white/5">
        <p className="text-[9px] text-neutral-600 uppercase tracking-widest">
          Current Mandate: <span className="text-neutral-300 italic">"{mandate}"</span>
        </p>
      </div>
    </div>
  );
}