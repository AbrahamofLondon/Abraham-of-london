/**
 * lib/product/product-surface-registry.ts
 *
 * Canonical surface-by-surface authority registry for Abraham of London.
 *
 * A "surface" is any named route, stage, console, instrument, or proof layer
 * that carries a buyer-facing promise, product role, CTA, or operational claim.
 *
 * No surface may hide inside a parent product category.
 * If it has a name, route, CTA, or buyer-facing role — it must have an authority grade.
 *
 * Scoring scale:
 *   10/10 = production-authoritative
 *    9/10 = market-ready with only minor non-critical gap
 *    8/10 = usable, public-limited scope
 *   6–7/10 = controlled access only
 *   <6/10  = hide / admin-only / retire
 */

// ─── Surface Types ────────────────────────────────────────────────────────────

export type SurfaceType =
  | 'product'           // Purchasable product with commercial CTA
  | 'corridor_stage'    // Named stage within the Operational Decision Corridor
  | 'diagnostic'        // Free or low-friction entry diagnostic
  | 'instrument'        // Governed paid instrument
  | 'proof_surface'     // Evidence/proof/verification surface
  | 'console'           // Case or session management console
  | 'evidence_layer'    // Evidence storage/display infrastructure
  | 'fulfilment_layer'  // Delivery fulfilment sub-surface
  | 'admin_surface'     // Operator/admin-only surface
  | 'dormant_surface'   // Inactive product surface (visible in admin only)
  | 'retired_surface'   // Decommissioned (no public surface, admin record only)

export type SurfaceFamily =
  | 'market_activation'
  | 'operational_corridor'
  | 'decision_instruments'
  | 'market_intelligence'
  | 'continuity_and_subscription'
  | 'advisory_and_oversight'
  | 'knowledge_and_content'
  | 'supporting_infrastructure'
  | 'admin'

export type SurfaceExposureStatus =
  | 'public_active'       // Grade ≥ 9: full commercial CTA, discoverable
  | 'public_limited'      // Grade 8: discoverable, checkout on, capability caveat
  | 'controlled_access'   // Grade 6–7: discoverable, checkout off/waitlisted
  | 'evidence_gated'      // Requires prior case state or evidence record
  | 'review_gated'        // Requires operator/admin review to access
  | 'admin_only'          // Not discoverable outside /admin
  | 'dormant'             // Inactive; admin-only record
  | 'hidden'              // Explicitly suppressed from all surfaces
  | 'retired'             // Decommissioned

// ─── Surface Record ───────────────────────────────────────────────────────────

export interface ProductSurface {
  surfaceId: string
  displayName: string
  family: SurfaceFamily
  surfaceType: SurfaceType
  route: string | null
  apiRoutes: string[]
  adminRoutes: string[]
  catalogProductCode: string | null
  entitlementSlug: string | null
  stripePriceId: string | null          // 'catalog' = defined in catalog.ts; null = none
  featureFlag: string | null
  requiresAuth: boolean
  acceptsPayment: boolean
  producesArtifact: boolean             // generates a persisted PDF, report, or dossier
  writesDatabase: boolean               // writes to Prisma models
  readsDatabase: boolean
  usesContent: boolean                  // reads from Contentlayer/MDX
  currentExposureStatus: SurfaceExposureStatus
  targetScore: number
  currentScore: number
  primaryCTA: string | null
  nextAdmissibleMove: string
  authorityGaps: string[]
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const PRODUCT_SURFACE_REGISTRY: ProductSurface[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKET ACTIVATION — Free / low-friction entry surfaces
  // ═══════════════════════════════════════════════════════════════════════════

  {
    surfaceId: 'decision_pressure_signal',
    displayName: 'Decision Pressure Signal',
    family: 'market_activation',
    surfaceType: 'diagnostic',
    route: '/pressure',
    apiRoutes: ['/api/pressure/signal'],
    adminRoutes: ['/admin/analytics'],
    catalogProductCode: 'decision_pressure_signal',
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: true,
    readsDatabase: false,
    usesContent: false,
    currentExposureStatus: 'public_active',
    targetScore: 10,
    currentScore: 9,
    primaryCTA: 'Run pressure signal',
    nextAdmissibleMove: 'Route pressure result to Boardroom Brief or Strategy Room based on band.',
    authorityGaps: [
      '[RESOLVED] route: /decision-pressure now permanently redirects to /pressure',
      '[RESOLVED] runtime_truth: /pressure uses DB-backed API with Zod validation, Upstash rate limiting',
      '[RESOLVED] admin: /admin/analytics shows pressure signal events, distribution, conversion rates',
      '[RESOLVED] test: operating-layer.test.ts covers evaluatePressureSignal; product-estate tests cover route smoke',
      '[PARTIAL] fulfilment: PressureSignalEvent persisted; result is client-rendered (acceptable for free diagnostic)',
    ],
  },

  {
    surfaceId: 'fast_diagnostic',
    displayName: 'Fast Diagnostic',
    family: 'market_activation',
    surfaceType: 'diagnostic',
    route: '/diagnostics/fast',
    apiRoutes: [],
    adminRoutes: [],
    catalogProductCode: 'fast_diagnostic',
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: false,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 8,
    currentScore: 6,
    primaryCTA: 'Start Fast Diagnostic',
    nextAdmissibleMove: 'Declare stateless label or add result persistence; confirm next route logic to Pressure Signal or Boardroom Brief',
    authorityGaps: [
      '[FAIL] runtime_truth: no DB persistence — result is ephemeral; must declare stateless label explicitly',
      '[FAIL] admin: no admin view or conversion tracking',
      '[PARTIAL] test: route exists; no result logic coverage',
      '[PARTIAL] fulfilment: stateless tool — must label explicitly so buyers understand result is not saved',
      '[PARTIAL] commercial: no clear next-route CTA pointing to paid corridor',
    ],
  },

  {
    surfaceId: 'quick_decision_health_check',
    displayName: 'Quick Decision Health Check',
    family: 'market_activation',
    surfaceType: 'diagnostic',
    route: '/quick-check',
    apiRoutes: [],
    adminRoutes: [],
    catalogProductCode: 'quick_decision_health_check',
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: false,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 8,
    currentScore: 7,
    primaryCTA: 'Start health check',
    nextAdmissibleMove: 'Confirm 2-minute claim is accurate; add next admissible move CTA pointing to Pressure Signal or Boardroom Brief',
    authorityGaps: [
      '[PARTIAL] runtime_truth: result is ephemeral — no persistence; must carry explicit stateless label',
      '[PARTIAL] commercial: next route after result not wired to paid conversion CTA',
      '[PARTIAL] test: route verified; no result logic or next-route coverage',
    ],
  },

  {
    surfaceId: 'scenario_stress_test',
    displayName: 'Scenario Stress Test',
    family: 'market_activation',
    surfaceType: 'diagnostic',
    route: '/scenario-stress-test',
    apiRoutes: [],
    adminRoutes: [],
    catalogProductCode: 'scenario_stress_test',
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: 'GMI_SCENARIO_EXPLORER_ENABLED=false',
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: false,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 8,
    currentScore: 7,
    primaryCTA: 'Run scenario test',
    nextAdmissibleMove: 'Confirm no predictive/live-feed language in output; add explicit "simulation" label; wire next route to Enterprise Assessment or Strategy Room',
    authorityGaps: [
      '[PARTIAL] market_authority: output must not use predictive model / AI forecast language',
      '[PARTIAL] commercial: next route to paid corridor not wired',
      '[PARTIAL] test: no scenario output or market-authority language validation test',
    ],
  },

  {
    surfaceId: 'boardroom_brief_public_entry',
    displayName: 'Boardroom Brief — Public Entry',
    family: 'market_activation',
    surfaceType: 'product',
    route: '/boardroom-brief',
    apiRoutes: ['/api/admin/advisory-queue/boardroom-orders', '/api/admin/advisory-queue/boardroom-delivery'],
    adminRoutes: ['/admin/boardroom-delivery'],
    catalogProductCode: 'boardroom_brief',
    entitlementSlug: 'boardroom-brief',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'public_limited',
    targetScore: 10,
    currentScore: 8,
    primaryCTA: 'Generate a brief',
    nextAdmissibleMove: 'Promote to public_active once smoke test of paid delivery end-to-end is verified against a real paid order in staging',
    authorityGaps: [
      '[PARTIAL] fulfilment: paid delivery smoke could not pass without a real paid BoardroomBriefOrder in the configured DB',
      '[PARTIAL] market_authority: public_active promotion is blocked until a real paid Boardroom Brief delivery smoke passes',
    ],
  },

  {
    surfaceId: 'boardroom_brief_sample',
    displayName: 'Boardroom Brief — Sample View',
    family: 'market_activation',
    surfaceType: 'proof_surface',
    route: '/boardroom-brief?sample=true',
    apiRoutes: [],
    adminRoutes: [],
    catalogProductCode: 'boardroom_brief_sample',
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: false,
    usesContent: false,
    currentExposureStatus: 'public_limited',
    targetScore: 8,
    currentScore: 8,
    primaryCTA: 'View sample',
    nextAdmissibleMove: 'Ensure sample uses fictional demonstration data only; no real client data in sample view',
    authorityGaps: [
      '[PARTIAL] market_authority: must confirm sample data is entirely fictional and labelled as such',
    ],
  },

  {
    surfaceId: 'boardroom_brief_confirmation',
    displayName: 'Boardroom Brief — Order Confirmation',
    family: 'operational_corridor',
    surfaceType: 'fulfilment_layer',
    route: '/boardroom-brief/confirmation',
    apiRoutes: [],
    adminRoutes: [],
    catalogProductCode: 'boardroom_brief',
    entitlementSlug: 'boardroom-brief',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'evidence_gated',
    targetScore: 9,
    currentScore: 7,
    primaryCTA: null,
    nextAdmissibleMove: 'Confirm delivery status shown from DB order state, not from URL params; add email confirmation trigger',
    authorityGaps: [
      '[PARTIAL] runtime_truth: confirmation state must derive from BoardroomBriefOrder DB record, not session/URL',
      '[PARTIAL] fulfilment: no verified delivery confirmation trigger connected to dossier status update',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERATIONAL DECISION CORRIDOR
  // ═══════════════════════════════════════════════════════════════════════════

  {
    surfaceId: 'team_assessment',
    displayName: 'Team Assessment',
    family: 'operational_corridor',
    surfaceType: 'corridor_stage',
    route: '/diagnostics/team-assessment',
    apiRoutes: ['/api/diagnostics/team-alignment'],
    adminRoutes: [],
    catalogProductCode: 'team_assessment',
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: false,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 9,
    currentScore: 6,
    primaryCTA: 'Start Team Assessment',
    nextAdmissibleMove: 'Add respondent session persistence model; add comparison logic; add next route to Enterprise Assessment or Executive Reporting',
    authorityGaps: [
      '[FAIL] fulfilment: no team response persistence model; results may be ephemeral',
      '[FAIL] admin: no admin view of team assessment results or aggregate respondent state',
      '[PARTIAL] evidence_input: no divergence detection logic confirmed in production path',
      '[PARTIAL] commercial: next route to Enterprise Assessment or Executive Reporting not wired',
    ],
  },

  {
    surfaceId: 'enterprise_assessment',
    displayName: 'Enterprise Assessment',
    family: 'operational_corridor',
    surfaceType: 'corridor_stage',
    route: '/enterprise',
    apiRoutes: ['/api/diagnostics/enterprise', '/api/enterprise/campaigns/[id]', '/api/enterprise/report/[campaignId]'],
    adminRoutes: ['/admin/enterprise-foundation', '/admin/enterprise-pipeline'],
    catalogProductCode: 'enterprise_assessment',
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 9,
    currentScore: 6,
    primaryCTA: 'Run organisational scan',
    nextAdmissibleMove: 'Confirm organisation scan persistence model; add exposure scoring output artifact; add next route to Executive Reporting / Boardroom Mode / Strategy Room',
    authorityGaps: [
      '[FAIL] fulfilment: no output artifact persisted; scan result state unclear',
      '[PARTIAL] admin: admin pipeline exists but no scan-level result detail view',
      '[PARTIAL] evidence_input: authority/evidence/scenario stress logic not confirmed in production path',
      '[PARTIAL] commercial: next route to Executive Reporting / Strategy Room / Retainer Review not surfaced after scan result',
    ],
  },

  {
    surfaceId: 'executive_reporting',
    displayName: 'Executive Reporting',
    family: 'operational_corridor',
    surfaceType: 'corridor_stage',
    route: '/diagnostics/executive-reporting',
    apiRoutes: ['/api/executive-reporting/run', '/api/executive-reporting/export/boardroom-pdf'],
    adminRoutes: ['/admin/reporting/executive'],
    catalogProductCode: 'executive_reporting',
    entitlementSlug: 'assessment.executive_reporting',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'public_limited',
    targetScore: 10,
    currentScore: 8,
    primaryCTA: 'Proceed to Executive Reporting',
    nextAdmissibleMove: 'Resolve dual Stripe webhook ownership; confirm ExecutiveReportingArtifact hash; add customer delivery confirmation',
    authorityGaps: [
      '[PARTIAL] commercial: two Stripe webhook surfaces exist (pages/api and app/api) — canonical ownership not declared',
      '[PARTIAL] fulfilment: no artifact hash confirmed on ExecutiveReportingArtifact; customer delivery confirmation not confirmed',
    ],
  },

  {
    surfaceId: 'boardroom_mode',
    displayName: 'Boardroom Mode',
    family: 'operational_corridor',
    surfaceType: 'corridor_stage',
    route: '/boardroom-mode',
    apiRoutes: [],
    adminRoutes: ['/admin/boardroom-archive'],
    catalogProductCode: 'boardroom_mode',
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: false,
    usesContent: false,
    currentExposureStatus: 'evidence_gated',
    targetScore: 9,
    currentScore: 6,
    primaryCTA: 'View Boardroom Mode',
    nextAdmissibleMove: 'Confirm adversarial challenge engine is DB-backed; add boardroom result state model; add PDF/export artifact',
    authorityGaps: [
      '[RESOLVED] commercial: boardroom_mode added to catalog as evidence_gated (P3 decision: Option A)',
      '[RESOLVED] market_authority: /boardroom-mode page created with clear distinction from Boardroom Brief',
      '[FAIL] runtime_truth: adversarial challenge engine authority model not confirmed — may be stateless',
      '[FAIL] fulfilment: no boardroom result state model; no PDF/export artifact',
      '[FAIL] evidence_input: evidence survival logic not confirmed — may not gate on prior evidence record',
      '[PARTIAL] admin: boardroom-archive exists but no session-level result state',
    ],
  },

  {
    surfaceId: 'strategy_room',
    displayName: 'Strategy Room',
    family: 'operational_corridor',
    surfaceType: 'corridor_stage',
    route: '/strategy-room',
    apiRoutes: ['/api/strategy-room/*', '/app/api/strategy-room/*'],
    adminRoutes: ['/admin/strategy-room', '/admin/authority-center'],
    catalogProductCode: 'strategy_room',
    entitlementSlug: 'strategy-room',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'public_limited',
    targetScore: 10,
    currentScore: 8,
    primaryCTA: 'View Strategy Room',
    nextAdmissibleMove: 'Consolidate pages/api and app/api ownership; add escalation/de-escalation logic; add completion/feedback state',
    authorityGaps: [
      '[PARTIAL] admin: pages/api and app/api ownership split — consolidation needed to prevent dual-write risk',
      '[PARTIAL] fulfilment: escalation/de-escalation logic and completion/feedback state not confirmed',
    ],
  },

  {
    surfaceId: 'strategy_room_session',
    displayName: 'Strategy Room — Session',
    family: 'operational_corridor',
    surfaceType: 'fulfilment_layer',
    route: '/strategy-room/session/[id]',
    apiRoutes: ['/api/strategy-room/*'],
    adminRoutes: [],
    catalogProductCode: 'strategy_room',
    entitlementSlug: 'strategy-room',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: true,
    acceptsPayment: false,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'evidence_gated',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: null,
    nextAdmissibleMove: 'Confirm StrategyRoomExecutionSession persists checkpoint/blocker/ownership; add recommendation artifact generation',
    authorityGaps: [
      '[PARTIAL] fulfilment: checkpoint state, blocker log, and ownership assignment persistence needs smoke verification',
    ],
  },

  {
    surfaceId: 'retainer_review_queue',
    displayName: 'Retainer Review Queue',
    family: 'operational_corridor',
    surfaceType: 'corridor_stage',
    route: '/retainer/intake',
    apiRoutes: ['/api/retainers/*'],
    adminRoutes: ['/admin/retainer-readiness'],
    catalogProductCode: 'retainer_review_queue',
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'review_gated',
    targetScore: 9,
    currentScore: 7,
    primaryCTA: 'Request review where eligible',
    nextAdmissibleMove: 'Confirm RetainerReviewQueueEntry persists eligibility criteria; add admin approve/decline/request-more-evidence actions; confirm no automatic retainer activation on queue entry',
    authorityGaps: [
      '[PARTIAL] fulfilment: admin approve/decline/request-more-evidence flow not confirmed in production path',
      '[PARTIAL] evidence_input: eligibility criteria gating (REVIEW_READY/OVERSIGHT_READY) not confirmed as automated check',
      '[PARTIAL] admin: /admin/retainer-readiness exists; no per-request action buttons confirmed',
    ],
  },

  {
    surfaceId: 'retainer_oversight',
    displayName: 'Retainer Oversight',
    family: 'operational_corridor',
    surfaceType: 'corridor_stage',
    route: '/retainer',
    apiRoutes: ['/api/retainers/*'],
    adminRoutes: ['/admin/retained-cadence', '/admin/retainer-readiness', '/admin/oversight-review'],
    catalogProductCode: 'retainer_oversight',
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'dormant',
    targetScore: 10,
    currentScore: 9,
    primaryCTA: null,
    nextAdmissibleMove: 'Automate readiness threshold check; promote to review_gated once RetainerAccount lifecycle is activated; do not expose self-serve CTA',
    authorityGaps: [
      '[PARTIAL] evidence_input: durable case history threshold not automated — still requires manual readiness review to open cycle',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DECISION INSTRUMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    surfaceId: 'decision_instruments_directory',
    displayName: 'Decision Instruments — Directory',
    family: 'decision_instruments',
    surfaceType: 'product',
    route: '/decision-instruments',
    apiRoutes: ['/api/decision-instruments/results'],
    adminRoutes: [],
    catalogProductCode: null,
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: false,
    usesContent: false,
    currentExposureStatus: 'public_limited',
    targetScore: 9,
    currentScore: 7,
    primaryCTA: 'View instruments',
    nextAdmissibleMove: 'Consolidate price/catalog truth to single source; complete browser entitlement smoke; add My Instruments history surface',
    authorityGaps: [
      '[FAIL] commercial: price truth duplicated across CATALOG, PRODUCT_ESTATE, product-catalogue-registry, and local page arrays',
      '[PARTIAL] test: browser entitlement smoke is pending',
    ],
  },

  {
    surfaceId: 'decision_instruments_my_instruments',
    displayName: 'My Instruments',
    family: 'decision_instruments',
    surfaceType: 'console',
    route: '/my-instruments',
    apiRoutes: [],
    adminRoutes: ['/admin/decision-instrument-runs'],
    catalogProductCode: null,
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: true,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 8,
    currentScore: 8,
    primaryCTA: null,
    nextAdmissibleMove: 'Expose client run history from DecisionInstrumentRun and keep downloads bound to runId + entitlement',
    authorityGaps: [
      '[PARTIAL] fulfilment: client-facing My Instruments history still needs DecisionInstrumentRun rendering',
    ],
  },

  // Individual instruments — all share the same gap profile; scored collectively
  {
    surfaceId: 'instrument_decision_exposure',
    displayName: 'Decision Exposure Instrument',
    family: 'decision_instruments',
    surfaceType: 'instrument',
    route: '/decision-instruments/decision-exposure-instrument',
    apiRoutes: ['/api/downloads/instrument-pdf'],
    adminRoutes: [],
    catalogProductCode: 'decision_exposure_instrument',
    entitlementSlug: 'decision_exposure_instrument',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: 'Open instrument',
    nextAdmissibleMove: 'Complete browser smoke with a real entitlement; keep artifact downloads bound to runId',
    authorityGaps: [
      '[PARTIAL] test: browser entitlement smoke is pending',
    ],
  },

  {
    surfaceId: 'instrument_mandate_clarity',
    displayName: 'Mandate Clarity Framework',
    family: 'decision_instruments',
    surfaceType: 'instrument',
    route: '/decision-instruments/mandate-clarity-framework',
    apiRoutes: ['/api/downloads/instrument-pdf'],
    adminRoutes: ['/admin/decision-instrument-runs'],
    catalogProductCode: 'mandate_clarity_framework',
    entitlementSlug: 'mandate_clarity_framework',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: 'Open instrument',
    nextAdmissibleMove: 'Complete browser smoke with a real entitlement; keep artifact downloads bound to runId',
    authorityGaps: [
      '[PARTIAL] test: browser entitlement smoke is pending',
    ],
  },

  {
    surfaceId: 'instrument_intervention_path',
    displayName: 'Intervention Path Selector',
    family: 'decision_instruments',
    surfaceType: 'instrument',
    route: '/decision-instruments/intervention-path-selector',
    apiRoutes: ['/api/downloads/instrument-pdf'],
    adminRoutes: ['/admin/decision-instrument-runs'],
    catalogProductCode: 'intervention_path_selector',
    entitlementSlug: 'intervention_path_selector',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: 'Open instrument',
    nextAdmissibleMove: 'Complete browser smoke with a real entitlement; keep artifact downloads bound to runId',
    authorityGaps: [
      '[PARTIAL] test: browser entitlement smoke is pending',
    ],
  },

  {
    surfaceId: 'instrument_escalation_readiness',
    displayName: 'Escalation Readiness Scorecard',
    family: 'decision_instruments',
    surfaceType: 'instrument',
    route: '/decision-instruments/escalation-readiness-scorecard',
    apiRoutes: ['/api/downloads/instrument-pdf'],
    adminRoutes: ['/admin/decision-instrument-runs'],
    catalogProductCode: 'escalation_readiness_scorecard',
    entitlementSlug: 'escalation_readiness_scorecard',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: 'Open instrument',
    nextAdmissibleMove: 'Complete browser smoke with a real entitlement; keep artifact downloads bound to runId',
    authorityGaps: [
      '[PARTIAL] test: browser entitlement smoke is pending',
    ],
  },

  {
    surfaceId: 'instrument_structural_failure',
    displayName: 'Structural Failure Diagnostic Canvas',
    family: 'decision_instruments',
    surfaceType: 'instrument',
    route: '/decision-instruments/structural-failure-diagnostic-canvas',
    apiRoutes: ['/api/downloads/instrument-pdf'],
    adminRoutes: ['/admin/decision-instrument-runs'],
    catalogProductCode: 'structural_failure_diagnostic_canvas',
    entitlementSlug: 'structural_failure_diagnostic_canvas',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: 'Open instrument',
    nextAdmissibleMove: 'Complete browser smoke with a real entitlement; keep artifact downloads bound to runId',
    authorityGaps: [
      '[PARTIAL] test: browser entitlement smoke is pending',
    ],
  },

  {
    surfaceId: 'instrument_execution_risk',
    displayName: 'Execution Risk Index',
    family: 'decision_instruments',
    surfaceType: 'instrument',
    route: '/decision-instruments/execution-risk-index',
    apiRoutes: ['/api/downloads/instrument-pdf'],
    adminRoutes: ['/admin/decision-instrument-runs'],
    catalogProductCode: 'execution_risk_index',
    entitlementSlug: 'execution_risk_index',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: 'Open instrument',
    nextAdmissibleMove: 'Complete browser smoke with a real entitlement; keep artifact downloads bound to runId',
    authorityGaps: [
      '[PARTIAL] test: browser entitlement smoke is pending',
    ],
  },

  {
    surfaceId: 'instrument_alignment_gap',
    displayName: 'Decision Alignment Gap Map',
    family: 'decision_instruments',
    surfaceType: 'instrument',
    route: '/decision-instruments/team-alignment-gap-map',
    apiRoutes: ['/api/downloads/instrument-pdf'],
    adminRoutes: ['/admin/decision-instrument-runs'],
    catalogProductCode: 'team_alignment_gap_map',
    entitlementSlug: 'team_alignment_gap_map',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: 'Open instrument',
    nextAdmissibleMove: 'Complete browser smoke with a real entitlement; keep artifact downloads bound to runId',
    authorityGaps: [
      '[PARTIAL] test: browser entitlement smoke is pending',
    ],
  },

  {
    surfaceId: 'instrument_governance_drift',
    displayName: 'Governance Drift Detector',
    family: 'decision_instruments',
    surfaceType: 'instrument',
    route: '/decision-instruments/governance-drift-detector',
    apiRoutes: ['/api/downloads/instrument-pdf'],
    adminRoutes: ['/admin/decision-instrument-runs'],
    catalogProductCode: 'governance_drift_detector',
    entitlementSlug: 'governance_drift_detector',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: 'Open instrument',
    nextAdmissibleMove: 'Complete browser smoke with a real entitlement; keep artifact downloads bound to runId',
    authorityGaps: [
      '[PARTIAL] test: browser entitlement smoke is pending',
    ],
  },

  {
    surfaceId: 'instrument_priority_stack',
    displayName: 'Strategic Priority Stack Builder',
    family: 'decision_instruments',
    surfaceType: 'instrument',
    route: '/decision-instruments/strategic-priority-stack-builder',
    apiRoutes: ['/api/downloads/instrument-pdf'],
    adminRoutes: ['/admin/decision-instrument-runs'],
    catalogProductCode: 'strategic_priority_stack_builder',
    entitlementSlug: 'strategic_priority_stack_builder',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: 'Open instrument',
    nextAdmissibleMove: 'Complete browser smoke with a real entitlement; keep artifact downloads bound to runId',
    authorityGaps: [
      '[PARTIAL] test: browser entitlement smoke is pending',
    ],
  },

  {
    surfaceId: 'instrument_board_brief_builder',
    displayName: 'Board Brief Builder',
    family: 'decision_instruments',
    surfaceType: 'instrument',
    route: '/decision-instruments/board-brief-builder',
    apiRoutes: ['/api/downloads/instrument-pdf'],
    adminRoutes: ['/admin/decision-instrument-runs'],
    catalogProductCode: 'board_brief_builder',
    entitlementSlug: 'board_brief_builder',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: 'Open instrument',
    nextAdmissibleMove: 'Complete browser smoke with a real entitlement; keep artifact downloads bound to runId',
    authorityGaps: [
      '[PARTIAL] test: browser entitlement smoke is pending',
    ],
  },

  {
    surfaceId: 'instrument_operator_pack',
    displayName: 'Operator Decision Pack',
    family: 'decision_instruments',
    surfaceType: 'instrument',
    route: '/decision-instruments/operator-decision-pack',
    apiRoutes: ['/api/downloads/instrument-pdf'],
    adminRoutes: ['/admin/decision-instrument-runs'],
    catalogProductCode: 'operator_decision_pack',
    entitlementSlug: 'operator_decision_pack',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: 'Get pack',
    nextAdmissibleMove: 'Complete browser smoke with a real entitlement; keep artifact downloads bound to runId',
    authorityGaps: [
      '[PARTIAL] test: browser entitlement smoke is pending',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKET INTELLIGENCE (GMI)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    surfaceId: 'gmi_landing',
    displayName: 'GMI — Intelligence Landing',
    family: 'market_intelligence',
    surfaceType: 'product',
    route: '/intelligence/gmi',
    apiRoutes: ['/api/gmi/editions'],
    adminRoutes: ['/admin/intelligence/gmi/publication-readiness'],
    catalogProductCode: 'gmi_q2_2026',
    entitlementSlug: 'edition-specific',
    stripePriceId: 'catalog',
    featureFlag: 'edition resolver',
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'public_limited',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: 'View intelligence report',
    nextAdmissibleMove: 'Update catalog to reflect Q2 as current purchasable edition; retire Q1-only catalog reference',
    authorityGaps: [
      '[PARTIAL] commercial: catalog still names Q1 as purchasable product while runtime Q2 is DB-backed and live',
    ],
  },

  {
    surfaceId: 'gmi_operator_dashboard',
    displayName: 'GMI — Q2 Operator Dashboard',
    family: 'market_intelligence',
    surfaceType: 'proof_surface',
    route: '/intelligence/gmi/q2-2026',
    apiRoutes: ['/api/gmi/calls', '/api/gmi/performance'],
    adminRoutes: ['/admin/intelligence/gmi-control-plane'],
    catalogProductCode: 'gmi_q2_2026',
    entitlementSlug: 'edition-specific',
    stripePriceId: null,
    featureFlag: 'edition resolver',
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'public_limited',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: null,
    nextAdmissibleMove: 'Ensure edition resolver is the only path to this route; no hardcoded Q2 slug in route logic',
    authorityGaps: [
      '[PARTIAL] market_authority: legacy admin/support views may still import static GMI registries',
    ],
  },

  {
    surfaceId: 'gmi_call_ledger',
    displayName: 'GMI — Call Ledger',
    family: 'market_intelligence',
    surfaceType: 'proof_surface',
    route: '/intelligence/gmi/calls',
    apiRoutes: ['/api/gmi/calls'],
    adminRoutes: [],
    catalogProductCode: null,
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: 'edition resolver',
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'public_limited',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: null,
    nextAdmissibleMove: 'No action — route working, edition-parametric, private fields stripped',
    authorityGaps: [],
  },

  {
    surfaceId: 'gmi_performance',
    displayName: 'GMI — Performance Centre',
    family: 'market_intelligence',
    surfaceType: 'proof_surface',
    route: '/intelligence/gmi/performance',
    apiRoutes: ['/api/gmi/performance'],
    adminRoutes: [],
    catalogProductCode: null,
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: 'edition resolver',
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'public_limited',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: null,
    nextAdmissibleMove: 'No action required — route working and edition-parametric',
    authorityGaps: [],
  },

  {
    surfaceId: 'gmi_falsification',
    displayName: 'GMI — Falsification Register',
    family: 'market_intelligence',
    surfaceType: 'proof_surface',
    route: '/intelligence/gmi/falsification',
    apiRoutes: ['/api/gmi/falsification'],
    adminRoutes: [],
    catalogProductCode: null,
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: 'edition resolver',
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'public_limited',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: null,
    nextAdmissibleMove: 'No action required',
    authorityGaps: [],
  },

  {
    surfaceId: 'gmi_board_pulse',
    displayName: 'GMI — Board Pulse',
    family: 'market_intelligence',
    surfaceType: 'proof_surface',
    route: '/intelligence/gmi/board-pulse',
    apiRoutes: ['/api/gmi/board-pulse'],
    adminRoutes: [],
    catalogProductCode: null,
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: 'edition resolver',
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'public_limited',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: null,
    nextAdmissibleMove: 'No action required',
    authorityGaps: [],
  },

  {
    surfaceId: 'gmi_board_pack',
    displayName: 'GMI — Board Pack PDF',
    family: 'market_intelligence',
    surfaceType: 'fulfilment_layer',
    route: null,
    apiRoutes: ['/api/gmi/board-pack'],
    adminRoutes: ['/admin/intelligence/gmi-control-plane'],
    catalogProductCode: 'gmi_q2_2026',
    entitlementSlug: 'edition-specific',
    stripePriceId: 'catalog',
    featureFlag: 'edition resolver',
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: true,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'evidence_gated',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: null,
    nextAdmissibleMove: 'Verify GmiBoardPackArtifact hash is recorded on every generation; add admin artifact registry view',
    authorityGaps: [
      '[PARTIAL] fulfilment: artifact hash recording not smoke-verified post-generation',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTINUITY AND SUBSCRIPTION
  // ═══════════════════════════════════════════════════════════════════════════

  {
    surfaceId: 'professional_subscription',
    displayName: 'Professional Subscription',
    family: 'continuity_and_subscription',
    surfaceType: 'product',
    route: '/professionals',
    apiRoutes: ['/api/billing/checkout', '/api/admin/commercial'],
    adminRoutes: ['/admin/commercial'],
    catalogProductCode: 'professional',
    entitlementSlug: 'tier.professional',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: false,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'public_limited',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: 'Start Professional',
    nextAdmissibleMove: 'Unify professional trial status with active entitlement resolution; confirm canonical subscription vs. Inner Circle bridge',
    authorityGaps: [
      '[PARTIAL] commercial: professional trial status handled separately from active entitlement resolution',
    ],
  },

  {
    surfaceId: 'continuity_console',
    displayName: 'Continuity Console',
    family: 'continuity_and_subscription',
    surfaceType: 'console',
    route: '/continuity',
    apiRoutes: [],
    adminRoutes: [],
    catalogProductCode: null,
    entitlementSlug: 'tier.professional',
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: true,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'evidence_gated',
    targetScore: 8,
    currentScore: 5,
    primaryCTA: null,
    nextAdmissibleMove: 'Gate on verified case record existence; do not show empty console; connect to Decision Centre case state',
    authorityGaps: [
      '[FAIL] runtime_truth: must only render when case record exists — empty console is misleading',
      '[FAIL] evidence_input: no gate on case identity confirmed in production path',
      '[PARTIAL] admin: no admin view of continuity console state per user',
    ],
  },

  {
    surfaceId: 'decision_centre',
    displayName: 'Decision Centre',
    family: 'continuity_and_subscription',
    surfaceType: 'console',
    route: '/decision-centre',
    apiRoutes: ['/api/decision-centre/cases', '/api/decision-centre/save-session-case'],
    adminRoutes: [],
    catalogProductCode: null,
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: true,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'evidence_gated',
    targetScore: 8,
    currentScore: 6,
    primaryCTA: null,
    nextAdmissibleMove: 'Confirm case state is durable; add return brief generation from real case state; confirm memory source declaration',
    authorityGaps: [
      '[PARTIAL] runtime_truth: memory source must be declared — case data source not documented',
      '[PARTIAL] fulfilment: return brief generation path not confirmed as deriving from real execution state',
      '[PARTIAL] admin: no admin-level view of decision centre case inventory',
    ],
  },

  {
    surfaceId: 'return_brief',
    displayName: 'Return Brief',
    family: 'continuity_and_subscription',
    surfaceType: 'fulfilment_layer',
    route: '/return-brief',
    apiRoutes: ['/api/cases/return-brief', '/api/internal/return-brief/send'],
    adminRoutes: [],
    catalogProductCode: null,
    entitlementSlug: 'tier.professional',
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: true,
    acceptsPayment: false,
    producesArtifact: true,
    writesDatabase: false,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'evidence_gated',
    targetScore: 8,
    currentScore: 6,
    primaryCTA: null,
    nextAdmissibleMove: 'Confirm return brief is generated from real execution/signal state, not generic template; add DB record on generation',
    authorityGaps: [
      '[FAIL] runtime_truth: return brief generation source not confirmed — may derive from generic template rather than case execution state',
      '[PARTIAL] fulfilment: no DB record of generated return brief confirmed',
      '[PARTIAL] evidence_input: must require active case record, not just auth session',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADVISORY AND OVERSIGHT
  // ═══════════════════════════════════════════════════════════════════════════

  {
    surfaceId: 'oversight_portfolio',
    displayName: 'Oversight — Portfolio',
    family: 'advisory_and_oversight',
    surfaceType: 'console',
    route: '/oversight',
    apiRoutes: ['/api/internal/oversight/review-cycle-preview'],
    adminRoutes: ['/admin/oversight-review'],
    catalogProductCode: null,
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: true,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'review_gated',
    targetScore: 9,
    currentScore: 7,
    primaryCTA: null,
    nextAdmissibleMove: 'Wire OversightReviewCycle to portfolio display; add client health status summary; add intervention log view',
    authorityGaps: [
      '[PARTIAL] runtime_truth: OversightReviewCycle model deployed; route not yet wired to it',
      '[PARTIAL] fulfilment: intervention log and cycle summary not confirmed in this route',
    ],
  },

  {
    surfaceId: 'professionals_access',
    displayName: 'Professional Access',
    family: 'advisory_and_oversight',
    surfaceType: 'product',
    route: '/professionals',
    apiRoutes: [],
    adminRoutes: [],
    catalogProductCode: 'professionals_access',
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: false,
    usesContent: false,
    currentExposureStatus: 'review_gated',
    targetScore: 8,
    currentScore: 7,
    primaryCTA: 'Request professional access',
    nextAdmissibleMove: 'Confirm selective access request is recorded in admin queue; add status tracking for applicant',
    authorityGaps: [
      '[PARTIAL] fulfilment: access request persistence and admin queue visibility not confirmed',
      '[PARTIAL] admin: no admin review queue confirmed for professional access applications',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPORTING INFRASTRUCTURE
  // ═══════════════════════════════════════════════════════════════════════════

  {
    surfaceId: 'evidence_memory_layer',
    displayName: 'Evidence Memory Layer',
    family: 'supporting_infrastructure',
    surfaceType: 'evidence_layer',
    route: '/evidence',
    apiRoutes: ['/api/proof/evidence', '/api/diagnostics/evidence/route'],
    adminRoutes: ['/admin/proof'],
    catalogProductCode: null,
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: true,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: false,
    currentExposureStatus: 'evidence_gated',
    targetScore: 8,
    currentScore: 6,
    primaryCTA: null,
    nextAdmissibleMove: 'Classify as supporting infrastructure, not standalone product; ensure evidence records link to case/run records; do not sell as standalone unless explicitly productised',
    authorityGaps: [
      '[PARTIAL] commercial: must not be sold as standalone product until explicitly productised',
      '[PARTIAL] runtime_truth: evidence record linkage to case/run records not confirmed',
      '[PARTIAL] admin: /admin/proof exists but evidence-to-product linkage visibility unclear',
    ],
  },

  {
    surfaceId: 'authority_lens',
    displayName: 'Authority Lens / Enterprise Decision Authority',
    family: 'supporting_infrastructure',
    surfaceType: 'proof_surface',
    route: '/enterprise-decision-authority',
    apiRoutes: [],
    adminRoutes: ['/admin/authority-center'],
    catalogProductCode: null,
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: false,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 8,
    currentScore: 6,
    primaryCTA: null,
    nextAdmissibleMove: 'Position as an entry lens, not a replacement for Enterprise Assessment or Executive Reporting; add next route to Enterprise Assessment',
    authorityGaps: [
      '[PARTIAL] commercial: must not replace Enterprise Assessment as a paid surface; positioning must be clear',
      '[PARTIAL] runtime_truth: no DB persistence confirmed — may be a static/informational page',
      '[PARTIAL] commercial: no CTA routing to Enterprise Assessment after lens view',
    ],
  },

  {
    surfaceId: 'inner_circle_operating_layer',
    displayName: 'Inner Circle Operating Layer',
    family: 'supporting_infrastructure',
    surfaceType: 'dormant_surface',
    route: '/inner-circle',
    apiRoutes: ['/api/inner-circle/*'],
    adminRoutes: ['/admin/advisory-queue', '/admin/inner-circle'],
    catalogProductCode: 'inner_circle',
    entitlementSlug: 'legacy inner_circle / professional bridge',
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: true,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: true,
    readsDatabase: true,
    usesContent: true,
    currentExposureStatus: 'dormant',
    targetScore: 8,
    currentScore: 6,
    primaryCTA: null,
    nextAdmissibleMove: 'Ensure no membership CTA implies active paid subscription; label as operating layer for legacy access; do not sell as passive subscription archive',
    authorityGaps: [
      '[PARTIAL] route: substantial route surface (dashboard, tools, council-request) for a dormant product',
      '[PARTIAL] fulfilment: membership CTA must not imply active paid subscription',
      '[PARTIAL] market_authority: catalog accurately marks inactive but route surface implies active operation',
    ],
  },

  {
    surfaceId: 'personal_decision_audit',
    displayName: 'Personal Decision Audit / Purpose Alignment',
    family: 'supporting_infrastructure',
    surfaceType: 'product',
    route: '/diagnostics/purpose-alignment',
    apiRoutes: [],
    adminRoutes: [],
    catalogProductCode: 'personal_decision_audit',
    entitlementSlug: 'personal_decision_audit',
    stripePriceId: 'catalog',
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: true,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: false,
    usesContent: false,
    currentExposureStatus: 'controlled_access',
    targetScore: 8,
    currentScore: 6,
    primaryCTA: 'Start Personal Decision Audit',
    nextAdmissibleMove: 'Add result persistence; confirm next route to Professional or Strategy Room; add admin visibility',
    authorityGaps: [
      '[FAIL] fulfilment: no result persistence confirmed; output may be ephemeral',
      '[FAIL] admin: no admin view of audit results',
      '[PARTIAL] commercial: paid but no result model to confirm value delivered',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // KNOWLEDGE AND CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  {
    surfaceId: 'published_briefs',
    displayName: 'Published Briefs',
    family: 'knowledge_and_content',
    surfaceType: 'proof_surface',
    route: '/briefs',
    apiRoutes: ['/api/briefs/[slug]'],
    adminRoutes: ['/admin/content'],
    catalogProductCode: null,
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: false,
    usesContent: true,
    currentExposureStatus: 'public_active',
    targetScore: 9,
    currentScore: 9,
    primaryCTA: 'Read briefs',
    nextAdmissibleMove: 'Maintain content test coverage; keep scheduled/public boundary enforcement',
    authorityGaps: [],
  },

  {
    surfaceId: 'vault',
    displayName: 'Vault',
    family: 'knowledge_and_content',
    surfaceType: 'proof_surface',
    route: '/vault',
    apiRoutes: ['/api/vault/*'],
    adminRoutes: ['/admin/content-vault'],
    catalogProductCode: null,
    entitlementSlug: 'content frontmatter access tier',
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: false,
    usesContent: true,
    currentExposureStatus: 'public_limited',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: null,
    nextAdmissibleMove: 'Maintain content tests; confirm frontmatter access tier is enforced consistently',
    authorityGaps: [
      '[PARTIAL] evidence_input: frontmatter access tier enforcement consistency not smoke-verified',
    ],
  },

  {
    surfaceId: 'editorials',
    displayName: 'Editorial Series',
    family: 'knowledge_and_content',
    surfaceType: 'proof_surface',
    route: '/editorials',
    apiRoutes: [],
    adminRoutes: [],
    catalogProductCode: null,
    entitlementSlug: null,
    stripePriceId: null,
    featureFlag: null,
    requiresAuth: false,
    acceptsPayment: false,
    producesArtifact: false,
    writesDatabase: false,
    readsDatabase: false,
    usesContent: true,
    currentExposureStatus: 'public_limited',
    targetScore: 9,
    currentScore: 8,
    primaryCTA: null,
    nextAdmissibleMove: 'Ensure editorial series is labelled as curated editorial content, not live operational state',
    authorityGaps: [
      '[PARTIAL] market_authority: editorial series uses curated static list — must remain labelled as editorial curation',
    ],
  },

]

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function getSurfaceRegistry(): ProductSurface[] {
  return PRODUCT_SURFACE_REGISTRY
}

export function getSurfaceById(surfaceId: string): ProductSurface | undefined {
  return PRODUCT_SURFACE_REGISTRY.find((s) => s.surfaceId === surfaceId)
}

export function getSurfacesByFamily(family: SurfaceFamily): ProductSurface[] {
  return PRODUCT_SURFACE_REGISTRY.filter((s) => s.family === family)
}

export function getSurfacesByType(surfaceType: SurfaceType): ProductSurface[] {
  return PRODUCT_SURFACE_REGISTRY.filter((s) => s.surfaceType === surfaceType)
}

export function getSurfacesBelow(threshold: number): ProductSurface[] {
  return PRODUCT_SURFACE_REGISTRY.filter((s) => s.currentScore < threshold)
}

export function getPaidSurfacesWithGaps(): ProductSurface[] {
  return PRODUCT_SURFACE_REGISTRY.filter(
    (s) => s.acceptsPayment && s.authorityGaps.length > 0,
  )
}

export function getPublicSurfacesBelowThreshold(threshold = 9): ProductSurface[] {
  return PRODUCT_SURFACE_REGISTRY.filter(
    (s) =>
      s.currentScore < threshold &&
      (s.currentExposureStatus === 'public_active' || s.currentExposureStatus === 'public_limited'),
  )
}

export function getCorridorSurfaces(): ProductSurface[] {
  return PRODUCT_SURFACE_REGISTRY.filter((s) => s.surfaceType === 'corridor_stage')
}

export function getMarketActivationSurfaces(): ProductSurface[] {
  return PRODUCT_SURFACE_REGISTRY.filter((s) => s.family === 'market_activation')
}

export function getSurfacesWithFailGap(): ProductSurface[] {
  return PRODUCT_SURFACE_REGISTRY.filter((s) =>
    s.authorityGaps.some((g) => g.startsWith('[FAIL]')),
  )
}

export function getSurfacesByExposure(status: SurfaceExposureStatus): ProductSurface[] {
  return PRODUCT_SURFACE_REGISTRY.filter((s) => s.currentExposureStatus === status)
}

export function assertNoCheckoutAboveThreshold(): void {
  const violations: string[] = []
  for (const surface of PRODUCT_SURFACE_REGISTRY) {
    if (surface.acceptsPayment && surface.currentScore < 8) {
      violations.push(
        `${surface.surfaceId} (score ${surface.currentScore}): accepts payment but score is below 8`,
      )
    }
    if (
      surface.acceptsPayment &&
      surface.currentExposureStatus !== 'public_active' &&
      surface.currentExposureStatus !== 'public_limited' &&
      surface.currentExposureStatus !== 'evidence_gated'
    ) {
      violations.push(
        `${surface.surfaceId}: accepts payment but exposure is ${surface.currentExposureStatus}`,
      )
    }
  }
  if (violations.length > 0) {
    throw new Error(
      `assertNoCheckoutAboveThreshold:\n${violations.map((v) => `  - ${v}`).join('\n')}`,
    )
  }
}
