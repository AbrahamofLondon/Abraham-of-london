// app/admin/decision/governance/page.tsx

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
    <div className="rounded-3xl border border-neutral-200 bg-white p-6">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-neutral-500">
        {label}
      </div>
      <div className="mt-3 text-4xl tracking-tight text-neutral-950">{value}</div>
      {subtext ? <div className="mt-2 text-sm text-neutral-500">{subtext}</div> : null}
    </div>
  );
}

export default async function DecisionGovernancePage() {
  const data = await getGovernanceData();

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-neutral-500">
            Admin Surface
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950">
            Recommendation Governance
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600">
            This surface governs recommendation quality, confidence thresholds,
            suppression rules, and drift alerts. It exists to prevent the engine
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
