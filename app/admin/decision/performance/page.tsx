// app/admin/decision/performance/page.tsx
export const dynamic = "force-dynamic";

import { DecisionPerformanceTable } from "@/components/admin/decision/DecisionPerformanceTable";
import { RebuildPerformanceButton } from "@/components/admin/decision/RebuildPerformanceButton";

async function getPerformanceData() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.abrahamoflondon.org";

  const response = await fetch(`${base}/api/admin/decision/performance`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load decision performance.");
  }

  return response.json();
}

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="rounded border border-white/10 bg-zinc-950/70 p-5">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">
        {label}
      </div>
      <div className="mt-3 text-4xl tracking-tight text-white">{value}</div>
      {subtext ? (
        <div className="mt-2 text-sm text-white/50">{subtext}</div>
      ) : null}
    </div>
  );
}

function percent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export default async function DecisionPerformancePage() {
  const data = await getPerformanceData();
  const summary = data.summary;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.26em] text-amber-500/70">
              Admin Surface
            </p>
            <h1 className="mt-2 font-serif text-2xl text-white">
              Decision Asset Performance
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">
              This surface shows which recommendation assets are actually earning
              attention and conversion. It turns your recommendation engine from
              static logic into governed commercial intelligence.
            </p>
          </div>

          <RebuildPerformanceButton />
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Tracked Assets"
            value={summary.totalAssets}
            subtext="Assets with persisted performance records."
          />
          <StatCard
            label="Total Impressions"
            value={summary.totalImpressions}
            subtext="Recommendation surfaces logged."
          />
          <StatCard
            label="Average CTR"
            value={percent(summary.averageCtr)}
            subtext="Click-through rate across tracked assets."
          />
          <StatCard
            label="Average CVR"
            value={percent(summary.averageConversionRate)}
            subtext="Conversion rate from click or exposure base."
          />
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Total Clicks"
            value={summary.totalClicks}
            subtext="User engagement with surfaced recommendations."
          />
          <StatCard
            label="Total Conversions"
            value={summary.totalConversions}
            subtext="Attributed conversion events."
          />
          <StatCard
            label="Average Adaptive Lift"
            value={summary.averageAdaptiveWeight.toFixed(2)}
            subtext="Mean live performance multiplier across assets."
          />
        </div>

        <div className="space-y-8">
          <DecisionPerformanceTable
            title="Top Assets by Click-Through Rate"
            rows={data.topByCtr}
            emptyMessage="No high-attention CTR data yet."
          />

          <DecisionPerformanceTable
            title="Top Assets by Conversion Rate"
            rows={data.topByConversion}
            emptyMessage="No conversion-rich assets yet."
          />

          <DecisionPerformanceTable
            title="Top Assets by Adaptive Lift"
            rows={data.topByWeight}
            emptyMessage="No adaptive lift data yet."
          />

          <DecisionPerformanceTable
            title="Underperforming Assets"
            rows={data.underperforming}
            emptyMessage="No underperforming assets detected."
          />

          <DecisionPerformanceTable
            title="Full Asset Performance Registry"
            rows={data.assets}
            emptyMessage="No tracked decision assets found."
          />
        </div>
      </div>
    </div>
  );
}
