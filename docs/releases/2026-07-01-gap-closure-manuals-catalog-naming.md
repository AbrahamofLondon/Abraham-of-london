# 2026-07-01 — Gap Closure: manuals, catalog, naming, dependencies, scripts

Branch: `gap-closure/manuals-catalog-stripe-swc-scripts`

Documentation-and-truth-alignment pass closing gaps identified in the Comprehensive Read-Only Gap Analysis. No commercial activation and no deployment performed; Netlify/main remains the deployment path.

## Manual version alignment
- **Engineering Manual** → v3.2 (date/effective/next-review synced). Corrected test count to the verified **427 test files / 6,000+ tests** (was "36 test files, 251 tests"). Reclassified **Boardroom Mode** and **Case Study Pipeline** from "Built, untested" to **Production** with test-file evidence. Documented **North Star Metrics**, **System Integrity Mode (kill switch)**, and **Founder Dashboard** (new "Operational Intelligence" subsection). Corrected **Sentry** status to: wired (client/server config + instrumentation hook), safe no-op without DSN, not enabled until `SENTRY_DSN` configured.
- **Institutional Manual** → v2.2. Replaced the stale §20.3 product catalog with current reality from `lib/commercial/catalog.ts`, added a plain-English "How to read the catalog" status legend, and refreshed the abridged Appendix A code map (GMI Q1→Q2, duplicate/inactive reporting products, retainers marked pending Stripe).

## Product catalog alignment
- §20.3 and Appendix A now distinguish **active-paid / active-free / active-enquiry / active-contracted / active-evidence-gated / inactive / pending-Stripe-IDs**.
- **Inner Circle**: accurately described as inactive (infrastructure-ready).
- **Retainers (CORE/OPERATIONAL/INSTITUTIONAL)**: accurately described as inactive — pending Stripe product and price IDs.

## Decision Authority naming reconciliation
- Documentation now uses **"Decision Authority system"** consistently (Institutional Manual prose updated; the implementation function `deriveDecisionDirective()` in `lib/diagnostics/decision-authority.ts` is described as an implementation detail of that system). **No code symbols renamed.** One code/UI output string (`title: "Decision Directive: …"` in `lib/research/engines/strategy-room-adapter.ts`) was left unchanged and is reported, not modified.

## Next / SWC alignment
- **NO ACTION REQUIRED.** `package.json` (`next@16.2.0`), `pnpm-lock.yaml` (`next@16.2.0`), and all `@next/swc-*@16.2.0` entries are already aligned. The 16.2.9 target applies only if drift remains; there is none.

## Retainer catalog readiness
- Retainers left **inactive** (no real Stripe IDs; `STRIPE_SECRET_KEY` is live-mode; activation is an owner-approved decision). Added `docs/commercial/retainer-stripe-activation-checklist.md` and strengthened the retainer block comment in `catalog.ts`.

## Scripts TypeScript cleanup
- `scripts/generate-premium-pdfs.tsx`: fixed two real TS errors (`Page size` prop typing; `Canvas` paint callback must return `null`). Note: `scripts/**` is **excluded from the main `tsconfig.json` by design**, so `pnpm typecheck` does not cover it; validated via a direct `tsc` compile of the file.
