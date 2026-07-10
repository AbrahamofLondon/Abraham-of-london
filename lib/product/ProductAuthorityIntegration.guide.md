# Product Authority Surface Integration Guide

## Overview

This guide shows how product authority truth reaches a route. The internal
`ProductAuthorityContract` (blocking reasons, validation results, evidence
source paths, authority backbone) is a **governance record**, not a display
object. It exists to let the estate reason about a product's evidence state.
It is never the thing a customer sees.

Every route belongs to exactly one of two worlds:

```
PUBLIC_CUSTOMER
CONTROLLED_CUSTOMER
ENTITLED_CUSTOMER

MAY CONSUME:
  - a bounded public/customer-safe projection (projectPublicProductAuthority)
  - SurfaceBoundaryPanel, with hand-authored safe strings
  - composed public product truth (copy you write, not contract fields you render)

MAY NOT CONSUME:
  - ProductAuthorityContract
  - resolveProductAuthority / getDefaultProductConfigurations
  - blockingReasons
  - validation internals (antiToyPassed, redTeamPassed, evidenceLedgerV2Present, ...)
  - evidence file locations (evidenceSource.canonicalLocation, authorityBackbone)
  - ProductAuthorityPanel / ProductAuthorityNotice / ProductAuthorityBadge / ProductAuthorityWrapper
  - ProductEvidenceStatus

ADMIN / INTERNAL_OPERATOR

MAY CONSUME:
  - the full ProductAuthorityContract
  - resolveProductAuthority / getDefaultProductConfigurations, unrestricted
  - ProductAuthorityPanel / ProductAuthorityNotice / ProductAuthorityBadge
  - ProductEvidenceStatus
  - full evidence status, validation detail, blocking reasons
```

There is no third category. A route that is "public but the buyer is
sophisticated" is still `PUBLIC_CUSTOMER`. A route behind a login is
`CONTROLLED_CUSTOMER`, not `ADMIN` — see route classification below.

## Route classification

Classification is mechanical, not a judgment call — it's the same taxonomy
`scripts/authority-boundary-gate.mjs` enforces:

- **ADMIN** — any path under `/admin/**`.
- **INTERNAL_OPERATOR** — `/inner-circle/admin/**`, `/api/admin/**`, `/api/internal/**`.
- **PUBLIC_ACCOUNTABILITY** — a fixed, explicit allowlist (currently only
  `/intelligence/gmi/red-team`) for routes that publish governed accountability
  records by design. Adding a route here requires a deliberate decision, never
  a default.
- **CONTROLLED_CUSTOMER** — routes matching a documented prefix list (strategy
  room, counsel, oversight, boardroom, client, portal, case/report views,
  checkout, decision-instruments, private/premium areas — see the gate script
  for the exact list) where access requires auth or entitlement.
- **PUBLIC_CUSTOMER** — everything else. This is the default, not an opt-in.
  If a route isn't explicitly ADMIN, INTERNAL_OPERATOR, PUBLIC_ACCOUNTABILITY,
  or on the controlled-customer prefix list, it is public, and the boundary
  above applies in full.

## The public path: `projectPublicProductAuthority`

`lib/product/public-product-authority-projection.ts` is the only supported
way to bring authority meaning onto a customer surface. It reads only
`productCode` and `currentAuthorityState` from the internal contract and
constructs a **fresh object** — it never spreads the contract, so internal
fields cannot leak by accident.

```typescript
// Server-side only (getStaticProps / getServerSideProps / a Server Component).
// Never call resolveProductAuthority in a client component.
import { resolveProductAuthority, getDefaultProductConfigurations } from "@/lib/product/resolve-product-authority";
import { projectPublicProductAuthority } from "@/lib/product/public-product-authority-projection";

const configs = getDefaultProductConfigurations();
const config = configs.find((c) => c.productCode === "team_assessment");
const contract = config ? resolveProductAuthority(config) : null;

const publicAuthority = contract
  ? projectPublicProductAuthority(contract, {
      nextPublicAction: { label: "Learn how this is evidenced", href: "/canon/evidence-standard" },
    })
  : null;

// publicAuthority is now safe to pass as a prop into a client component.
```

`publicAuthority` exposes exactly four fields: `posture` (one of
`PUBLIC_AUTHORITY_CLEARED`, `CONTROLLED_AUTHORITY`, `EVIDENCE_LIMITED`,
`REFERENCE_AUTHORITY`, `NO_PUBLIC_AUTHORITY`), `publicClaimLanguage`,
`customerMeaning`, and an optional `nextPublicAction`. See
`PUBLIC_PROJECTION_ALLOWED_KEYS` in that file for the authoritative list —
if a field isn't in that array, it cannot appear on a public route.

Render it with your own presentation component (a badge, a line of copy) —
there is currently no shared public-facing display component for this
projection. Build one under `components/product/` if a route needs it, and
give it a name that does not start with `ProductAuthority` (that prefix is
reserved for the internal-contract-consuming components below, which the
transitive authority gate treats as forbidden on every public and
controlled-customer route by pattern match).

### `SurfaceBoundaryPanel` — hand-authored safe strings

For routes that need to say what a surface does and does not do (what gets
recorded, what the system reads, what happens next), use
`components/product/SurfaceBoundaryPanel.tsx`. It takes only
pre-sanitized, hand-authored strings (`recordCreated: string`,
`systemReads: string[]`, `nextAction: { label, href }`) — it never touches
`ProductAuthorityContract` and is already deployed correctly across several
public routes (`pages/provenance/sample-export.tsx`,
`pages/tools/decision-delay-exposure.tsx`, `pages/diagnostics/board-summary.tsx`,
among others). It is safe on `PUBLIC_CUSTOMER` and `CONTROLLED_CUSTOMER`
routes precisely because every string it renders is authored by a person,
not derived from the contract at render time.

```typescript
<SurfaceBoundaryPanel
  surfaceType="diagnostic"
  recordCreated="No governed case or retained decision record is created by this estimate."
  systemReads={["Stated financial exposure", "Decision state"]}
  nextAction={{ label: "Start a governed case", href: "/decision-centre" }}
/>
```

## The admin path: full contract, unrestricted

Only under `/admin/**` (or `/inner-circle/admin/**`, `/api/admin/**`,
`/api/internal/**`) may a route resolve and render the full contract:

```typescript
// pages/admin/products/authority-control-room.tsx
import { ProductAuthorityPanel } from "@/components/product/ProductAuthorityPanel";
import { ProductEvidenceStatus } from "@/components/product/ProductEvidenceStatus";
import { resolveProductAuthority, getDefaultProductConfigurations } from "@/lib/product/resolve-product-authority";

export default function AdminAuthorityControlRoom() {
  const configs = getDefaultProductConfigurations();
  return (
    <div>
      <h1>Product Authority Control Room</h1>
      {configs.map((config) => {
        const contract = resolveProductAuthority(config);
        return (
          <div key={config.productCode}>
            <h2>{config.productCode}</h2>
            <ProductAuthorityPanel contract={contract} expanded={true} />
            <ProductEvidenceStatus contract={contract} />
          </div>
        );
      })}
    </div>
  );
}
```

`ProductAuthorityBadge`, `ProductAuthorityNotice`, and `ProductAuthorityWrapper`
follow the same rule: admin/internal-operator only, full contract, no
restriction on which fields render.

## Common mistakes to avoid

❌ **Don't** render `ProductAuthorityPanel`, `ProductAuthorityNotice`,
`ProductAuthorityBadge`, or `ProductEvidenceStatus` on a public or
controlled-customer route, even "just the badge" or "just to be transparent":

```typescript
// WRONG — pages/team-assessment.tsx is PUBLIC_CUSTOMER
<ProductAuthorityPanel contract={contract} />
<ProductAuthorityNotice contract={contract} />
```

✅ **Do** project first, then render only the projection:

```typescript
// CORRECT — pages/team-assessment.tsx
<AuthorityMeaningLine projection={publicAuthority} />
```

---

❌ **Don't** call `resolveProductAuthority` / `getDefaultProductConfigurations`
inside a client component or in browser-executed code on a public route —
the whole contract object would be serialized into the page bundle even if
you only render one field from it:

```typescript
// WRONG — resolves and holds the full contract client-side
export default function EnterpriseDecisionScanPage() {
  const configs = getDefaultProductConfigurations();
  const contract = resolveProductAuthority(configs.find(c => c.productCode === "enterprise_assessment"));
  // contract.blockingReasons, contract.validation.* now exist in the client bundle
}
```

✅ **Do** resolve and project server-side, pass only the projection down:

```typescript
// CORRECT — getStaticProps resolves + projects; client only ever sees publicAuthority
export const getStaticProps: GetStaticProps<Props> = async () => {
  const contract = resolveProductAuthority(config);
  const publicAuthority = contract ? projectPublicProductAuthority(contract) : null;
  return { props: { publicAuthority } };
};
```

---

❌ **Don't** hide a limited posture instead of stating it plainly:

```typescript
// WRONG
if (publicAuthority.posture === "EVIDENCE_LIMITED") return null;
```

✅ **Do** show the bounded customer meaning — `EVIDENCE_LIMITED` has its own
honest, pre-written `customerMeaning` string; use it:

```typescript
// CORRECT
<p>{publicAuthority.customerMeaning}</p>
```

## Testing your integration

1. **Boundary check:** `pnpm gate:authority-imports` — does the transitive
   import gate pass for your route (no path to a forbidden internal module at
   any depth)?
2. **Vocabulary check:** `pnpm gate:authority-vocabulary` — does the rendered
   page contain any forbidden internal phrase (`blockingReasons` text,
   `anti_toy_validation`, canonical file paths, `Legacy Authority`, etc.)?
3. **Doctrine check:** `pnpm gate:authority-doctrine` — if you had to update
   this guide or another governance document, does it still teach the
   boundary correctly?
4. **Projection check:** `pnpm vitest run tests/product/public-authority-projection.test.ts`
   — does the projection serialize to exactly the allowed keys with no
   internal value present?
5. **TypeScript check:** `pnpm typecheck`

Run all authority gates together with `pnpm gate:authority`.

## Questions?

- Public projection: `lib/product/public-product-authority-projection.ts`
- Public-safe hand-authored panel: `components/product/SurfaceBoundaryPanel.tsx`
- Internal contract (admin-only): `lib/product/product-authority-contract.ts`
- Resolver (admin-only): `lib/product/resolve-product-authority.ts`
- Route classification / transitive gate: `scripts/authority-boundary-gate.mjs`
- Rendered-vocabulary gate: `scripts/authority-dom-vocabulary-scan.mjs`
- Doctrine-regression gate: `scripts/authority-doctrine-regression-check.mjs`
