# Messaging Rewrite Action Register

**Date:** 2026-05-09
**Purpose:** Prioritised implementation list for all messaging corrections identified in the surface integrity audit.

---

## P0 — Critical Path (Ship blockers)

These must be resolved before the current messaging can be considered safe.

### P0-01: Suppress "AI-accelerated market baseline"
- **Files:** `pages/diagnostics/index.tsx` (~line 418), `pages/diagnostics/executive-reporting/run.tsx` (~line 2265), `pages/strategy-room/index.tsx`
- **Action:** Delete the line entirely from all three locations.
- **Reason:** Uses AI as a marketing adjective. Makes an unsubstantiated benchmark claim. The single most damaging phrase in the product.

### P0-02: Fix product identity on Navbar
- **File:** `components/Navbar.tsx`
- **Action:** Replace "Institutional Platform" sub-label with "Decision Infrastructure."
- **Action:** Replace primary CTA "Counsel" → "Test a Decision" linking to `/diagnostics/fast`.
- **Reason:** Three different product identities across persistent surfaces. Counsel CTA bypasses earned progression.

### P0-03: Rewrite Footer body text
- **File:** `components/EnhancedFooter.tsx`
- **Action:** Replace "A platform for disciplined thinking: doctrine, systems, and strategic execution arranged for leaders, builders, and institutions that intend to endure" with Decision Infrastructure description.
- **Action:** Replace tagline "Governance — Architecture — Execution" with "Decision Infrastructure."
- **Action:** Replace CTA "Enter Strategy Room" → "Test a Decision" → `/diagnostics/fast`.
- **Action:** Replace "before forcing a solution" → "before forcing an intervention."
- **Action:** Replace "Score-based routing" → "Evidence-based routing."
- **Reason:** Footer reads as luxury consultancy. Undermines product identity.

### P0-04: Fix PublicProofBlocks evidence classification
- **File:** `components/proof/PublicProofBlocks.tsx`
- **Action:** Replace `VERIFIED_CASE_EVIDENCE` with `SELF_REPORTED_AGGREGATE` on AccuracyMetricsBlock.
- **Action:** Fix minimum sample threshold from 5 to 15 (matching standards page).
- **Action:** Add source label: "Based on N self-reported accuracy responses."
- **Reason:** Directly contradicts the evidence standards page. Integrity risk.

### P0-05: Add trust posture to Executive Reporting gate
- **File:** `pages/diagnostics/executive-reporting.tsx`
- **Action:** Add ArbiterBadge, GovernanceDisclosure.
- **Action:** Add cost disclaimer matching fast.tsx: "Based on your stated decision context. Scenario only."
- **Action:** Soften "It IS a decision structure failure" → "The evidence you surfaced suggests a decision structure problem."
- **Reason:** The paid conversion point has weaker trust posture than the free diagnostic.

### P0-06: Homepage dead code cleanup
- **File:** `pages/index.tsx`
- **Action:** Delete all unused component definitions (~1,500 lines): HomeHero, PlatformArchitecture, FlagshipIntelligence, FlagshipAdvisory, FlagshipPublication, FlagshipBlogStrip, DiagnosticLadder, EscalationClose, HowItWorksLadder, ProductClarity, ContentLibrarySection, ProofLayer, HomeDecisionLayer, HomeFinalCta.
- **Reason:** Dead code contains flagged terms, stale checkout integrations, and maintenance hazard.

### P0-07: Homepage trust section expansion
- **File:** `pages/index.tsx` (CategoryFrontDoor Section 7)
- **Action:** Expand from 6-line strip to full evidence block with 7 trust dimensions (per homepage-message-rebuild-brief.md).
- **Action:** Replace "recommendation" → "directive" in "Every governed recommendation is auditable."
- **Reason:** Trust is the product's primary differentiator and is currently a whisper strip.

### P0-08: Update stale `/consulting` links
- **Files:** `components/homepage/StrategicFunnelStrip.tsx`, `ServiceLines.tsx`, `MilestonesTimeline.tsx`, `HeroSection.tsx`, `CinematicHero.tsx`, `OGRFlagshipSection.tsx`, `QuickActionBar.tsx`, `makeContentPage.tsx`, `LuxuryNavbar.tsx`, `InstitutionalNav.tsx`, `inner-circle/WorkspaceNav.tsx`, `navigation/SurfaceAwareNav.tsx`, `diagnostics/InheritedSignalBanner.tsx`, `diagnostics/SeriousBuyerGate.tsx`, `alignment/EnterpriseAdvisoryCTA.tsx`, `pages/strategy/index.tsx`, `pages/editorials/[slug].tsx`, `pages/artifacts/global-market-outlook-q1-2026-public.tsx`, `pages/constitution/command-centre.tsx`
- **Action:** Update href from `/consulting` to `/counsel` and label from "Consulting" to "Counsel Review" (where appropriate).
- **Reason:** 30+ stale references to retired route.

### P0-09: Remove "V2.2 sovereign routing kernel" from user-facing display
- **File:** `pages/diagnostics/constitutional-diagnostic.tsx` (~line 315)
- **Action:** Remove the version/kernel label entirely from rendered output.
- **Reason:** Literal internal architecture name exposed to users.

### P0-10: Remove Strategy Room "Private advisory" and "Contact" links
- **File:** `pages/strategy-room/index.tsx`
- **Action:** Remove "Private advisory" link text and "Contact" fallback from gate block.
- **Reason:** These make the governed system look like a consulting firm with a sales team.

---

## P1 — High Priority (Within 1 week)

### P1-01: Replace "advisory" across trust components
- **Files:** `DiagnosticStandardPanel.tsx`, `EvidenceTierBadge.tsx`, `GovernanceDisclosure.tsx`
- **Action:** Replace "professional advisory support" → "independent professional review." Replace "advisory review" → "operator review" or "analyst review."

### P1-02: Fix "verified" across outcome surfaces
- **Files:** `pages/boardroom/[sessionId].tsx`, `pages/account/proof-pack.tsx`
- **Action:** Replace "Verified outcomes: N" → "Outcomes with user-reported verification: N." Replace "Recommended board actions" → "Board actions surfaced by governance."

### P1-03: Fix evidence index overclaim
- **File:** `pages/evidence/index.tsx`
- **Action:** Replace "outcome-verified cases" badge → "case dossiers" or "static proof assets." Replace "System insight" → "System interpretation." Add "Static proof asset" label to index page.

### P1-04: Replace "recommendation" across counsel surfaces
- **Files:** `lib/product/counsel-room-contract.ts`, counsel pages, `CounselCaseTimeline.tsx`
- **Action:** Replace `COUNSEL_RECOMMENDED` label text with "Counsel Review is warranted." Replace "Capture the recommendation" → "Capture the counsel position." Replace "governedRecommendations" → "governedDirectives" (where user-facing).

### P1-05: Add evidence posture to email templates
- **Files:** `lib/email/templates/return-brief.ts`, `lib/email/templates/oversight-brief.ts`
- **Action:** Add evidence posture line template. Add footer: "This brief is based on recorded evidence and is not independently verified." Reduce oversight email CTAs from 3 to 2 (move Approve to brief page).

### P1-06: Fix "Decision Authority as a Service" on retainer page
- **File:** `pages/retainer.tsx`
- **Action:** Replace eyebrow "Decision Authority as a Service" → "Retained Decision Enforcement."

### P1-07: Sharpen counsel index — add what-counsel-IS block
- **File:** `pages/counsel/index.tsx`
- **Action:** Add brief description of what counsel review produces. Replace "the system has enough evidence to determine" → "the evidence crosses the threshold for."

### P1-08: Remove "Scenario weights" from artifacts page
- **File:** `pages/artifacts.tsx` (~line 973)
- **Action:** Replace "Scenario weights are derived from policy trajectory analysis" → "Scenario positioning is derived from policy trajectory analysis."

### P1-09: Generalize "do not publish" list on evidence standards
- **File:** `pages/evidence/standards.tsx` (lines 153-157)
- **Action:** Replace specific architecture names with generic descriptions: "Internal classification methods, routing logic, computational structures, and proprietary operating architecture."

### P1-10: Rename ProductRecommendationCard file
- **File:** `components/commercial/ProductRecommendationCard.tsx`
- **Action:** Rename file to `ProductAdmissionCard.tsx`. Remove backward-compatibility export.

---

## P2 — Medium Priority (Within 2 weeks)

### P2-01: Replace "unlock" across Inner Circle and access surfaces
- **Files:** `AccessGate.tsx`, `DownloadCard.tsx`, `DownloadHero.tsx`, `PatternObservatory.tsx`, `inner-circle/EmptyState.tsx`, `inner-circle/QuickActions.tsx`, `inner-circle/StatsOverview.tsx`, `vault/index.tsx`
- **Action:** Replace "Unlock" → "Access" or "Enter." Replace "Upgrade Now" → earned-progression language.

### P2-02: Replace "insight" across content surfaces
- **Files:** `types/site.d.ts`, `AuthorBio.tsx`, `BlogFooter.tsx`, `BlogSidebar.tsx`, `layout/Footer.tsx`, `inner-circle/QuickActions.tsx`, `inner-circle/StatsOverview.tsx`, `inner-circle/EmptyState.tsx`, `ContentPortal.tsx`
- **Action:** Replace "insights" → "readings" or "intelligence" or "signals." Replace "Strategic Insights" site description.

### P2-03: Replace "dashboard" in user-facing routes
- **Files:** `pages/dashboard/diagnostics.tsx`, `pages/counsel/index.tsx` (retainer dashboard reference)
- **Action:** Replace "Dashboard" → "Decision Centre" or "Record."

### P2-04: Fix "consulting" reference in ProofCapturePrompt
- **File:** `components/proof/ProofCapturePrompt.tsx`
- **Action:** Replace "more specific than generic consulting advice" → "more specific than generic external advice."

### P2-05: Move scoring logic server-side
- **Files:** `ConstitutionalDiagnostic.tsx`, `pages/diagnostics/team-assessment.tsx`, `pages/diagnostics/enterprise-assessment.tsx`
- **Action:** Move threshold logic, scoring dimensions, and routing decisions to API routes. Return only computed results to client.

### P2-06: Strip ArbiterBadge code comment
- **File:** `components/trust/ArbiterBadge.tsx`
- **Action:** Replace "Does NOT expose the five arbiter rules, tournament mechanics, or scoring logic" → "Does not expose internal validation system architecture."

### P2-07: Fix "clarity" in fallback proof block
- **File:** `components/proof/PublicProofBlocks.tsx`
- **Action:** Replace "execution clarity restored" → "execution coherence restored."

### P2-08: Rename internal analytics module
- **File:** `lib/analytics/funnel.ts`
- **Action:** Rename to `lib/analytics/journey-progression.ts` or `lib/analytics/engagement.ts`.

### P2-09: Replace "Institutional guarantee" in books
- **File:** `components/books/PurchaseOptions.tsx`
- **Action:** Remove "Institutional guarantee" or replace with specific, evidence-backed claim.

### P2-10: Verify LogoWall "Trusted by" claim
- **File:** `components/branding/LogoWall.tsx`
- **Action:** Verify each logo represents a consented, real client relationship. If not, remove the aria-label or the component.
