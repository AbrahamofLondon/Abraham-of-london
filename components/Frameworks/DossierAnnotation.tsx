/* components/Frameworks/DossierAnnotation.tsx */
import React from 'react';
import { MessageSquare, Lock, Send, Users, Shield } from 'lucide-react';

interface Annotation {
  id: string;
  body: string;
  author: string;
  timestamp: string;
  priority: 'ROUTINE' | 'URGENT';
}

export const DossierAnnotation: React.FC<{ resourceId: string; user: any }> = ({ resourceId, user }) => {
  const [notes, setNotes] = React.useState<Annotation[]>([]);
  const [input, setInput] = React.useState('');

  const handlePost = () => {
    if (!input.trim()) return;
    const newNote: Annotation = {
      id: crypto.randomUUID(),
      body: input,
      author: user.name,
      timestamp: new Date().toISOString(),
      priority: 'ROUTINE'
    };
    setNotes([newNote, ...notes]);
    setInput('');
    // In production: POST to /api/intelligence/annotate
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden mt-12">
      <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-amber-500" size={18} />
          <h3 className="text-white font-bold text-sm uppercase tracking-widest">Delegated Annotations</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Lock size={10} className="text-amber-500" />
          <span className="text-[9px] font-black text-amber-500 uppercase">Principals Only</span>
        </div>
      </div>

      {/* Note Input */}
      <div className="p-6 bg-black/20">
        <div className="relative">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter institutional mandate or context..."
            className="w-full bg-zinc-950 border border-white/10 rounded-xl p-4 text-sm text-zinc-300 focus:border-amber-500/50 focus:ring-0 transition-all resize-none h-24"
          />
          <button 
            onClick={handlePost}
            className="absolute bottom-4 right-4 bg-white text-black p-2 rounded-lg hover:bg-amber-500 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Annotation Feed */}
      <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
        {notes.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-xs text-zinc-600 uppercase font-mono tracking-widest">No active annotations for this dossier.</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="p-6 hover:bg-white/[0.01] transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-amber-200 uppercase tracking-tighter">{note.author}</span>
                <span className="text-[9px] font-mono text-zinc-600">{new Date(note.timestamp).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed font-serif italic">"{note.body}"</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};