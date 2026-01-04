// components/PDFDashboard/Header.tsx
import React from 'react';
import { FilterState, DashboardStats } from '@/types/pdf-dashboard';

interface HeaderProps {
  stats: DashboardStats;
  filterState: FilterState;
  categories: string[];
  isGenerating: boolean;
  onRefresh: () => void;
  onGenerateAll: () => void;
  onFilterChange: (updates: Partial<FilterState>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  filterState,
  categories,
  isGenerating,
  onRefresh,
  onGenerateAll,
  onFilterChange,
}) => {
  return (
    <header className="mb-8 md:mb-12 border-b border-white/10 pb-6 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">
            Institutional Publishing • Dynamic Registry
          </p>
          <h1 className="text-2xl md:text-4xl font-serif font-bold italic">
            PDF <span className="text-white/40">Intelligence Dashboard</span>
          </h1>
          <p className="text-xs text-gray-500 mt-2 italic">
            {stats.totalPDFs} PDFs available • {stats.availablePDFs} on filesystem
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onRefresh}
            className="btn-secondary"
            aria-label="Refresh PDF list"
          >
            🔄 Refresh
          </button>
          <button
            onClick={onGenerateAll}
            disabled={isGenerating}
            className="btn-primary"
            aria-label="Generate all PDFs"
          >
            {isGenerating ? '⚡ Generating...' : '🚀 Generate All'}
          </button>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="mt-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="🔍 Search PDFs by title, description, or ID..."
            value={filterState.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="input-search"
            aria-label="Search PDFs"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterState.selectedCategory}
            onChange={(e) => onFilterChange({ selectedCategory: e.target.value })}
            className="select-category"
            aria-label="Filter by category"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? '📁 All Categories' : `🏷️ ${category}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};