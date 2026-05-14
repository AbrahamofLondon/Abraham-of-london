// app/admin/decision/governance/page.tsx
export const dynamic = "force-dynamic";

import { GovernanceAlertsPanel } from "@/components/admin/decision/GovernanceAlertsPanel";

async function getGovernanceData() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.abrahamoflondon.org";

  const response = await fetch(`${base}/api/admin/decision/governance`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load decision governance surface.");
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
      {subtext ? <div className="mt-2 text-sm text-white/50">{subtext}</div> : null}
    </div>
  );
}

export default async function DecisionGovernancePage() {
  const data = await getGovernanceData();

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="font-mono text-[8px] uppercase tracking-[0.26em] text-amber-500/70">
            Admin Surface
          </p>
          <h1 className="mt-2 font-serif text-2xl text-white">
            Recommendation Governance
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">
            This surface governs recommendation quality, confidence review points,
            suppression rules, and drift alerts. It exists to prevent the analysis layer
            from becoming noisy, unstable, or overly concentrated around a few assets.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Governance Rules"
            value={data.summary.ruleCount}
            subtext="Active rule records governing recommendation behavior."
          />
          <StatCard
            label="Active Alerts"
            value={data.summary.activeAlertCount}
            subtext="Current alerts requiring review."
          />
          <StatCard
            label="Critical Alerts"
            value={data.summary.criticalAlertCount}
            subtext="Highest-risk recommendation drift alerts."
          />
          <StatCard
            label="High Alerts"
            value={data.summary.highAlertCount}
            subtext="Serious but non-critical governance concerns."
          />
        </div>

        <GovernanceAlertsPanel alerts={data.alerts} />
      </div>
    </div>
  );
}
