/* components/mdx/DataTable.tsx */
import * as React from "react";

interface DataTableProps {
  title: string;
  data: Record<string, any>[];
  caption?: string;
}

export default function DataTable({ title, data, caption }: DataTableProps) {
  if (!data || data.length === 0) return null;

  const firstRow = data[0];
  if (!firstRow) return null;

  const columns = Object.keys(firstRow);

  return (
    <div className="my-12">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-[1px] w-8 bg-amber-800/40" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-600/70">
          {title}
        </span>
        <span className="h-[1px] flex-1 bg-amber-800/20" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-5 py-4 text-left font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-amber-600/60"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                {columns.map((col) => (
                  <td key={col} className="px-5 py-4 text-white/80 font-light">
                    {row?.[col] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {caption && (
        <div className="mt-3 text-right font-mono text-[8px] uppercase tracking-[0.2em] text-white/20">
          {caption}
        </div>
      )}
    </div>
  );
}