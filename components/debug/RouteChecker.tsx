/* components/debug/RouteChecker.tsx
 *
 * Previous version did `import * as ContentlayerGenerated from "contentlayer/generated"`
 * at module top-level. That single line dragged the entire Contentlayer data corpus
 * (316 documents, ~40 MB) into every server chunk that transitively imported this
 * component. A debug widget should never do that.
 *
 * This rewrite is a pure client component. It fetches only a trimmed diagnostic
 * subset via an API route on demand. If the API route does not exist in the
 * current build, it renders a clear banner rather than crashing.
 */
"use client";

import * as React from "react";

type BriefRow = {
  source: string;
  flattenedPath: string;
  bare: string;
};

export default function RouteChecker() {
  const [rows, setRows] = React.useState<BriefRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/_debug/content-counts");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (cancelled) return;

        const briefs: BriefRow[] = Array.isArray(json?.briefs)
          ? json.briefs.slice(0, 50).map((b: any) => ({
              source: "allBriefs",
              flattenedPath: String(b?._raw?.flattenedPath ?? ""),
              bare: String(b?._raw?.flattenedPath ?? "").split("/").pop() ?? "",
            }))
          : [];

        setRows(briefs);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="p-8 bg-red-950/20 border border-red-500/50 rounded-xl font-mono text-red-500">
        RouteChecker diagnostic unavailable: {error}
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="p-8 bg-[#060609] border border-white/5 rounded-xl font-mono text-xs text-zinc-500">
        Loading Contentlayer manifest…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-8 bg-red-950/20 border border-red-500/50 rounded-xl font-mono text-red-500">
        CRITICAL: No documents returned from /api/_debug/content-counts.
        Check your contentDirPath and filePathPattern.
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#060609] border border-emerald-500/20 rounded-xl font-mono text-[10px] text-zinc-400 max-w-4xl mx-auto my-10">
      <h2 className="text-emerald-500 mb-4 uppercase tracking-widest text-xs">Contentlayer Manifest Trace</h2>
      <div className="overflow-x-auto text-left">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10 uppercase text-[9px]">
              <th className="py-2">Source</th>
              <th className="py-2">Path</th>
              <th className="py-2">Expected URL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.flattenedPath}-${i}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-2 text-amber-500">{row.source}</td>
                <td className="py-2">{row.flattenedPath}</td>
                <td className="py-2 text-emerald-400">/vault/briefs/{row.bare}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
