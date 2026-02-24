"use client";
import { useState } from "react";

export function StrategicSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const res = await fetch("/api/search", {
      method: "POST",
      body: JSON.stringify({ query }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setResults(data.results);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-900 rounded-lg shadow-xl border border-slate-800">
      <div className="flex gap-2">
        <input
          className="flex-1 bg-black border border-slate-700 p-2 rounded text-white"
          placeholder="Enter strategic intent (e.g. 'family legacy architecture')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button 
          onClick={handleSearch}
          className="bg-amber-600 px-4 py-2 rounded text-black font-bold hover:bg-amber-500"
        >
          {loading ? "Analyzing..." : "Discover"}
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {results.map((item: any) => (
          <div key={item.id} className="p-4 border-l-4 border-amber-600 bg-slate-800/50">
            <h3 className="text-amber-500 font-bold">{item.title}</h3>
            <p className="text-sm text-slate-400">{item.summary}</p>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>{item.contentType}</span>
              <span>Match: {(item.similarity * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}