'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DataGridProps {
  data: Array<Record<string, string | number>>;
  caption?: string;
  className?: string;
}

/**
 * SOVEREIGN DATAGRID - STRICT TYPE VERSION
 * Optimized for Abraham of London Intelligence Briefings.
 */
export const DataGrid: React.FC<DataGridProps> = ({ data, caption, className }) => {
  // 1. Guard Clause: Ensure data exists and has at least one entry
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  // 2. Strict Header Extraction
  const firstRow = data[0];
  if (!firstRow) return null;

  const headers = Object.keys(firstRow);

  return (
    <div className={cn("my-12 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm", className)}>
      {caption && (
        <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="font-mono text-[9px] font-black uppercase tracking-widest text-zinc-500">
            {caption}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900">
              {headers.map((header) => (
                <th 
                  key={header} 
                  className="px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 border-r border-zinc-800 last:border-0"
                >
                  {header.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                {headers.map((header) => (
                  <td 
                    key={header} 
                    className="px-4 py-3 font-mono text-xs text-zinc-600 border-r border-zinc-100 last:border-0"
                  >
                    {row[header] ?? "—"} 
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-zinc-50/50 px-4 py-2 border-t border-zinc-100 flex justify-between">
        <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-tighter">
          End of Dataset // {data.length} entries recorded
        </span>
        <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-tighter">
          Verified_Sovereign_Node
        </span>
      </div>
    </div>
  );
};