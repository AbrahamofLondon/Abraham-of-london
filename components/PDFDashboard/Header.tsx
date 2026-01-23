import React from "react";
import type { DashboardStats, FilterState } from "@/types/pdf-dashboard";

export type ViewMode = "list" | "grid" | "detail";

export interface HeaderProps {
  stats: DashboardStats;
  filterState: FilterState;
  categories: string[];
  viewMode: ViewMode;
  selectedPDFs: Set<string>;
  isGenerating: boolean;

  onRefresh: () => void;
  onGenerateAll: () => Promise<any>;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onSearch: (q: string) => void;
  onSort: (sortBy: string) => void;
  onClearFilters: () => void;
  onViewModeChange: (mode: ViewMode) => void;

  onBatchDelete: () => Promise<void>;
  onBatchExport: (format: string) => Promise<void>;
  enableSharing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  filterState,
  categories,
  viewMode,
  selectedPDFs,
  isGenerating,
  onRefresh,
  onGenerateAll,
  onSearch,
  onFilterChange,
  onSort,
  onClearFilters,
  onViewModeChange,
  onBatchDelete,
  onBatchExport,
}) => {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">PDF Dashboard</h1>
          <div className="mt-1 text-sm text-gray-400">
            Total: {stats.totalPDFs} • Generated: {stats.generated} • Missing: {stats.missingPDFs} • Errors: {stats.errors}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            className="px-3 py-2 rounded-lg bg-black/20 border border-gray-800 text-sm text-gray-100 placeholder:text-gray-500"
            placeholder="Search PDFs…"
            value={filterState.searchQuery}
            onChange={(e) => onSearch(e.target.value)}
          />

          <select
            className="px-3 py-2 rounded-lg bg-black/20 border border-gray-800 text-sm text-gray-100"
            value={filterState.selectedCategory}
            onChange={(e) => onFilterChange({ selectedCategory: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition text-sm"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={onClearFilters}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition text-sm"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange(viewMode === "list" ? "grid" : "list")}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition text-sm"
          >
            View: {viewMode}
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => void onGenerateAll()}
            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition text-sm"
          >
            Generate All
          </button>

          {selectedPDFs.size > 0 ? (
            <>
              <button
                type="button"
                onClick={() => void onBatchDelete()}
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition text-sm"
              >
                Batch Delete ({selectedPDFs.size})
              </button>

              <button
                type="button"
                onClick={() => void onBatchExport("pdf")}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition text-sm"
              >
                Batch Export
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => onSort("title")}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition text-sm"
          >
            Sort: {filterState.sortBy}
          </button>
        </div>
      </div>
    </div>
  );
};

Header.displayName = "Header";

const HeaderComponent = Header;
export default HeaderComponent;