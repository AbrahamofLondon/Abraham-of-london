/* components/debug/RouteChecker.tsx */
import * as ContentlayerGenerated from "contentlayer/generated";

export default function RouteChecker() {
  // Use type casting to avoid compilation errors if a collection is missing
  const allBriefs = (ContentlayerGenerated as any).allBriefs || [];
  const allVaultBriefs = (ContentlayerGenerated as any).allVaultBriefs || [];

  const combined = [
    ...allBriefs.map((b: any) => ({ ...b, _source: 'allBriefs' })),
    ...allVaultBriefs.map((b: any) => ({ ...b, _source: 'allVaultBriefs' }))
  ];

  if (combined.length === 0) {
    return (
      <div className="p-8 bg-red-950/20 border border-red-500/50 rounded-xl font-mono text-red-500">
        CRITICAL: No documents found in Contentlayer collections. 
        Check your contentDirPath and filePathPattern.
      </div>
    );
  }

  return (
    <div className="p-8 bg-black border border-emerald-500/20 rounded-xl font-mono text-[10px] text-zinc-400 max-w-4xl mx-auto my-10">
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
            {combined.map((doc, i) => {
              const bare = doc._raw.flattenedPath.split('/').pop();
              return (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-2 text-amber-500">{doc._source}</td>
                  <td className="py-2">{doc._raw.flattenedPath}</td>
                  <td className="py-2 text-emerald-400">/vault/briefs/{bare}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}