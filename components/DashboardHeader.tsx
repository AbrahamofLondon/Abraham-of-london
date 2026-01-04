import React from 'react';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  stats: {
    total: number;
    available: number;
    missing: number;
  };
  onRefresh: () => void;
  onGenerateAll: () => void;
  isGenerating: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  stats,
  onRefresh,
  onGenerateAll,
  isGenerating,
}) => {
  return (
    <header className="mb-8 md:mb-12 border-b border-white/10 pb-6 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">
            {subtitle}
          </p>
          <h1 className="text-2xl md:text-4xl font-serif font-bold italic">
            {title} <span className="text-white/40">Dashboard</span>
          </h1>
          <p className="text-xs text-gray-500 mt-2 italic">
            {stats.total} PDFs available • {stats.available} on filesystem
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onRefresh}
            className="rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-300 transition-all hover:bg-gray-800"
            aria-label="Refresh PDF list"
          >
            🔄 Refresh
          </button>
          <button
            onClick={onGenerateAll}
            disabled={isGenerating}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-200 transition-all hover:bg-amber-500/20 disabled:opacity-50"
            aria-label="Generate all PDFs"
          >
            {isGenerating ? '⚡ Generating...' : '🚀 Generate All'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;