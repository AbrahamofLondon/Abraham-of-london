# ProductAuthorityContract Surface Integration Guide

## Overview

This guide shows how to wire ProductAuthorityContract and related components into product routes so that users see evidence-governed authority in the live experience.

## Core Pattern

Every route that displays a product needs to:

1. **Resolve** the product's authority contract
2. **Display** the authority state
3. **Show** evidence status
4. **Explain** limitations
5. **Indicate** next action

## Integration Pattern

### Step 1: Import Components and Resolver

```typescript
import { ProductAuthorityBadge } from "@/components/product/ProductAuthorityBadge";
import { ProductAuthorityPanel } from "@/components/product/ProductAuthorityPanel";
import { ProductEvidenceStatus } from "@/components/product/ProductEvidenceStatus";
import { ProductAuthorityNotice } from "@/components/product/ProductAuthorityNotice";
import { resolveProductAuthority } from "@/lib/product/resolve-product-authority";
```

### Step 2: Resolve Product Authority

At the top of your component or page:

```typescript
// Resolve authority for a specific product
const productContract = resolveProductAuthority({
  productCode: "fast_diagnostic",
  hasValidV2Evidence: true,
  v2EvidencePath: "reports/product-value-evidence-ledger-v2.json",
  validationResults: {
    antiToyPassed: true,
    redTeamPassed: true,
    genericAiComparisonPassed: true,
    marketComparisonPassed: true,
    releaseFirewallPassed: true,
    constitutionPassed: true,
    noMockAuthorityPassed: true,
    antiGamingPassed: true,
    adversarialValidationPassed: true,
  },
  boundary: {
    productChangedThisPass: false,
    scorerChangedThisPass: false,
    scenarioChangedThisPass: false,
    benchmarkChangedThisPass: false,
    validationInfrastructureChangedThisPass: false,
    gateLogicChangedThisPass: false,
    mockAuthorityUsed: false,
  },
});
```

### Step 3: Display Authority Status

In your JSX, display the authority badge:

```typescript
<ProductAuthorityBadge 
  productCode={productContract.productCode}
  currentAuthorityState={productContract.currentAuthorityState}
  size="medium"
/>
```

### Step 4: Show Full Authority Details (Optional but Recommended)

For public-facing product pages:

```typescript
<ProductAuthorityPanel contract={productContract} />
```

For admin/control pages:

```typescript
<div>
  <ProductAuthorityPanel contract={productContract} expanded={true} />
  <ProductEvidenceStatus contract={productContract} />
</div>
```

### Step 5: Show Limitations and Next Action

Always include if authority is limited:

```typescript
{productContract.blockingReasons.length > 0 && (
  <ProductAuthorityNotice contract={productContract} />
)}
```

## Product-Specific Guidance

### fast_diagnostic (externally_proven_gold_product)

**Location:** `/foundry/decision-test`, `/diagnostics/fast`

**What to show:**
- Authority Badge: Green, "Externally Proven"
- Authority Panel: Full details with evidence source
- Evidence Status: All tests passed
- Public Claim: "Externally proven under v2 evidence validation"
- No blocking notice needed (no blocking reasons)

**Integration points:**
1. Entry page (`/foundry/start`) — Show v2 authority upfront
2. Form page (`/foundry/decision-test`) — Show "This uses externally proven fast diagnostic"
3. Results page (`/foundry/decision-test` result) — Full authority panel

### team_assessment (legacy_validated_pending_v2_revalidation)

**Location:** `/team-assessment`, any team assessment route

**What to show:**
- Authority Badge: Orange, "Legacy Pending v2"
- Authority Panel: With blocking reason
- Public Claim: "Legacy validated; pending v2 revalidation"
- Blocking Notice: Shows pending v2 requirement
- Next Action: "Run v2 revalidation to upgrade from legacy status"

**Integration points:**
1. Product page — Show legacy status clearly
2. Entry page — Explain pending status
3. Results (if available) — Show why full authority not granted

### enterprise_assessment (legacy_validated_pending_v2_revalidation)

**Same pattern as team_assessment**

**Location:** `/enterprise-assessment`, any enterprise assessment route

### personal_decision_audit (blocked_until_claim_evidenced)

**Location:** Any personal_decision_audit route

**What to show:**
- Authority Badge: Red, "Blocked"
- Authority Panel: With blocking reasons
- Public Claim: "Under validation; not currently released as an evidenced diagnostic product"
- Blocking Notice: Mandatory, shows blocking reasons
- Next Action: "Generate Evidence Ledger v2 with frozen scenarios and validation tests"

**Integration points:**
1. Entry page — Show blocked status, explain why
2. Any result surface — Show blocked status, don't claim authority
3. Admin surfaces — Show full blocking detail

## Code Examples

### Example 1: Fast Diagnostic Entry Page Enhancement

```typescript
// pages/foundry/start.tsx or equivalent

import React from 'react'
import { ProductAuthorityBadge } from "@/components/product/ProductAuthorityBadge";
import { resolveProductAuthority } from "@/lib/product/resolve-product-authority";
import { getDefaultProductConfigurations } from "@/lib/product/resolve-product-authority";

export default function FastDiagnosticEntryPage() {
  // Get fast_diagnostic configuration from defaults
  const configs = getDefaultProductConfigurations();
  const fastDiagConfig = configs.find(c => c.productCode === "fast_diagnostic");
  
  const contract = resolveProductAuthority(fastDiagConfig);

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1>Fast Diagnostic</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
          <ProductAuthorityBadge 
            productCode="fast_diagnostic"
            currentAuthorityState={contract.currentAuthorityState}
          />
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            {contract.publicClaimLanguage}
          </p>
        </div>
      </div>

      {/* Rest of page content */}
    </div>
  );
}
```

### Example 2: Legacy Product Page

```typescript
// pages/team-assessment.tsx or equivalent

import React from 'react'
import { ProductAuthorityBadge } from "@/components/product/ProductAuthorityBadge";
import { ProductAuthorityPanel } from "@/components/product/ProductAuthorityPanel";
import { ProductAuthorityNotice } from "@/components/product/ProductAuthorityNotice";
import { resolveProductAuthority } from "@/lib/product/resolve-product-authority";
import { getDefaultProductConfigurations } from "@/lib/product/resolve-product-authority";

export default function TeamAssessmentPage() {
  const configs = getDefaultProductConfigurations();
  const config = configs.find(c => c.productCode === "team_assessment");
  
  const contract = resolveProductAuthority(config);

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1>Team Assessment</h1>
        <ProductAuthorityBadge 
          productCode="team_assessment"
          currentAuthorityState={contract.currentAuthorityState}
          size="medium"
        />
      </div>

      <ProductAuthorityPanel contract={contract} />
      <ProductAuthorityNotice contract={contract} />

      {/* Rest of page content */}
    </div>
  );
}
```

### Example 3: Admin Control Room

```typescript
// pages/admin/control-room.tsx or equivalent

import React from 'react'
import { ProductAuthorityPanel } from "@/components/product/ProductAuthorityPanel";
import { ProductEvidenceStatus } from "@/components/product/ProductEvidenceStatus";
import { resolveProductAuthority } from "@/lib/product/resolve-product-authority";
import { getDefaultProductConfigurations } from "@/lib/product/resolve-product-authority";

export default function AdminControlRoom() {
  const configs = getDefaultProductConfigurations();
  
  return (
    <div>
      <h1>Product Authority Control Room</h1>
      
      {configs.map(config => {
        const contract = resolveProductAuthority(config);
        return (
          <div key={config.productCode} style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid #e5e7eb" }}>
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

## Integration Checklist

For each route being integrated:

- [ ] Import ProductAuthorityContract components
- [ ] Import resolveProductAuthority
- [ ] Call resolveProductAuthority with product configuration
- [ ] Display ProductAuthorityBadge in main heading area
- [ ] Display ProductAuthorityPanel (or summary) on page
- [ ] Display ProductAuthorityNotice if blockingReasons exist
- [ ] Use contract.publicClaimLanguage, not hardcoded strings
- [ ] Verify no unsupported authority language
- [ ] Test that components render correctly
- [ ] Run TypeScript compiler to check for errors

## Common Mistakes to Avoid

❌ **Don't:** Hardcode authority state
```typescript
// WRONG
const authorityState = "externally_proven_gold_product";
```

✅ **Do:** Resolve from contract
```typescript
// CORRECT
const contract = resolveProductAuthority(productConfig);
const authorityState = contract.currentAuthorityState;
```

---

❌ **Don't:** Use unsupported authority language
```typescript
// WRONG
"Fast Diagnostic is a proven tool for decision authority."
```

✅ **Do:** Use contract-derived language
```typescript
// CORRECT
contract.publicClaimLanguage // "fast_diagnostic is externally proven under v2 evidence validation."
```

---

❌ **Don't:** Hide blocking reasons
```typescript
// WRONG
if (contract.blockingReasons.length > 0) {
  return null; // Hide the product
}
```

✅ **Do:** Show blocking reasons visibly
```typescript
// CORRECT
<ProductAuthorityNotice contract={contract} />
```

---

## Testing Your Integration

After wiring a route:

1. **Visual Check:** Does the authority badge render?
2. **Language Check:** Is the public claim language from the contract, not hardcoded?
3. **Limitation Check:** Are blocking reasons visible (if any exist)?
4. **Link Check:** Do evidence location links work (if present)?
5. **TypeScript Check:** `pnpm exec tsc --noEmit` — does it pass?

## Running the Route Proof Audit

After integration, run:

```bash
node scripts/capture-category-route-proof.mjs
```

**Expected results after integration:**
- Routes demonstrating: ≥3
- Authority visible: ≥3
- Evidence visible: ≥3
- Limitations clear: ≥2
- Overclaims: 0

## Questions?

Refer to:
- Component implementations: `components/product/ProductAuthority*.tsx`
- Resolver logic: `lib/product/resolve-product-authority.ts`
- Validation: `scripts/capture-category-route-proof.mjs`
