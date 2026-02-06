/* components/Intelligence/DiscoveryOverlay.tsx */
import React from 'react';
import { Search, FileText, MessageSquare, ArrowRight, Command } from 'lucide-react';

export const DiscoveryOverlay: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [query, setQuery] = React.useState('');
  
  // Logic: In production, this hits an API route using Pinecone/Supabase Vector
  const results = [
    { type: 'BRIEF', title: 'Capital Preservation Alpha', slug: 'capital-preservation', relevance: 0.98 },
    { type: 'ANNOTATION', title: 'Note on Q3 Liquidity', parent: 'Cash Flow Brief', relevance: 0.85 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-start justify-center pt-[10vh] px-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
          <Search className="text-amber-500" size={20} />
          <input 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search institutional intelligence..."
            className="flex-1 bg-transparent border-none text-white text-lg focus:ring-0 placeholder:text-zinc-600 font-serif"
          />
          <kbd className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 border border-white/5 text-[10px] text-zinc-400">
            <Command size={10} /> K
          </kbd>
        </div>

        {/* Results Stream */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          {query.length > 2 && results.map((res, i) => (
            <button 
              key={i}
              className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${res.type === 'BRIEF' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {res.type === 'BRIEF' ? <FileText size={18} /> : <MessageSquare size={18} />}
                </div>
                <div>
                  <p className="text-white font-bold text-sm uppercase tracking-tight">{res.title}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-mono">{res.type} {res.parent && `// IN: ${res.parent}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-zinc-700">REL: {(res.relevance * 100).toFixed(0)}%</span>
                <ArrowRight size={14} className="text-zinc-700 group-hover:text-white transition-colors" />
              </div>
            </button>
          ))}
          
          {query.length <= 2 && (
            <div className="py-20 text-center">
              <p className="text-xs text-zinc-600 uppercase tracking-[0.2em] font-black">Awaiting Tactical Query...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase">
          <span>Vector Search Active</span>
          <span>75 Briefs // Local Annotations</span>
        </div>
      </div>
      {/* Overlay Close Area */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};