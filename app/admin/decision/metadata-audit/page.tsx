// app/admin/decision/metadata-audit/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";

async function getAuditData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/decision/metadata-audit`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load metadata audit.");
  }

  return res.json();
}

export default async function DecisionMetadataAuditPage() {
  const data = await getAuditData();

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber-500/70">
            Admin Surface
          </p>
          <h1 className="mt-2 font-serif text-2xl text-white">
            Decision Metadata Audit
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">
            This surface exposes metadata confidence across repo-backed decision assets,
            so weakly structured content can be hardened before it degrades recommendation quality.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="rounded border border-white/10 bg-zinc-950/70 p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
              Total Assets
            </div>
            <div className="mt-3 text-4xl text-white">{data.totalAssets}</div>
          </div>
          <div className="rounded border border-white/10 bg-zinc-950/70 p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
              Average Metadata Confidence
            </div>
            <div className="mt-3 text-4xl text-white">
              {data.averageMetadataConfidence}
            </div>
          </div>
          <div className="rounded border border-white/10 bg-zinc-950/70 p-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
              Low Confidence Assets
            </div>
            <div className="mt-3 text-4xl text-white">
              {data.lowConfidenceAssets.length}
            </div>
          </div>
        </div>

        <div className="rounded border border-white/10 bg-zinc-950/70 overflow-hidden">
          <div className="border-b border-white/10 px-5 py-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
              Weak Assets
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {data.lowConfidenceAssets.map((asset: any) => (
              <div key={`${asset.kind}:${asset.id}`} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-white/30">
                      {asset.kind} • confidence {asset.metadataConfidence}
                    </div>
                    <h2 className="mt-2 text-lg text-white/80">{asset.title}</h2>
                    {asset.href ? (
                      <Link
                        href={asset.href}
                        className="mt-2 inline-block text-sm text-amber-400/70 hover:text-amber-300"
                      >
                        Open asset
                      </Link>
                    ) : null}
                    {asset.metadataWarnings?.length ? (
                      <ul className="mt-3 space-y-1">
                        {asset.metadataWarnings.map((warning: string) => (
                          <li key={warning} className="text-sm text-white/45">
                            • {warning}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}