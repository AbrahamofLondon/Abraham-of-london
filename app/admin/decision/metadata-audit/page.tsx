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
    <div className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-neutral-500">
            Admin Surface
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950">
            Decision Metadata Audit
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600">
            This surface exposes metadata confidence across repo-backed decision assets,
            so weakly structured content can be hardened before it degrades recommendation quality.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="rounded-3xl border bg-white p-6">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Total Assets
            </div>
            <div className="mt-3 text-4xl text-neutral-900">{data.totalAssets}</div>
          </div>
          <div className="rounded-3xl border bg-white p-6">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Average Metadata Confidence
            </div>
            <div className="mt-3 text-4xl text-neutral-900">
              {data.averageMetadataConfidence}
            </div>
          </div>
          <div className="rounded-3xl border bg-white p-6">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Low Confidence Assets
            </div>
            <div className="mt-3 text-4xl text-neutral-900">
              {data.lowConfidenceAssets.length}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-white overflow-hidden">
          <div className="border-b px-6 py-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Weak Assets
            </div>
          </div>

          <div className="divide-y">
            {data.lowConfidenceAssets.map((asset: any) => (
              <div key={`${asset.kind}:${asset.id}`} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      {asset.kind} • confidence {asset.metadataConfidence}
                    </div>
                    <h2 className="mt-2 text-lg text-neutral-900">{asset.title}</h2>
                    {asset.href ? (
                      <Link
                        href={asset.href}
                        className="mt-2 inline-block text-sm text-amber-700 hover:text-amber-800"
                      >
                        Open asset
                      </Link>
                    ) : null}
                    {asset.metadataWarnings?.length ? (
                      <ul className="mt-3 space-y-1">
                        {asset.metadataWarnings.map((warning: string) => (
                          <li key={warning} className="text-sm text-neutral-600">
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