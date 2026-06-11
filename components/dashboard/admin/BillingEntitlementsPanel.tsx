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

      <div className="mt-6 text-sm text-white/50">
        Diagnostic Report Basic and Pro have been retired. New purchases resolve through Executive Reporting or Strategy Room.
      </div>
    </section>
  );
}
