# Report Lineage Simulation

## Purpose

Report Lineage Simulation is the first runtime proof of the governed product operating architecture. It proves that the Pass 1 registries can generate, validate, simulate, and expose expected governance flows across the product ladder.

The goal is not just to display lineage chains. The goal is to answer: **When this product event happens, what record exists, who owns it, what audit event is required, what lineage event is required, what Foundry module tests it, and what happens if the chain is incomplete?**

## Chain Definitions

Seven lineage chains are defined:

| Chain ID | Title | Events |
|---|---|---|
| `executive-reporting` | Executive Reporting Lifecycle | 5 events: STARTED → GENERATED → REVIEWED → EXPORTED → REVOKED |
| `executive-report-boardroom` | ER → Boardroom Escalation | 5 events: GENERATED → MAPPED → QUALIFIED → PREVIEWED → EXPORTED |
| `strategy-room` | Strategy Room Case Lifecycle | 5 events: OPENED → REVIEWED → DIRECTIVE → ESCALATION → ACTION |
| `outbound-publishing` | Outbound Publishing Lifecycle | 6 events: DRAFT → POLICY → APPROVED → PUBLISHED → SYNCED → FAILED |
| `foundry-research-run` | Foundry ResearchRun Lifecycle | 6 events: CREATED → FINDING → BRIEF → ACTION → IMPLEMENTED → ARCHIVED |
| `content-editorial` | Content / Editorial Lifecycle | 5 events: CREATED → STYLE → METADATA → PUBLISHED → OUTBOUND |
| `gmi-release` | GMI Release Lifecycle | 6 events: DRAFTED → REVIEWED → GATE → APPROVED → PUBLISHED → CARRIED |

## Registry Validation

Each chain event validates against four registries:

1. **product-ladder-registry.ts** — Does the source surface exist?
2. **canonical-record-registry.ts** — Does the canonical record exist?
3. **admin-domain-registry.ts** — Does the admin owner route exist?
4. **governance-event-types.ts** — Does the governance event exist?

If any registry link is missing, a source-backed gap is created.

## How Gaps Become Findings

| Gap Severity | Action |
|---|---|
| CRITICAL | Chain marked BROKEN. Finding created. ResearchRun recommended. |
| HIGH | Finding created. ResearchRun recommended. |
| MEDIUM | Gap recorded. No finding (informational). |
| LOW | Gap recorded. No finding (informational). |

## How ResearchRuns Are Created

When `createResearchRun=true` is passed to the API and findings exist:
1. A ResearchRun is created through ResearchRunRepository
2. Each HIGH/CRITICAL gap becomes a FoundryFinding through FindingRepository
3. The ResearchRun is linked to the lineage simulation chain

## How This Prepares Governance Event Bus Wiring

The lineage simulation validates that every event in every chain has a corresponding entry in `governance-event-types.ts`. This ensures that when the real governance event bus is wired:

- Every event has a known shape
- Every event has audit/lineage expectations
- Every event has a source surface and canonical record
- No subsystem invents its own event vocabulary

## Vocabulary Closure (Pass 3A)

All governance event vocabulary gaps identified by Pass 2 have been closed:

| Chain | Before | After |
|---|---|---|
| ER → Boardroom | PARTIAL (missing BOARDROOM_DOSSIER_PREVIEWED, BOARDROOM_DOSSIER_EXPORTED_SIMULATED) | **COMPLETE** |
| Content / Editorial | PARTIAL (missing CONTENT_ASSET_CREATED, CONTENT_STYLE_CHECKED, CONTENT_METADATA_VALIDATED, CONTENT_OUTBOUND_ELIGIBLE) | **COMPLETE** |
| GMI Release | PARTIAL (missing GMI_PRIOR_CALLS_REVIEWED, GMI_QUALITY_GATE_RUN, GMI_RELEASE_APPROVED, GMI_CALL_CARRIED_FORWARD) | **COMPLETE** |
| Foundry ResearchRun | PARTIAL (ACTION_REQUIRED collision with Strategy Room) | **COMPLETE** (now uses FOUNDRY_ACTION_REQUIRED) |

### Design Decisions

- **BOARDROOM_DOSSIER_PREVIEWED** and **BOARDROOM_DOSSIER_EXPORTED_SIMULATED** are clearly marked as dry-run simulation events. They do not imply real PDF export or client-facing artefacts.
- **CONTENT_OUTBOUND_ELIGIBLE** means the content has passed internal eligibility checks — it does not mean published to social.
- **GMI_PRIOR_CALLS_REVIEWED** preserves the canonical phrasing: "Every quarterly report reviews the material calls from the previous quarter before issuing the next one." It does not imply prediction certainty.
- **FOUNDRY_ACTION_REQUIRED** is distinct from Strategy Room's ACTION_REQUIRED to avoid semantic collision. Foundry actions relate to ResearchRun findings; Strategy Room actions relate to case directives.

## Known Limitations

1. ResearchRun creation is prepared but not fully wired to the database — the simulation page shows the intent.
2. Product Health Dashboard (Pass 4) will consume lineage coverage status but is not yet built.

## Next Pass: Real Event Bus Wiring

After this pass, the governance event bus should be wired to:
1. Write audit records when events are emitted
2. Write lineage records when events are emitted
3. Create ResearchRuns when events have `canCreateResearchRun=true`
4. Surface lineage coverage in the Product Health Dashboard
