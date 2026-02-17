/* hooks/useSearch.ts — CLIENT-SIDE INTELLIGENCE FILTER */
import { useState, useEffect } from 'react';

// Adjust these fields to match your actual search-index.json structure
interface SearchItem {
  title: string;
  description?: string;  // Some items might use 'description' instead of 'excerpt'
  excerpt?: string;       // Some might use 'excerpt'
  category: string;
  slug: string;
  type?: string;
  date?: string;
  [key: string]: any;
}

export function useSearch(query: string): SearchItem[] {
  const [data, setData] = useState<SearchItem[]>([]);
  const [results, setResults] = useState<SearchItem[]>([]);

  useEffect(() => {
    fetch('/search-index.json')
      .then(res => res.json())
      .then((jsonData: SearchItem[]) => setData(jsonData))
      .catch(err => console.error('Failed to load search index:', err));
  }, []);

  useEffect(() => {
    if (!query || query.trim() === '') {
      setResults([]);
      return;
    }
    
    const searchQuery = query.toLowerCase().trim();
    
    const filtered = data.filter(item => {
      // Try both excerpt and description fields
      const title = item.title?.toLowerCase() || '';
      const excerpt = (item.excerpt || item.description || '').toLowerCase();
      const category = item.category?.toLowerCase() || '';
      
      return title.includes(searchQuery) || 
             excerpt.includes(searchQuery) || 
             category.includes(searchQuery);
    }).slice(0, 10);

    setResults(filtered);
  }, [query, data]);

  return results;
}