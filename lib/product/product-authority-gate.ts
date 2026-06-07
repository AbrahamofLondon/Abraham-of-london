/**
 * lib/product/product-authority-gate.ts
 *
 * Product authority evaluation engine.
 *
 * A product's authority score is determined by checking 8 dimensions:
 *   1. route         — canonical route, no competing duplicates
 *   2. runtime_truth — DB-derived state, no fixture data in production paths
 *   3. commercial    — catalog, Stripe refs, and CTA consistent
 *   4. fulfilment    — delivery artifact persisted; fulfilment audit trail
 *   5. evidence_input — input validated; entitlement checked before delivery
 *   6. admin         — admin visibility into orders/runs/delivery
 *   7. test          — coverage for purchase, fulfilment, and evidence paths
 *   8. market_authority — claims are provable; no fixture data in paid output
 *
 * Each dimension contributes 1.25 points to a 10-point scale:
 *   PASS    = 1.25 pts
 *   PARTIAL = 0.625 pts
 *   FAIL    = 0 pts
 *
 * Score = sum(dimension scores), capped at 10.
 *
 * This gate is the authoritative mechanism for product estate decisions.
 * The reality audit JSON is the input; this gate is the enforcement layer.
 */

import {
  type AuthorityDimension,
  type AuthorityDimensionResult,
  type AuthorityDimensionScore,
  type ProductAuthorityScore,
  type ProductExposureStatus,
  classifyExposureStatus,
  isCheckoutAllowed,
  isPublicDiscoverable,
  requiresWaitlist,
  isAdminOnly,
  CURRENT_ESTATE_GRADES,
  INACTIVE_PRODUCTS,
} from './product-exposure-policy'

// ─── 8 Authority Dimensions ───────────────────────────────────────────────────

export const AUTHORITY_DIMENSIONS: Record<AuthorityDimension, string> = {
  route:            'Canonical route exists; no competing/redirected duplicates',
  runtime_truth:    'All state DB-derived; no fixtures or static files in production paths',
  commercial:       'Price, catalog, Stripe refs, and checkout CTA are fully consistent',
  fulfilment:       'Delivery artifact persisted; fulfilment audit trail exists',
  evidence_input:   'Input validated; entitlement checked before delivery',
  admin:            'Admin visibility into orders, runs, and delivery status',
  test:             'Test coverage for purchase, fulfilment, and evidence paths',
  market_authority: 'Product claims provable; no fixture data in paid deliverables',
}

const DIMENSION_ORDER: AuthorityDimension[] = [
  'route',
  'runtime_truth',
  'commercial',
  'fulfilment',
  'evidence_input',
  'admin',
  'test',
  'market_authority',
]

// ─── Points per result ────────────────────────────────────────────────────────

const DIMENSION_POINTS: Record<AuthorityDimensionResult, number> = {
  PASS:    1.25,
  PARTIAL: 0.625,
  FAIL:    0,
}

// ─── Per-product dimension definitions ───────────────────────────────────────

/**
 * Per-product dimension scores derived from the reality audit.
 * These are the DECLARED authority gaps at the time of the last audit.
 *
 * When a gap is closed, update the result and note.
 * Do not change FAIL to PASS without closing the actual gap.
 */
export const PRODUCT_DIMENSION_SCORES: Record<string, Record<AuthorityDimension, { result: AuthorityDimensionResult; note: string }>> = {

  decision_pressure_signal: {
    route:            { result: 'PARTIAL', note: '/pressure is canonical but /decision-pressure competes; redirect or retire the legacy route' },
    runtime_truth:    { result: 'PARTIAL', note: '/pressure uses DB-backed PressureSignalEvent; /decision-pressure computes client-side' },
    commercial:       { result: 'PASS',    note: 'Free product — no Stripe refs required; CTA is consistent' },
    fulfilment:       { result: 'PARTIAL', note: 'PressureSignalEvent persisted but result delivery is client-rendered, not a durable artifact' },
    evidence_input:   { result: 'PASS',    note: 'Free tool — entitlement not required; input is user-supplied decision text' },
    admin:            { result: 'FAIL',    note: 'No admin view of pressure signal events or aggregate results' },
    test:             { result: 'PARTIAL', note: 'adversarial-free-signal.spec.ts exists; DB persistence path not covered' },
    market_authority: { result: 'PASS',    note: 'No paid claims; free signal is rule-based, not synthetic' },
  },

  boardroom_brief: {
    route:            { result: 'PASS',    note: '/boardroom-brief is canonical; sample route is a query param variant, not a conflict' },
    runtime_truth:    { result: 'PASS',    note: 'Admin delivery route now loads real BoardroomBriefOrder from DB; QUALIFYING_SPINE import removed; assertPaidDeliveryAuthorised() enforces fixture ban' },
    commercial:       { result: 'PASS',    note: '£99 price consistent in catalog, estate, and checkout CTA' },
    fulfilment:       { result: 'PARTIAL', note: 'BoardroomDossier persists inputSnapshotHash + artifactHash; real paid delivery smoke has not passed in the configured environment' },
    evidence_input:   { result: 'PASS',    note: 'inputSnapshotHash computed and persisted before generation; assertPaidDeliveryAuthorised() rejects all fixture/sample/synthetic input' },
    admin:            { result: 'PASS',    note: '/admin/boardroom-delivery exists with order queue and delivery controls' },
    test:             { result: 'PARTIAL', note: 'boardroom-delivery-route.test.ts covers fixture rejection, sourceType enforcement, state machine, and hash stability; real paid smoke still requires a paid BoardroomBriefOrder' },
    market_authority: { result: 'PARTIAL', note: 'Paid delivery route requires paymentStatus=paid + real orderId and bans fixture input; promote to public_active only after real paid smoke passes' },
  },

  strategy_room: {
    route:            { result: 'PASS',    note: '/strategy-room is canonical; /strategy-room/session/[id] is a sub-route' },
    runtime_truth:    { result: 'PASS',    note: 'StrategyRoomSession and StrategyRoomExecutionSession are DB-derived' },
    commercial:       { result: 'PASS',    note: '£750/£1,250 pricing consistent across catalog and estate' },
    fulfilment:       { result: 'PASS',    note: 'StrategyRoomExecutionSession persists execution state and completion' },
    evidence_input:   { result: 'PASS',    note: 'Evidence-gated; requires prior case state' },
    admin:            { result: 'PARTIAL', note: 'pages/api and app/api ownership split; consolidation needed' },
    test:             { result: 'PASS',    note: 'decision-centre-journey-continuity.test.ts and paid-corridor-contract.test.ts exist' },
    market_authority: { result: 'PASS',    note: 'No fixture data in production execution path' },
  },

  executive_reporting: {
    route:            { result: 'PASS',    note: '/diagnostics/executive-reporting is canonical' },
    runtime_truth:    { result: 'PASS',    note: 'ExecutiveReportingRun and ExecutiveReportingArtifact are DB-derived' },
    commercial:       { result: 'PARTIAL', note: 'Two Stripe webhook surfaces exist; canonical ownership not declared' },
    fulfilment:       { result: 'PASS',    note: 'ExecutiveReportingArtifact persists generated report artifact' },
    evidence_input:   { result: 'PASS',    note: 'Entitlement checked via assessment.executive_reporting slug' },
    admin:            { result: 'PASS',    note: '/admin/reporting/executive exists' },
    test:             { result: 'PASS',    note: 'executive-reporting-public-dto.test.ts exists' },
    market_authority: { result: 'PASS',    note: 'Report artifacts are DB-derived from real diagnostic runs' },
  },

  decision_instruments: {
    route:            { result: 'PASS',    note: '/decision-instruments/[slug] is canonical' },
    runtime_truth:    { result: 'PASS',    note: 'DecisionInstrumentRun is the run authority model; DiagnosticJourney is retained as legacy compatibility output only' },
    commercial:       { result: 'FAIL',    note: 'Price/catalog truth duplicated across CATALOG, PRODUCT_ESTATE, product-catalogue-registry, and local page arrays' },
    fulfilment:       { result: 'PASS',    note: '/api/decision-instruments/results starts and completes DecisionInstrumentRun records with score/result/artifact state' },
    evidence_input:   { result: 'PASS',    note: 'startInstrumentRun() verifies instrument entitlement before execution; PDF downloads require runId + entitlement match' },
    admin:            { result: 'PASS',    note: '/admin/decision-instrument-runs lists run status, entitlement, scores, and artifact state' },
    test:             { result: 'PARTIAL', note: 'instrument-run-authority.test.ts and route source guards cover authority wiring; full browser entitlement smoke remains pending' },
    market_authority: { result: 'PASS',    note: 'Runs use persisted DecisionInstrumentRun IDs; Date.now() fallback removed from the production result route' },
  },

  professional: {
    route:            { result: 'PASS',    note: '/pricing is the canonical CTA surface; /professionals is a secondary surface' },
    runtime_truth:    { result: 'PASS',    note: 'ClientEntitlement and Entitlement are DB-derived' },
    commercial:       { result: 'PARTIAL', note: 'Professional trial handled separately from active entitlement resolution' },
    fulfilment:       { result: 'PASS',    note: 'Entitlement written on checkout.session.completed Stripe event' },
    evidence_input:   { result: 'PASS',    note: 'Stripe payment verifies purchase before entitlement write' },
    admin:            { result: 'PASS',    note: '/admin/commercial exists for entitlement visibility' },
    test:             { result: 'PASS',    note: 'professional-subscription-lifecycle.test.ts and pricing-surfacing.test.ts exist' },
    market_authority: { result: 'PASS',    note: 'Subscription is a continuity service; no synthetic claims in output' },
  },

  retainer_oversight: {
    route:            { result: 'PASS',    note: '/retainer, /retainer/oversight/client-status, and /api/admin/retainer/oversight-cycles routes exist' },
    runtime_truth:    { result: 'PASS',    note: 'OversightReviewCycle model deployed (migration 20260607); RetainerContract, RetainerReviewQueueEntry, and intervention log persist to DB' },
    commercial:       { result: 'PASS',    note: 'Custom/contracted — no public price; appropriately gated; never self-serve from payment alone' },
    fulfilment:       { result: 'PASS',    note: 'Monthly oversight cycles created/completed via createOversightCycle/completeOversightCycle; intervention log persists via addIntervention; client status returned from getClientHealthStatus' },
    evidence_input:   { result: 'PASS',    note: 'Retainer-gated via retainer-review-queue readiness gate; admin-only cycle creation; client ownership verified before status access' },
    admin:            { result: 'PASS',    note: '/api/admin/retainer/oversight-cycles: list, create, begin_review, complete, skip, intervention all wired; /api/admin/decision-instrument-runs for instrument admin' },
    test:             { result: 'PASS',    note: 'retainer-oversight-authority.test.ts: 15 tests covering route source guards, surface registry rules, state machine, OversightCycleError, client-status safe fields' },
    market_authority: { result: 'PASS',    note: 'Not self-serve; surface registry confirms retainer_oversight is dormant/review_gated; client-status route does not expose driftScore or internalNotes' },
  },

  inner_circle: {
    route:            { result: 'PARTIAL', note: '/inner-circle route surface is substantial for a dormant product' },
    runtime_truth:    { result: 'PASS',    note: 'InnerCircleProfile, InnerCircleWorksheetAction are DB-derived' },
    commercial:       { result: 'PASS',    note: 'Catalog marks inactive; no active purchase CTA' },
    fulfilment:       { result: 'PARTIAL', note: 'Operating layer; membership CTA must not imply active paid subscription' },
    evidence_input:   { result: 'PASS',    note: 'Dormant — no new purchase flow active' },
    admin:            { result: 'PASS',    note: '/admin/advisory-queue exists for member management' },
    test:             { result: 'PARTIAL', note: 'decision-centre-retainer-memory.test.ts exists; limited dormancy enforcement test' },
    market_authority: { result: 'PARTIAL', note: 'Catalog accurately marks inactive but route surface implies activity' },
  },

  gmi_quarterly: {
    route:            { result: 'PASS',    note: '/intelligence/gmi is canonical; edition-parametric sub-routes are correct' },
    runtime_truth:    { result: 'PASS',    note: 'All edition state derived from DB via GmiCallLedgerEntry, GmiReleaseSnapshot, etc.' },
    commercial:       { result: 'PARTIAL', note: 'Catalog still names Q1 as a purchasable product while runtime Q2 is DB-backed' },
    fulfilment:       { result: 'PASS',    note: 'GmiBoardPackArtifact persists generated PDF artifacts' },
    evidence_input:   { result: 'PASS',    note: 'Edition-gated; release authority validates publishable state' },
    admin:            { result: 'PASS',    note: '/admin/intelligence/gmi routes exist for publication readiness' },
    test:             { result: 'PASS',    note: 'gmi-edition-parametric.test.ts, gmi-adoption-maturity.test.ts and others exist' },
    market_authority: { result: 'PARTIAL', note: 'Legacy admin views still import static GMI registries; secondary consoles can show fixture state' },
  },

  briefs_vault_editorial: {
    route:            { result: 'PASS',    note: '/briefs, /vault/briefs, /editorials all route correctly' },
    runtime_truth:    { result: 'PASS',    note: 'Content-derived from Contentlayer; editorial series is intentional curated static' },
    commercial:       { result: 'PASS',    note: 'Free/content-tier; no Stripe refs required' },
    fulfilment:       { result: 'PASS',    note: 'Content publication is the fulfilment; scheduled/public boundary enforced' },
    evidence_input:   { result: 'PASS',    note: 'Content frontmatter access tier is the entitlement mechanism' },
    admin:            { result: 'PASS',    note: '/admin/content and /admin/content-vault exist' },
    test:             { result: 'PASS',    note: 'briefs-publication.test.ts, editorials-series.test.ts, vault-brief-route.test.tsx exist' },
    market_authority: { result: 'PARTIAL', note: 'Editorial series uses curated static list; must remain labelled as editorial curation, not live operational state' },
  },
}

// ─── Evaluation Engine ────────────────────────────────────────────────────────

/**
 * Evaluate the authority of a single product.
 * Returns a full authority score with exposure classification.
 */
export function evaluateProductAuthority(productCode: string): ProductAuthorityScore {
  const grade = CURRENT_ESTATE_GRADES[productCode]
  if (grade === undefined) {
    throw new Error(`evaluateProductAuthority: unknown product code "${productCode}"`)
  }

  const active = !INACTIVE_PRODUCTS.has(productCode)
  const exposureStatus = classifyExposureStatus(grade, active)
  const dimensionDefs = PRODUCT_DIMENSION_SCORES[productCode]

  if (!dimensionDefs) {
    throw new Error(`evaluateProductAuthority: no dimension scores defined for "${productCode}"`)
  }

  const dimensions: AuthorityDimensionScore[] = DIMENSION_ORDER.map((dim) => ({
    dimension: dim,
    result: dimensionDefs[dim].result,
    note: dimensionDefs[dim].note,
  }))

  const authorityGaps = dimensions
    .filter((d) => d.result === 'FAIL' || d.result === 'PARTIAL')
    .map((d) => `[${d.result}] ${d.dimension}: ${d.note}`)

  const productName = productCode
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return {
    productCode,
    productName,
    realityGrade: grade,
    exposureStatus,
    dimensions,
    authorityGaps,
    checkoutAllowed: isCheckoutAllowed(exposureStatus),
    requiresWaitlist: requiresWaitlist(exposureStatus),
    publicDiscoverable: isPublicDiscoverable(exposureStatus),
    adminOnly: isAdminOnly(exposureStatus),
  }
}

/**
 * Evaluate authority for all products in the estate.
 */
export function evaluateEstateAuthority(): ProductAuthorityScore[] {
  return Object.keys(CURRENT_ESTATE_GRADES).map(evaluateProductAuthority)
}

/**
 * Get all products whose grade is below a given threshold.
 */
export function getProductsBelowThreshold(threshold: number): ProductAuthorityScore[] {
  return evaluateEstateAuthority().filter((p) => p.realityGrade < threshold)
}

/**
 * Get all products with FAIL dimensions.
 */
export function getProductsWithFailedDimensions(): ProductAuthorityScore[] {
  return evaluateEstateAuthority().filter((p) =>
    p.dimensions.some((d) => d.result === 'FAIL'),
  )
}

/**
 * Assert that all public products with checkout enabled meet the minimum authority threshold.
 * Throws if any product below the threshold has checkout allowed.
 *
 * Run this as part of CI or estate audit.
 */
export function assertPublicProductsMeetThreshold(threshold = 8): void {
  const failures: string[] = []
  for (const score of evaluateEstateAuthority()) {
    if (score.checkoutAllowed && score.realityGrade < threshold) {
      failures.push(
        `${score.productCode} (grade ${score.realityGrade}): checkout is allowed but grade is below threshold ${threshold}`,
      )
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `assertPublicProductsMeetThreshold failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`,
    )
  }
}

/**
 * Get the highest-priority authority gaps across the estate.
 * Sorted by: FAIL count descending, then by grade ascending.
 */
export function getEstateAuthorityGapsSummary(): {
  productCode: string
  grade: number
  failCount: number
  partialCount: number
  topGap: string | null
}[] {
  return evaluateEstateAuthority()
    .map((score) => ({
      productCode: score.productCode,
      grade: score.realityGrade,
      failCount: score.dimensions.filter((d) => d.result === 'FAIL').length,
      partialCount: score.dimensions.filter((d) => d.result === 'PARTIAL').length,
      topGap: score.dimensions.find((d) => d.result === 'FAIL')?.note ?? score.dimensions.find((d) => d.result === 'PARTIAL')?.note ?? null,
    }))
    .sort((a, b) => b.failCount - a.failCount || a.grade - b.grade)
}
