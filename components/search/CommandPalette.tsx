/* components/search/CommandPalette.tsx */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Search, 
  Book, 
  FileText, 
  Zap, 
  Command,
  X
} from 'lucide-react';
import { 
  initializeClientContent, 
  searchInstitutionalContent, 
  ContentMetadata 
} from '@/lib/client-content';

const CommandPalette: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContentMetadata[]>([]);

  useEffect(() => {
    initializeClientContent();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.trim().length > 1) {
      setResults(searchInstitutionalContent(query));
    } else {
      setResults([]);
    }
  }, [query]);

  const navigateTo = (slug: string, type: string) => {
    const base = type === 'canon' ? '/canon' : type === 'short' ? '/shorts' : '/resources';
    router.push(`${base}/${slug}`);
    setIsOpen(false);
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-[#050609]/90 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0a0c10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center p-4 border-b border-white/5">
          <Search className="w-5 h-5 text-gray-500 mr-3" />
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 text-lg font-serif italic"
            placeholder="Search the Institutional Canon..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); }} 
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-600 border border-white/10 px-1.5 py-0.5 rounded">ESC</span>
            <button onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5 text-gray-500 hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item) => (
                <button
                  key={item.slug}
                  onClick={() => navigateTo(item.slug, item.type)}
                  className="w-full flex items-center p-3 rounded-xl hover:bg-white/[0.03] group transition-all text-left"
                >
                  <div className="mr-4 p-2 rounded-lg bg-white/[0.03] group-hover:bg-amber-500/10 transition-colors">
                    {item.type === 'canon' && <Book className="w-4 h-4 text-amber-500" />}
                    {item.type === 'download' && <FileText className="w-4 h-4 text-blue-400" />}
                    {item.type === 'short' && <Zap className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-200 group-hover:text-white">{item.title}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{item.type}</p>
                  </div>
                  <Command className="w-3 h-3 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          ) : query.length > 1 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 font-serif italic">No matching strategic materials found.</p>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-600">
              <p className="text-xs uppercase tracking-[0.2em]">Press <span className="text-gray-400">↑↓</span> to navigate · <span className="text-gray-400">Enter</span> to select</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

