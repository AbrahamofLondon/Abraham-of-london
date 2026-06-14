# System Truth Claim Leakage Audit

Generated: 2026-06-13T21:48:11.371Z

Files scanned: 6050

Total findings: 56435

High-risk findings: 17949

## Status Counts

- needs authority state check: 17272
- unsupported: 677
- bounded: 28938
- stale: 9548

## High-Risk Findings

| File | Line | Term | Status | Context |
| --- | ---: | --- | --- | --- |
| app/account/instruments/AccountInstrumentsClient.tsx | 33 | gold | needs authority state check | const GOLD = "#C9A96E"; |
| app/account/instruments/AccountInstrumentsClient.tsx | 105 | gold | needs authority state check | <p className="text-xl font-semibold" style={{ color: GOLD }}> |
| app/account/instruments/AccountInstrumentsClient.tsx | 175 | gold | needs authority state check | style={{ ...mono, borderColor: `${GOLD}55`, color: GOLD }} |
| app/actions/briefing.ts | 28 | board-ready | unsupported | * Compiles registry data into a board-ready intelligence brief. |
| app/actions/deploy-intervention.ts | 15 | authority | needs authority state check | authorityType?: "DIRECT" \| "PROXY" \| "UNCLEAR"; |
| app/actions/deploy-intervention.ts | 31 | authority | needs authority state check | authorityType = "PROXY", |
| app/actions/deploy-intervention.ts | 45 | authority | needs authority state check | authorityType, |
| app/admin/campaigns/[id]/enterprise-report/page.tsx | 3 | authority | needs authority state check | // Enterprise decision authority report — full pipeline output with FragilityRadar. |
| app/admin/campaigns/[id]/participant-table.tsx | 93 | validated | needs authority state check | ? `Validated: ${new Date(p.completedAt).toLocaleDateString('en-GB')}` |
| app/admin/campaigns/[id]/participant-table.tsx | 139 | validated | needs authority state check | label: 'Validated', |
| app/admin/command/page.tsx | 23 | authority | needs authority state check | import { isAuthorizedAdminSession } from "@/lib/auth/admin-authority"; |
| app/admin/commercial/PageClient.tsx | 5 | gold | needs authority state check | const GOLD = "#C9A96E"; |
| app/admin/commercial/PageClient.tsx | 64 | authority | needs authority state check | Commercial Authority |
| app/admin/commercial/PageClient.tsx | 76 | gold | needs authority state check | <div style={{ ...mono, fontSize: "1.5rem", color: s.alert ? "rgba(252,165,165,0.80)" : GOLD }}>{s.value ?? 0}</div> |
| app/admin/commercial/PageClient.tsx | 88 | gold | needs authority state check | <span style={{ ...mono, fontSize: "8px", color: GOLD }}>£{p.price}</span> |
| app/admin/commercial/PageClient.tsx | 121 | gold | needs authority state check | <button onClick={lookupEmail} style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, background: "none", border: `1px solid ${GOLD}35`, padding: "6px 12px", cursor: "pointer" }}> |
| app/admin/decision/contextual-efficacy/PageClient.tsx | 15 | authority | needs authority state check | authorityType: string; |
| app/admin/decision/contextual-efficacy/PageClient.tsx | 25 | authority | needs authority state check | authorityScore: number; |
| app/admin/decision/contextual-ranking/PageClient.tsx | 17 | authority | needs authority state check | authorityType: string; |
| app/admin/decision/contextual-ranking/PageClient.tsx | 27 | authority | needs authority state check | authorityScore: number; |
| app/admin/decision/efficacy/page.tsx | 216 | authority | needs authority state check | title="Conditional Efficacy — By Authority Type" |
| app/admin/decision/efficacy/page.tsx | 217 | authority | needs authority state check | rows={efficacy.conditional?.byAuthorityType \|\| []} |
| app/admin/decision/efficacy/page.tsx | 238 | authority | needs authority state check | title="Best Assets by Authority Type" |
| app/admin/decision/efficacy/page.tsx | 239 | authority | needs authority state check | rows={contextual.byAuthorityType \|\| []} |
| app/admin/decision-intelligence/PageClient.tsx | 59 | gold | needs authority state check | const GOLD = "#C9A96E"; |
| app/admin/decision-intelligence/PageClient.tsx | 100 | gold | needs authority state check | color: accent ? GOLD : "rgba(255,255,255,0.85)", |
| app/admin/decision-intelligence/PageClient.tsx | 167 | gold | needs authority state check | backgroundColor: GOLD, |
| app/admin/decision-intelligence/PageClient.tsx | 496 | gold | needs authority state check | color: GOLD, |
| app/admin/decision-intelligence/PageClient.tsx | 536 | gold | needs authority state check | color: GOLD, |
| app/admin/intelligence-foundry/brief-orders/PageClient.tsx | 13 | gold | needs authority state check | const GOLD = "#C9A96E"; |
| app/admin/intelligence-foundry/brief-orders/PageClient.tsx | 342 | gold | needs authority state check | <p className="text-white/50" style={{ color: selectedOrder.verificationToken ? GOLD : undefined }}> |
| app/admin/intelligence-foundry/executive-summary/page.tsx | 78 | authority | needs authority state check | "contradiction-scanner":     "Review the decision statement. Resolve contradictions and issue a revised directive with named authority.", |
| app/admin/intelligence-foundry/executive-summary/page.tsx | 85 | authority | needs authority state check | "strategy-room":             "Issue a governance directive. Name the authority. Set a decision deadline.", |
| app/admin/intelligence-foundry/executive-summary/page.tsx | 86 | authority | needs authority state check | "boardroom-mode":            "Review the executive brief. Resolve contradictions and obtain sign-off from the named authority.", |
| app/admin/intelligence-foundry/executive-summary/page.tsx | 104 | gold | needs authority state check | const GOLD = "#C9A96E"; |
| app/admin/intelligence-foundry/living-case-fulfilment/FulfilmentClient.tsx | 16 | gold | needs authority state check | const GOLD = '#C9A96E' |
| app/admin/intelligence-foundry/page.tsx | 28 | validated | needs authority state check | { id: "report-lineage-sim",            category: "Simulation",   label: "Report Lineage Simulation",       href: "/admin/intelligence-foundry/simulation/report-lineage",                      desc: "Runtime proof of governed product operatin |
| app/admin/intelligence-foundry/page.tsx | 29 | authority | needs authority state check | { id: "constitutional-diagnostic-sim", category: "Simulation",   label: "Constitutional Diagnostic",       href: "/admin/intelligence-foundry/simulation/constitutional-diagnostic",           desc: "Interactive 10-question diagnostic using r |
| app/admin/intelligence-foundry/qa-bench/PageClient.tsx | 29 | gold | needs authority state check | const GOLD = "#C9A96E"; |
| app/admin/intelligence-foundry/qa-bench/PageClient.tsx | 164 | gold | needs authority state check | style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }} |
| app/admin/intelligence-foundry/reference/page.tsx | 50 | authority | needs authority state check | dimension: "Authority Clarity", |
| app/admin/intelligence-foundry/reference/page.tsx | 52 | authority | needs authority state check | reference: "≥ 85 — role-scoped authority matrix in place", |
| app/admin/intelligence-foundry/reference/page.tsx | 53 | authority | needs authority state check | simulation: "40–60 — partial authority map, informal escalation", |
| app/admin/intelligence-foundry/reference/page.tsx | 54 | authority | needs authority state check | pilot: "65–79 — authority map formalised, 80% adoption", |
| app/admin/intelligence-foundry/reference/page.tsx | 75 | authority | needs authority state check | description: "Resource, authority, and cultural alignment for governed execution", |
| app/admin/intelligence-foundry/simulation/boardroom-mode/PageClient.tsx | 37 | authority | needs authority state check | { value: "qualifying",     label: "Qualifying — £8.5k/month, authority, accuracy confirmed" }, |
| app/admin/intelligence-foundry/simulation/boardroom-mode/PageClient.tsx | 331 | authority | needs authority state check | <span className="text-white/50">Authority condition</span> |
| app/admin/intelligence-foundry/simulation/constitutional-diagnostic/PageClient.tsx | 5 | authority | needs authority state check | // sliders per question. Returns constitutional route, authority score, coherence score, |
| app/admin/intelligence-foundry/simulation/constitutional-diagnostic/PageClient.tsx | 40 | authority | needs authority state check | authorityScore?: number; |
| app/admin/intelligence-foundry/simulation/constitutional-diagnostic/PageClient.tsx | 65 | authority | needs authority state check | { id: "q7",  text: "There is a clear decision-maker who can authorise strategic intervention.",                                              domain: "authority",   reverse: false }, |
| app/admin/intelligence-foundry/simulation/constitutional-diagnostic/PageClient.tsx | 204 | authority | needs authority state check | Domain scoring across coherence, authority, environment, execution, trust, friction, |
| app/admin/intelligence-foundry/simulation/constitutional-diagnostic/PageClient.tsx | 315 | authority | needs authority state check | {typeof rawOutput?.authorityScore === "number" && ( |
| app/admin/intelligence-foundry/simulation/executive-reporting/PageClient.tsx | 71 | verified | needs authority state check | label: "Ordered — low dissonance, execution verified", |
| app/admin/intelligence-foundry/simulation/fast-diagnostic/PageClient.tsx | 20 | authority | needs authority state check | { sectionId: "authority", questionId: "q1", prompt: "Is decision ownership clear?", value: 3 }, |
| app/admin/intelligence-foundry/simulation/fast-diagnostic/PageClient.tsx | 21 | authority | needs authority state check | { sectionId: "authority", questionId: "q2", prompt: "Is there a named decision-maker?", value: 3 }, |
| app/admin/intelligence-foundry/simulation/fast-diagnostic/PageClient.tsx | 29 | authority | needs authority state check | authority: "Authority", |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 20 | authority | needs authority state check | const AUTHORITY_OPTIONS = [ |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 32 | authority | needs authority state check | authority: { role: "Chief Executive", hasAuthority: "Yes, fully" as const, mandate: "Full board mandate to resolve the growth ceiling decision and restructure the executive team within Q3." }, |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 33 | authority | needs authority state check | decision: { statement: "We must decide whether to restructure the leadership team and delegate full P&L ownership to regional directors within the next 90 days, or pause expansion until the current authority structure is resolved.", type: " |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 36 | authority | needs authority state check | readiness: { readyForUnpleasantDecision: "Yes" as "Yes" \| "No", willingAccountability: "Yes" as "Yes" \| "No", whyNow: "The board has set a Q3 milestone. We are 60 days from it and the authority question is unresolved." }, |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 63 | authority | needs authority state check | authority: { |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 64 | authority | needs authority state check | role: form.authority.role, |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 65 | authority | needs authority state check | hasAuthority: form.authority.hasAuthority, |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 66 | authority | needs authority state check | mandate: form.authority.mandate, |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 186 | authority | needs authority state check | Runs real production logic: 8-component weighted scoring, authority gates, and decision directive derivation. |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 221 | authority | needs authority state check | Weak (authority=No, below threshold) |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 227 | authority | needs authority state check | {/* Authority */} |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 231 | authority | needs authority state check | value={form.authority.hasAuthority} |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 232 | authority | needs authority state check | onChange={(e) => setForm((f) => ({ ...f, authority: { ...f.authority, hasAuthority: e.target.value as typeof f.authority.hasAuthority } }))} |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 235 | authority | needs authority state check | {AUTHORITY_OPTIONS.map((o) => ( |
| app/admin/intelligence-foundry/simulation/strategy-room/PageClient.tsx | 348 | authority | needs authority state check | <span className="text-white/50">Authority (strong fixture)</span> |
| app/admin/organisations/[id]/dashboard/ogr-interactive-view.tsx | 61 | gold | needs authority state check | tone?: "neutral" \| "gold" \| "green" \| "blue" \| "red"; |
| app/admin/organisations/[id]/dashboard/ogr-interactive-view.tsx | 65 | gold | needs authority state check | gold: "border-amber-500/20 bg-amber-500/[0.08] text-amber-300", |
| app/admin/organisations/[id]/dashboard/ogr-interactive-view.tsx | 129 | gold | needs authority state check | ? "gold" |
| app/admin/organisations/[id]/page.tsx | 75 | gold | needs authority state check | tone?: "neutral" \| "gold" \| "green" \| "blue"; |
| app/admin/organisations/[id]/page.tsx | 79 | gold | needs authority state check | gold: "border-amber-500/20 bg-amber-500/[0.08] text-amber-300", |
| app/admin/organisations/[id]/page.tsx | 362 | gold | needs authority state check | tone="gold" |
| app/admin/organisations/[id]/report/page.tsx | 97 | gold | needs authority state check | tone?: "neutral" \| "gold" \| "green" \| "blue" \| "red"; |
| app/admin/organisations/[id]/report/page.tsx | 101 | gold | needs authority state check | gold: "border-amber-500/20 bg-amber-500/[0.08] text-amber-300", |
| app/admin/organisations/[id]/report/page.tsx | 261 | gold | needs authority state check | responseRate >= 70 ? "green" : responseRate >= 45 ? "gold" : "red"; |
| app/admin/product-estate/page.tsx | 21 | authority | needs authority state check | type SurfaceAuthorityScore, |
| app/admin/product-estate/page.tsx | 22 | authority | needs authority state check | } from "@/lib/product/product-surface-authority"; |
| app/admin/product-estate/page.tsx | 68 | authority | needs authority state check | function SurfaceRow({ surface, score }: { surface: ProductSurface; score?: SurfaceAuthorityScore }) { |
| app/admin/product-estate/page.tsx | 94 | authority | needs authority state check | {surface.authorityGaps.length > 0 ? ( |
| app/admin/product-estate/page.tsx | 95 | authority | needs authority state check | <span className={(surface.authorityGaps[0] ?? "").startsWith("[FAIL]") ? "text-red-300/70" : "text-amber-300/60"}> |
| app/admin/product-estate/page.tsx | 96 | authority | needs authority state check | {(surface.authorityGaps[0] ?? "").slice(0, 80)}{(surface.authorityGaps[0] ?? "").length > 80 ? "…" : ""} |
| app/admin/product-estate/page.tsx | 106 | authority | needs authority state check | function SurfaceTable({ surfaces, scores }: { surfaces: ProductSurface[]; scores: SurfaceAuthorityScore[] }) { |
| app/admin/product-estate/page.tsx | 166 | authority | needs authority state check | Surface-by-surface authority map. Every named surface with a route, CTA, or buyer-facing promise is scored and classified here. |
| app/admin/product-estate/page.tsx | 187 | authority | needs authority state check | { label: "Paid with Gaps", value: paidWithGaps.length.toString(), note: "Paid surfaces with authority gaps", tone: "text-amber-300" }, |
| app/admin/product-estate/page.tsx | 207 | authority | needs authority state check | <SectionHeader label="Paid Surfaces with Authority Gaps" count={paidWithGaps.length} /> |
| app/admin/product-estate/page.tsx | 274 | authority | needs authority state check | Current exposure is more permissive than the authority score warrants. Review and reclassify. |
| app/admin/reporting/executive/page.tsx | 6 | authority | needs authority state check | import { ProductAuthorityPanel } from "@/components/product/ProductAuthorityPanel"; |
| app/admin/reporting/executive/page.tsx | 7 | authority | needs authority state check | import { ProductAuthorityNotice } from "@/components/product/ProductAuthorityNotice"; |
| app/admin/reporting/executive/page.tsx | 9 | authority | needs authority state check | import { resolveProductAuthority, PUBLIC_NON_EXEMPT_PRODUCT_AUTHORITY_CONFIGS } from "@/lib/product/resolve-product-authority"; |
| app/admin/reporting/executive/page.tsx | 70 | authority | needs authority state check | const config = PUBLIC_NON_EXEMPT_PRODUCT_AUTHORITY_CONFIGS.find(c => c.productCode === 'executive_reporting'); |
| app/admin/reporting/executive/page.tsx | 71 | authority | needs authority state check | const contract = config ? resolveProductAuthority(config) : null; |
| app/admin/reporting/executive/page.tsx | 74 | authority | needs authority state check | <ProductAuthorityPanel contract={contract} expanded={true} /> |
| app/admin/reporting/executive/page.tsx | 76 | authority | needs authority state check | <ProductAuthorityNotice contract={contract} /> |
| app/admin/strategy-room/page.tsx | 4 | authority | needs authority state check | redirect("/admin/authority-center"); |
| app/api/admin/boardroom-delivery/generate/route.ts | 18 | authority | needs authority state check | BoardroomDeliveryAuthorityError, |
| app/api/admin/boardroom-delivery/generate/route.ts | 19 | authority | needs authority state check | } from "@/lib/boardroom/boardroom-brief-authority"; |
| app/api/admin/boardroom-delivery/generate/route.ts | 103 | authority | needs authority state check | const authorityResult = assertPaidDeliveryAuthorised({ |
| app/api/admin/boardroom-delivery/generate/route.ts | 118 | authority | needs authority state check | inputSnapshotHash = authorityResult.inputSnapshotHash; |
| app/api/admin/boardroom-delivery/generate/route.ts | 120 | authority | needs authority state check | if (err instanceof BoardroomDeliveryAuthorityError) { |
| app/api/admin/boardroom-delivery/generate/route.ts | 124 | authority | needs authority state check | error: "Paid delivery authority check failed", |
| app/api/admin/boardroom-delivery/generate/route.ts | 126 | authority | needs authority state check | code: "AUTHORITY_REJECTED", |
| app/api/admin/boardroom-delivery/generate/route.ts | 137 | verified | needs authority state check | // For now, the spine is constructed from the verified order record itself. |
| app/api/admin/boardroom-delivery/generate/route.ts | 189 | verified | needs authority state check | label: "Verified Boardroom Brief paid delivery spine", |
| app/api/admin/boardroom-delivery/generate/route.ts | 237 | proven | needs authority state check | provenance: { |
| app/api/admin/boardroom-delivery/generate/route.ts | 256 | verified | needs authority state check | * Build a minimal real IntelligenceSpine from a verified paid order. |
| app/api/admin/boardroom-delivery/generate/route.ts | 279 | verified | needs authority state check | "Generate a paid Boardroom Brief from a verified order for a consequential strategic decision.", |
| app/api/admin/boardroom-delivery/generate/route.ts | 282 | board-ready | unsupported | const blocker = String(meta.blocker ?? "The decision needs board-ready challenge, objection handling, and consequence framing."); |
| app/api/admin/boardroom-delivery/generate/route.ts | 283 | board-ready | unsupported | const forcedAction = String(meta.forcedAction ?? "Produce a board-ready brief and confirm the next admissible move."); |
| app/api/admin/boardroom-delivery/generate/route.ts | 312 | authority | needs authority state check | const signal = SIGNALS.AUTHORITY_LEAKAGE; |
| app/api/admin/boardroom-delivery/generate/route.ts | 326 | authority | needs authority state check | blockerClass: "boardroom_delivery_authority", |
| app/api/admin/boardroom-delivery/generate/route.ts | 362 | verified | needs authority state check | contribution: "Verified paid Boardroom Brief order converted into boardroom delivery spine.", |
| app/api/admin/campaigns/[id]/report/pdf/route.ts | 125 | authority | needs authority state check | authorityType: constitution.authorityType as any, |
| app/api/admin/campaigns/[id]/report/route.ts | 44 | authority | needs authority state check | "authorityType", |
| app/api/admin/campaigns/[id]/report/route.ts | 45 | authority | needs authority state check | constitution.authorityType, |
| app/api/admin/commercial/route.ts | 5 | authority | needs authority state check | import { grantCanonicalEntitlement, resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority"; |
| app/api/admin/commercial/route.ts | 159 | verified | needs authority state check | const verified = await resolveCanonicalEntitlement({ |
| app/api/admin/commercial/route.ts | 164 | verified | needs authority state check | if (!verified.granted \|\| !verified.verified) { |
| app/api/admin/commercial/route.ts | 168 | verified | needs authority state check | // Mark as resolved only after canonical grant is verified |
| app/api/admin/decision/contextual-ranking/route.ts | 54 | authority | needs authority state check | byAuthorityType: byType(profiles, "authorityType"), |
| app/api/admin/decision/efficacy/route.ts | 34 | authority | needs authority state check | authorityGain: number; |
| app/api/admin/decision/efficacy/route.ts | 50 | authority | needs authority state check | authorityImprovements: number \| string \| null; |
| app/api/admin/decision/efficacy/route.ts | 66 | authority | needs authority state check | authorityType?: string \| null; |
| app/api/admin/decision/efficacy/route.ts | 77 | authority | needs authority state check | authorityDelta?: number \| string \| null; |
| app/api/admin/decision/efficacy/route.ts | 93 | authority | needs authority state check | authorityGain: 0, |
| app/api/admin/decision/efficacy/route.ts | 123 | authority | needs authority state check | avgAuthorityGain: Number( |
| app/api/admin/decision/efficacy/route.ts | 124 | authority | needs authority state check | (bucket.followups > 0 ? bucket.authorityGain / bucket.followups : 0).toFixed(4), |
| app/api/admin/decision/efficacy/route.ts | 184 | authority | needs authority state check | authorityImprovements: toNumber(item.authorityImprovements), |
| app/api/admin/decision/efficacy/route.ts | 194 | authority | needs authority state check | const byAuthorityType = new Map<string, ConditionBucket>(); |
| app/api/admin/decision/efficacy/route.ts | 217 | authority | needs authority state check | { map: byAuthorityType, key: safeString(session.authorityType) }, |
| app/api/admin/decision/efficacy/route.ts | 238 | authority | needs authority state check | bucket.authorityGain += Math.max(0, toNumber(followup.authorityDelta)); |
| app/api/admin/decision/efficacy/route.ts | 266 | authority | needs authority state check | byAuthorityType: serializeBucketMap(byAuthorityType), |
| app/api/admin/decision/rebuild-efficacy/route.ts | 51 | authority | needs authority state check | authorityImprovements: number; |
| app/api/admin/decision/rebuild-efficacy/route.ts | 76 | authority | needs authority state check | authorityImprovements: 0, |
| app/api/admin/decision/rebuild-efficacy/route.ts | 145 | authority | needs authority state check | entry.authorityImprovements += Math.max( |
| app/api/admin/decision/rebuild-efficacy/route.ts | 147 | authority | needs authority state check | Number(followup.authorityDelta ?? 0) |
| app/api/admin/decision/rebuild-efficacy/route.ts | 171 | authority | needs authority state check | authorityImprovements: row.authorityImprovements, |
| app/api/admin/decision/rebuild-efficacy/route.ts | 189 | authority | needs authority state check | authorityImprovements: row.authorityImprovements, |
| app/api/admin/decision-instrument-runs/route.ts | 42 | verified | needs authority state check | entitlementVerified: true, |
| app/api/admin/dev-login/route.ts | 6 | verified | needs authority state check | * that is verified against NextAuth in production flows. |
| app/api/admin/enterprise-foundation/route.ts | 6 | authority | needs authority state check | } from "@/lib/enterprise-foundation/authority-foundation"; |
| app/api/admin/intelligence-foundry/performance/run/route.ts | 45 | authority | needs authority state check | { sectionId: "authority", questionId: "q1", prompt: "Decision clarity?", value: 4 }, |
| app/api/admin/intelligence-foundry/performance/run/route.ts | 46 | authority | needs authority state check | { sectionId: "authority", questionId: "q2", prompt: "Ownership clear?", value: 3 }, |
| app/api/admin/intelligence-foundry/performance/run/route.ts | 58 | authority | needs authority state check | authorityFailures: ["CEO override"], |
| app/api/admin/intelligence-foundry/performance/run/route.ts | 63 | authority | needs authority state check | authorityFailures: ["CEO override", "Board bypass"], |
| app/api/admin/retainer/oversight-cycles/route.ts | 5 | authority | needs authority state check | // AUTHORITY RULES: |
| app/api/alignment/enterprise/assessments/route.ts | 108 | validated | needs authority state check | const validated = m.submitEnterpriseAssessmentSchema.safeParse({ |
| app/api/alignment/enterprise/assessments/route.ts | 112 | validated | needs authority state check | if (!validated.success) { |
| app/api/alignment/enterprise/assessments/route.ts | 116 | validated | needs authority state check | validated.error.flatten(), |
| app/api/alignment/enterprise/assessments/route.ts | 120 | validated | needs authority state check | const score = m.scoreEnterpriseAssessment(validated.data.answers); |
| app/api/alignment/enterprise/assessments/route.ts | 129 | validated | needs authority state check | answersJson: validated.data.answers, |
| app/api/alignment/enterprise/campaigns/route.ts | 26 | validated | needs authority state check | const validatedData = createCampaignSchema.parse(body); |
| app/api/alignment/enterprise/campaigns/route.ts | 31 | validated | needs authority state check | id: validatedData.organisationId, |
| app/api/alignment/enterprise/campaigns/route.ts | 34 | validated | needs authority state check | title: validatedData.title, |
| app/api/alignment/enterprise/campaigns/route.ts | 35 | validated | needs authority state check | objective: validatedData.objective ?? null, |
| app/api/alignment/enterprise/campaigns/route.ts | 36 | validated | needs authority state check | opensAt: validatedData.opensAt ? new Date(validatedData.opensAt) : null, |
| app/api/alignment/enterprise/campaigns/route.ts | 37 | validated | needs authority state check | closesAt: validatedData.closesAt ? new Date(validatedData.closesAt) : null, |
| app/api/alignment/enterprise/campaigns/route.ts | 38 | validated | needs authority state check | cadenceType: validatedData.cadenceType, |
| app/api/alignment/enterprise/campaigns/route.ts | 40 | validated | needs authority state check | createdByMembership: validatedData.createdByMembershipId ? { |
| app/api/alignment/enterprise/campaigns/route.ts | 42 | validated | needs authority state check | id: validatedData.createdByMembershipId, |
| app/api/analytics/executive-report/route.ts | 167 | authority | needs authority state check | falseAuthority: spine.flags?.falseAuthority ?? false, |
| app/api/assessments/enterprise/run/route.ts | 4 | authority | needs authority state check | import { buildGenericAuthorityPacket } from "@/lib/diagnostics/evidence-graph"; |
| app/api/assessments/enterprise/run/route.ts | 47 | authority | needs authority state check | (domain.authority + domain.governance + domain.clarity + domain.execution + domain.trust) / 5; |
| app/api/assessments/enterprise/run/route.ts | 66 | authority | needs authority state check | (domain.authority + domain.governance + domain.clarity + domain.execution + domain.trust) / 5, |
| app/api/assessments/enterprise/run/route.ts | 70 | authority | needs authority state check | (domain.authority + domain.governance + domain.clarity + domain.execution + domain.trust) / 5, |
| app/api/assessments/enterprise/run/route.ts | 95 | authority | needs authority state check | const authorityPacket = buildGenericAuthorityPacket({ |
| app/api/assessments/enterprise/run/route.ts | 156 | authority | needs authority state check | tensions: authorityPacket.nodes |
| app/api/assessments/enterprise/run/route.ts | 160 | authority | needs authority state check | evidenceNodes: authorityPacket.nodes, |
| app/api/assessments/enterprise/run/route.ts | 161 | authority | needs authority state check | decisionObject: authorityPacket.decisionObject, |
| app/api/assessments/team/run/route.ts | 4 | authority | needs authority state check | import { buildGenericAuthorityPacket } from "@/lib/diagnostics/evidence-graph"; |
| app/api/assessments/team/run/route.ts | 64 | authority | needs authority state check | const clarityValues = rows.map((row) => row.authorityClarity); |
| app/api/assessments/team/run/route.ts | 74 | authority | needs authority state check | const gap = Math.round(row.authorityClarity - row.executionTrust); |
| app/api/assessments/team/run/route.ts | 78 | authority | needs authority state check | leaderPct: row.authorityClarity, |
| app/api/assessments/team/run/route.ts | 92 | authority | needs authority state check | ? "Leadership likely believes authority is clearer than execution reality supports." |
| app/api/assessments/team/run/route.ts | 110 | authority | needs authority state check | const authorityPacket = buildGenericAuthorityPacket({ |
| app/api/assessments/team/run/route.ts | 125 | authority | needs authority state check | formula: "authority variance + trust gap + average friction / 2", |
| app/api/assessments/team/run/route.ts | 127 | authority | needs authority state check | `Authority variance: ${varianceIndex}`, |
| app/api/assessments/team/run/route.ts | 172 | authority | needs authority state check | tensions: authorityPacket.nodes |
| app/api/assessments/team/run/route.ts | 176 | authority | needs authority state check | evidenceNodes: authorityPacket.nodes, |
| app/api/assessments/team/run/route.ts | 177 | authority | needs authority state check | decisionObject: authorityPacket.decisionObject, |
| app/api/assessments/team/run/route.ts | 182 | authority | needs authority state check | tensions: authorityPacket.nodes |
| app/api/audit/log/route.ts | 152 | verified | needs authority state check | { ok: true, logId, traceId, verifiedAt: nowIso }, |
| app/api/auth/sovereign/route.ts | 18 | authority | needs authority state check | type AuthorityLevel = |
| app/api/auth/sovereign/route.ts | 22 | authority | needs authority state check | \| "AUTHORITY" |
| app/api/checkout/route.ts | 11 | authority | needs authority state check | import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority"; |
| app/api/checkout/route.ts | 131 | verified | needs authority state check | const verified = await ensureEntitlementAfterPayment({ |
| app/api/checkout/route.ts | 138 | verified | needs authority state check | if (!verified.ok \|\| !verified.entitlement?.granted) { |
| app/api/checkout/route.ts | 165 | verified | needs authority state check | entitlement: verified.entitlement, |
| app/api/checkout/route.ts | 166 | verified | needs authority state check | entitlementVerified: verified.entitlement.verified, |
| app/api/checkout/route.ts | 167 | verified | needs authority state check | entitlementRepaired: verified.repaired, |
| app/api/client-portal/dossier-redirect/route.ts | 14 | validated | needs authority state check | //  - Redirect is to the boardroom dossier page with a fresh, validated token |
| app/api/client-portal/send-link/route.ts | 29 | gold | needs authority state check | const GOLD = "#C9A96E"; |
| app/api/client-portal/send-link/route.ts | 41 | gold | needs authority state check | <span style="font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:0.4em;color:${GOLD};"> |
| app/api/client-portal/send-link/route.ts | 52 | gold | needs authority state check | background:rgba(201,169,110,0.1);color:${GOLD};font-family:monospace; |
| app/api/client-portal/send-link/route.ts | 63 | authority | needs authority state check | Abraham of London · Decision Authority Infrastructure |
| app/api/client-portal/send-link/route.ts | 78 | authority | needs authority state check | "Abraham of London · Decision Authority Infrastructure", |
| app/api/constitutional/appeal/route.ts | 6 | authority | needs authority state check | import { createAppeal, type ConstitutionalAction } from '@/lib/constitution/constitutional-authority'; |
| app/api/cron/escalation/route.ts | 43 | verified | needs authority state check | verificationStatus: { not: "verified" }, |
| app/api/decision/guidance/route.ts | 12 | proven | needs authority state check | import { normalisePurposeAlignmentEvidence } from "@/lib/product/field-provenance-normaliser"; |
| app/api/decision/guidance/route.ts | 111 | proven | needs authority state check | provenance: normalisePurposeAlignmentEvidence(paEvidence, { |
| app/api/decisions/return-brief/route.ts | 15 | authority | needs authority state check | // AUTHORITY RULES: |
| app/api/demo/governed-decision/route.ts | 10 | authority | needs authority state check | authorityStated: true, |
| app/api/demo/governed-decision/route.ts | 27 | authority | needs authority state check | required: "Escalate to named authority and replace committee approval with one accountable owner.", |
| app/api/demo/governed-decision/route.ts | 36 | authority | needs authority state check | immediateEffect: "Escalation surfaces the authority vacuum and forces a named authority response.", |
| app/api/demo/governed-decision/route.ts | 43 | authority | needs authority state check | immediateEffect: "Informal authority continues to fill the vacuum.", |
| app/api/diagnostics/evidence/route.ts | 7 | authority | needs authority state check | import { buildGenericAuthorityPacket } from "@/lib/diagnostics/evidence-graph"; |
| app/api/diagnostics/evidence/route.ts | 41 | authority | needs authority state check | authorityInput: z.record(z.string(), z.unknown()).optional().nullable(), |
| app/api/diagnostics/evidence/route.ts | 169 | verified | needs authority state check | const verifiedToken = token |
| app/api/diagnostics/evidence/route.ts | 177 | verified | needs authority state check | if (!identityEmail && !verifiedToken?.ok) { |
| app/api/diagnostics/evidence/route.ts | 188 | verified | needs authority state check | if (!verifiedToken?.ok && requestedSubjectId && identity.subjectId !== requestedSubjectId) { |
| app/api/diagnostics/evidence/route.ts | 270 | verified | needs authority state check | verifiedToken?.ok && |
| app/api/diagnostics/evidence/route.ts | 272 | verified | needs authority state check | verifiedToken.payload.subject !== decision.id && |
| app/api/diagnostics/evidence/route.ts | 273 | verified | needs authority state check | verifiedToken.payload.subject !== decision.sessionId |
| app/api/diagnostics/evidence/route.ts | 286 | verified | needs authority state check | if (verifiedToken?.ok && requestedSubjectId && verifiedToken.payload.subject !== requestedSubjectId) { |
| app/api/diagnostics/evidence/route.ts | 297 | authority | needs authority state check | const authorityInput = isObject(body?.authorityInput) ? body.authorityInput : null; |
| app/api/diagnostics/evidence/route.ts | 298 | authority | needs authority state check | const generatedPacket = authorityInput |
| app/api/diagnostics/evidence/route.ts | 299 | authority | needs authority state check | ? buildGenericAuthorityPacket({ |
| app/api/diagnostics/evidence/route.ts | 301 | authority | needs authority state check | condition: s(authorityInput.condition, "Diagnostic condition"), |
| app/api/diagnostics/evidence/route.ts | 302 | authority | needs authority state check | contradiction: s(authorityInput.contradiction, "Contradiction evidence recorded."), |
| app/api/diagnostics/evidence/route.ts | 303 | authority | needs authority state check | decisionText: s(authorityInput.decisionText) \|\| null, |
| app/api/diagnostics/evidence/route.ts | 304 | authority | needs authority state check | constraintText: s(authorityInput.constraintText) \|\| null, |
| app/api/diagnostics/evidence/route.ts | 305 | authority | needs authority state check | priorAttemptText: s(authorityInput.priorAttemptText) \|\| null, |
| app/api/diagnostics/evidence/route.ts | 306 | authority | needs authority state check | costOfDelayText: s(authorityInput.costOfDelayText) \|\| null, |
| app/api/diagnostics/evidence/route.ts | 307 | authority | needs authority state check | stakeholderText: s(authorityInput.stakeholderText) \|\| null, |
| app/api/diagnostics/evidence/route.ts | 308 | authority | needs authority state check | affectedDomain: s(authorityInput.affectedDomain) \|\| null, |
| app/api/diagnostics/evidence/route.ts | 309 | authority | needs authority state check | firstMove: s(authorityInput.firstMove, "Name the first corrective move and owner."), |
| app/api/diagnostics/evidence/route.ts | 310 | authority | needs authority state check | skippedConsequence: s(authorityInput.skippedConsequence, "The condition remains unpriced and unmanaged."), |
| app/api/diagnostics/evidence/route.ts | 311 | authority | needs authority state check | escalationCondition: s(authorityInput.escalationCondition, "Escalate if the contradiction repeats in the next stage."), |
| app/api/diagnostics/evidence/route.ts | 312 | authority | needs authority state check | riskScore: typeof authorityInput.riskScore === "number" ? authorityInput.riskScore : 50, |
| app/api/diagnostics/evidence/route.ts | 313 | authority | needs authority state check | formula: s(authorityInput.formula, "stage risk score"), |
| app/api/diagnostics/evidence/route.ts | 314 | authority | needs authority state check | reasoning: Array.isArray(authorityInput.reasoning) |
| app/api/diagnostics/evidence/route.ts | 315 | authority | needs authority state check | ? authorityInput.reasoning.map(String).filter(Boolean) |
| app/api/diagnostics/evidence/route.ts | 317 | authority | needs authority state check | confidence: typeof authorityInput.confidence === "number" ? authorityInput.confidence : 0.65, |
| app/api/diagnostics/evidence/route.ts | 318 | authority | needs authority state check | payload: isObject(authorityInput.payload) ? authorityInput.payload : undefined, |
| app/api/diagnostics/longitudinal/route.ts | 168 | authority | needs authority state check | authorityType: "UNCLEAR", |
| app/api/diagnostics/longitudinal/route.ts | 184 | authority | needs authority state check | authorityClarity: 50, |
| app/api/diagnostics/longitudinal/route.ts | 198 | authority | needs authority state check | // Authority contract: every diagnostic response includes these fields |
| app/api/diagnostics/longitudinal/route.ts | 212 | authority | needs authority state check | // Authority contract |
| app/api/diagnostics/multi-stakeholder/route.ts | 177 | authority | needs authority state check | // Authority contract |
| app/api/diagnostics/multi-stakeholder/route.ts | 187 | authority | needs authority state check | // Authority contract |
| app/api/diagnostics/outcome/route.ts | 174 | authority | needs authority state check | // Authority contract |
| app/api/diagnostics/outcome/route.ts | 185 | authority | needs authority state check | // Authority contract |
| app/api/downloads/[slug]/route.ts | 7 | authority | needs authority state check | import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority"; |
| app/api/enterprise-foundation/dependencies/route.ts | 3 | authority | needs authority state check | import { createDecisionDependency, getDecisionImpactView } from "@/lib/enterprise-foundation/authority-foundation"; |
| app/api/enterprise-foundation/playbooks/route.ts | 4 | authority | needs authority state check | import { applyEnforcementPlaybook, createEnforcementPlaybook } from "@/lib/enterprise-foundation/authority-foundation"; |
| app/api/enterprise-foundation/stakeholders/route.ts | 4 | authority | needs authority state check | import { createDecisionStakeholder } from "@/lib/enterprise-foundation/authority-foundation"; |
