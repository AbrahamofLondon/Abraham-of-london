import React from 'react';

interface PDFFiltersProps {
  searchQuery: string;
  selectedCategory: string;
  categories: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

const PDFFilters: React.FC<PDFFiltersProps> = ({
  searchQuery,
  selectedCategory,
  categories,
  onSearchChange,
  onCategoryChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="🔍 Search PDFs by title, description, or ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-amber-500/50 focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border border-gray-800 bg-black/40 px-4 py-3 text-sm text-white focus:border-amber-500/50 focus:outline-none"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? '📁 All Categories' : `🏷️ ${category}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PDFFilters;