ib/alignment/enterprise-permissions.ts

export type EnterpriseRole =
  | "organisation_owner"
  | "campaign_admin"
  | "executive_viewer"
  | "team_lead_viewer"
  | "participant";

export function canViewExecutiveDashboard(role: EnterpriseRole): boolean {
  return ["organisation_owner", "campaign_admin", "executive_viewer"].includes(role);
}

export function canManageCampaign(role: EnterpriseRole): boolean {
  return ["organisation_owner", "campaign_admin"].includes(role);
}

export function canRespond(role: EnterpriseRole): boolean {
  return role === "participant" || canManageCampaign(role) || canViewExecutiveDashboard(role);
}
```

---

## 11. Enterprise advisory CTA component

### `components/alignment/EnterpriseAdvisoryCTA.tsx`

```tsx
import React from "react";

export default function EnterpriseAdvisoryCTA({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <section className="rounded-[32px] border bg-[#FCFBF7] p-8 shadow-sm">
      <div className="max-w-4xl">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A6A2F]">
          Advisory Layer
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
          {title}
        </h2>
        <p className="mt-4 text-sm leading-7 text-neutral-700">{body}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/consulting"
            className="inline-flex rounded-2xl border bg-white px-5 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            Request executive readout
          </a>
          <a
            href="/contact"
            className="inline-flex rounded-2xl border bg-white px-5 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            Commission institutional audit
          </a>
        </div>
      </div>
    </section>
  );
}