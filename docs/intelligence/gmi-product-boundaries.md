# GMI Product Boundaries

**Effective:** 2026-06-07  
**Status:** Canonical  
**Scope:** Global Market Intelligence product line

---

## Native Mobile App — Rejected

**Decision: No native mobile app. Permanently out of scope.**

B2B intelligence buyers need:
- Trust and editorial credibility
- Board-ready PDF with provenance
- Admin workflow and release authority
- Falsification register and public accountability
- Client API for programmatic access

They do not need app-store presence.

A native mobile app would add distribution cost, app review risk, platform dependency, and maintenance overhead with no corresponding increase in institutional trust or decision-grade value delivery.

**Responsive web is sufficient.** The GMI product is consumed in board contexts, strategy meetings, and professional research sessions — not on a phone in transit.

**This decision is not deferred. It is permanently rejected.** If this decision is revisited in future, it must be justified by documented institutional demand, not product theatre.

---

## Live Feed Theatre — Rejected

**Decision: No Bloomberg live ingestion. No Reuters live ingestion. No real-time UI chrome without real-time data.**

Specifically rejected:
- Live Bloomberg terminal integration
- Reuters market signal streaming
- Automated evidence ingestion pipelines (paid)
- Any public copy using "real-time", "live market feed", or "Reuters-powered" without the underlying capability being active

Integration contracts (interfaces) exist in `lib/intelligence/gmi-integrations/types.ts`. Bloomberg and Reuters providers are stubs that throw `IntegrationDisabledError`. The `LIVE_FEED_ENABLED` constant is `false`.

When a real licensed feed is connected, the interface already defines the contract. The stubs will be replaced by live adapters — no architectural redesign required.

Until then: no fake live-feed theatre. No "automated" language. Manual evidence snapshots only.

---

## Features Deferred (Not Rejected)

These features have durable data foundations. They are not built, but they are not permanently rejected either.

### Client API Monetisation
- Foundation routes exist: `/api/gmi/editions`, `/api/gmi/calls`, `/api/gmi/performance`, `/api/gmi/falsification`, `/api/gmi/board-pulse`
- Rate limiting headers are in place
- **Deferred:** API key authentication, pricing, and client dashboard
- **Activate when:** documented demand from institutional buyers exists

### Email / Webhook Alert Delivery
- Alert rule model (`GmiAlertRule`) is in schema
- `EMAIL_DELIVERY_ENABLED = false`, `WEBHOOK_DELIVERY_ENABLED = false`
- Dashboard-only mode is active
- **Deferred:** SMTP configuration, webhook endpoint verification
- **Activate when:** at least one active Inner Circle member requests it

### Scenario Explorer UI
- `GmiScenarioModel` is in schema
- `GMI_SCENARIO_EXPLORER_ENABLED = false` feature flag gates the public route
- **Deferred:** public-facing explorer interface
- **Activate when:** at least 3 real scenario models are authored and reviewed

### Competitive Benchmark Claims
- `GmiBenchmarkEntry` model is in schema
- `canShowBenchmarkClaims(editionId)` gates claims on actual data
- **Deferred:** any public "we beat consensus" language
- **Activate when:** at least one verified benchmark row with actual vs. GMI value exists

---

## Features Active

These are live and publicly verified:

| Feature | Status | Route |
|---------|--------|-------|
| Manual evidence dashboard | Active | `/intelligence/gmi` |
| Board-pack PDF | Active | `/api/gmi/board-pack?edition=GMI-Q2-2026&format=pdf` |
| Falsification register | Active | `/intelligence/gmi/falsification` |
| Operator brief | Active | `/intelligence/gmi/operator-brief` |
| Public performance page | Active | `/intelligence/gmi/performance` |
| Public call ledger | Active | `/intelligence/gmi/calls` |
| Board Pulse | Active | `/intelligence/gmi/board-pulse` |
| Q2-2026 edition landing | Active | `/intelligence/gmi/q2-2026` |

---

## Summary

| Category | Decision |
|----------|----------|
| Native mobile app | **Rejected** |
| Bloomberg live ingestion | **Rejected (stub only)** |
| Reuters live ingestion | **Rejected (stub only)** |
| Real-time copy claims | **Rejected** |
| Client API monetisation | Deferred — foundation exists |
| Email/webhook alerts | Deferred — foundation exists |
| Scenario explorer UI | Deferred — feature-flagged |
| Competitive benchmark claims | Deferred — gated on data |
