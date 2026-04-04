// components/dashboard/BillingEntitlementsPanel.tsx
import * as React from "react";

type Entitlement = {
  productCode: string;
  tier: string;
  status: string;
  endsAt?: string | null;
};

export default function BillingEntitlementsPanel({
  entitlements,
  email,
}: {
  entitlements: Entitlement[];
  email: string;
}) {
  const [busy, setBusy] = React.useState<string | null>(null);

  async function startCheckout(priceCode: string) {
    setBusy(priceCode);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, priceCode }),
      });
      const json = await res.json();
      if (json?.url) window.location.href = json.url;
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="text-[10px] uppercase tracking-[0.35em] text-white/50">Billing & Entitlements</div>
      <h3 className="mt-3 text-2xl font-serif text-white">Commercial Access</h3>

      <div className="mt-6 space-y-3">
        {entitlements.length > 0 ? entitlements.map((e) => (
          <div key={`${e.productCode}-${e.tier}`} className="rounded-2xl border border-white/10 p-4 text-sm text-white/80">
            <div>{e.productCode}</div>
            <div className="text-white/50">{e.tier} • {e.status}</div>
          </div>
        )) : <div className="text-sm text-white/50">No active entitlements.</div>}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => startCheckout("diagnostic_report_basic")}
          disabled={busy === "diagnostic_report_basic"}
          className="rounded-full border border-white/15 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white hover:bg-white/10"
        >
          {busy === "diagnostic_report_basic" ? "Loading..." : "Buy Basic"}
        </button>

        <button
          onClick={() => startCheckout("diagnostic_report_pro")}
          disabled={busy === "diagnostic_report_pro"}
          className="rounded-full border border-amber-500/35 bg-amber-500/12 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-amber-300 hover:bg-amber-500/18"
        >
          {busy === "diagnostic_report_pro" ? "Loading..." : "Buy Pro"}
        </button>
      </div>
    </section>
  );
}