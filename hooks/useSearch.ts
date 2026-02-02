/* hooks/useSearch.ts — CLIENT-SIDE INTELLIGENCE FILTER */
import { useState, useEffect } from 'react';

export function useSearch(query: string) {
  const [data, setData] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch('/search-index.json')
      .then(res => res.json())
      .then(setData);
  }, []);

  useEffect(() => {
    if (!query) return setResults([]);
    
    const filtered = data.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10); // Limit to top 10 for UI performance

    setResults(filtered);
  }, [query, data]);

  return results;
}