// components/PDFFilters.tsx

import * as React from "react";

type SortBy = "title" | "date" | "size" | "category";
type SortOrder = "asc" | "desc";

export interface PDFFiltersProps {
  searchQuery: string;
  selectedCategory: string;
  categories: string[];

  sortBy?: SortBy;
  sortOrder?: SortOrder;

  onSearchChange: (query: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange?: (value: SortBy) => void;
  onSortOrderChange?: (value: SortOrder) => void;
  onClearFilters: () => void;

  className?: string;
}

const SORT_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: "date", label: "Date" },
  { value: "title", label: "Title" },
  { value: "size", label: "Size" },
  { value: "category", label: "Category" },
];

export default function PDFFilters({
  searchQuery,
  selectedCategory,
  categories,
  sortBy = "date",
  sortOrder = "desc",
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onSortOrderChange,
  onClearFilters,
  className = "",
}: PDFFiltersProps) {
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== "all" ||
    sortBy !== "date" ||
    sortOrder !== "desc";

  return (
    <div
      className={`rounded-[1.5rem] border border-white/5 bg-zinc-900/30 p-4 md:p-6 backdrop-blur-sm ${className}`}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-5">
          <label
            htmlFor="pdf-search"
            className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500"
          >
            Search Registry
          </label>
          <input
            id="pdf-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search titles, categories, dossiers..."
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-gold/40 focus:ring-2 focus:ring-gold/10"
          />
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor="pdf-category"
            className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500"
          >
            Category
          </label>
          <select
            id="pdf-category"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-all focus:border-gold/40 focus:ring-2 focus:ring-gold/10"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="pdf-sort-by"
            className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500"
          >
            Sort By
          </label>
          <select
            id="pdf-sort-by"
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value as SortBy)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-all focus:border-gold/40 focus:ring-2 focus:ring-gold/10"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="pdf-sort-order"
            className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500"
          >
            Order
          </label>
          <div className="flex gap-2">
            <select
              id="pdf-sort-order"
              value={sortOrder}
              onChange={(e) =>
                onSortOrderChange?.(e.target.value as SortOrder)
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-all focus:border-gold/40 focus:ring-2 focus:ring-gold/10"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-600">
          <span>Search: {searchQuery.trim() ? "Active" : "Idle"}</span>
          <span>•</span>
          <span>
            Category: {selectedCategory && selectedCategory !== "all" ? selectedCategory : "All"}
          </span>
          <span>•</span>
          <span>Sort: {sortBy}</span>
          <span>•</span>
          <span>Order: {sortOrder}</span>
        </div>

        <button
          type="button"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
          className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] transition-all ${
            hasActiveFilters
              ? "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white hover:text-black"
              : "cursor-not-allowed border border-white/5 bg-transparent text-zinc-700"
          }`}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}