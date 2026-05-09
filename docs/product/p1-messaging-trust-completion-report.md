# P1 Messaging + Trust Completion Report

**Date:** 2026-05-09
**Scope:** Homepage trust, ER gate credibility, legacy label cleanup, IP containment, Inner Circle language
**Standard:** Decision Infrastructure — one identity, one trust posture, one earned-progression doctrine

---

## Files Changed

| File | Changes |
|------|---------|
| `components/homepage/CategoryFrontDoor.tsx` | Trust section expanded from 6-line whisper strip to 8-card "How trust is protected" block with evidence link |
| `pages/diagnostics/executive-reporting.tsx` | "It is a decision structure failure" → "The evidence suggests a decision structure problem"; paywall title "board-grade clarity" → "governed priority stack"; description rewritten with method disclosure; trust/method panel added to "How this was determined" section |
| `components/trust/DiagnosticStandardPanel.tsx` | "professional advisory support" → "independent professional review" |
| `components/trust/EvidenceTierBadge.tsx` | "advisory or Strategy Room" → "operator review or Strategy Room"; "upgraded through...advisory review" → "strengthened through...operator review" |
| `components/trust/GovernanceDisclosure.tsx` | "advisory review via support" → "operator review via support" |
| `components/diagnostics/ConstitutionalDiagnostic.tsx` | Scoring dimensions (Authority%, Coherence%, Pressure%, Seriousness%) removed from IntelligenceGainPanel — replaced with Readiness and Posture labels; product posture dev-language rewritten |
| `lib/diagnostics/constitutional-diagnostic-derivation.ts` | Strategy Room href "/consulting/strategy-room" → "/strategy-room"; "private strategic escalation" → "governed strategic execution" |
| `components/inner-circle/EmptyState.tsx` | "Unlock premium content" → "Access earned-tier content"; "Get exclusive insights" → "Receive governed intelligence"; "Access advanced tools" → "Enter advanced instruments"; "Upgrade your tier for exclusive access" → "Progress your tier through engagement"; "Upgrade Now" → "Progress Now" |
| `components/inner-circle/QuickActions.tsx` | "Upgrade Plan" → "Advance Your Plan"; "Unlock premium features" → "Access higher-tier features" |
| `components/inner-circle/StatsOverview.tsx` | "unlock higher tiers" → "progress to higher tiers" |
| `components/DownloadCard.tsx` | "Unlock Access" → "Request Access" |
| `components/homepage/MilestonesTimeline.tsx` | "Consulting" tag → "Counsel"; href "/consulting" → "/counsel" |
| `components/homepage/ServiceLines.tsx` | "Advisory" title → "Counsel Review"; "Consulting" tag → "Governed Escalation"; body rewritten; href → "/counsel" |
| `components/homepage/StrategicFunnelStrip.tsx` | "Advisory & Consulting" → "Counsel Review"; "Direct engagement" → "Governed escalation"; description rewritten; href → "/counsel"; Strategy Room href → "/strategy-room" |
| `components/homepage/OGRFlagshipSection.tsx` | "Private advisory pathway" → "Governed escalation pathway"; "View advisory" → "View counsel review"; href → "/counsel" |
| `components/QuickActionBar.tsx` | "Consulting" → "Counsel"; href → "/counsel" |
| `components/site/InstitutionalNav.tsx` | "Strategic Advisory" → "Counsel Review"; href → "/counsel" |
| `components/makeContentPage.tsx` | All 3 instances of "/consulting" → "/counsel", "Consulting" → "Counsel" |

---

## Summary of Changes by Category

### 1. Homepage Trust Section
- **Before:** 6 bullet points in small text, including "Every governed recommendation is auditable"
- **After:** 8 structured trust cards under "How trust is protected" heading with evidence standards link
- **Cards cover:** Source-labelled evidence, no fabricated verification, refusal authority, commitment memory, evidence suppression, protected internals, challenge route, earned progression

### 2. ER Gate Trust Upgrade
- **Before:** Assertive "It IS a decision structure failure" with no cost disclaimer, no method transparency
- **After:** Softened to "The evidence suggests"; paywall description explains what ER does and does not claim; trust panel added with 5 specific evidence/limitation disclosures

### 3. Advisory Language Removal
- **Trust components:** All 3 files (DiagnosticStandardPanel, EvidenceTierBadge, GovernanceDisclosure) cleaned
- **Homepage components:** 7 files updated, all "advisory"/"consulting" labels replaced

### 4. Legacy Consulting Labels
- **Before:** ~15 homepage-adjacent components with "Consulting"/"Advisory" labels
- **After:** 10 components updated in this pass. Remaining are in deeper legacy pages caught by permanent redirect.

### 5. Inner Circle SaaS Language
- **Before:** "Unlock premium content", "Upgrade Now", "Unlock premium features"
- **After:** "Access earned-tier content", "Progress Now", "Access higher-tier features"

### 6. Constitutional Diagnostic IP Containment
- **Before:** Authority%, Coherence%, Pressure%, Seriousness% raw scores displayed to users
- **After:** Only Readiness tier and Posture (computed labels, not raw scores) shown. Dev-language product posture text rewritten.
- **Route fix:** `/consulting/strategy-room` → `/strategy-room`

---

## Remaining Risks

| Risk | Severity | Location | Recommendation |
|------|----------|----------|----------------|
| Constitutional scoring thresholds still in client-side derivation lib | MEDIUM | `lib/diagnostics/constitutional-diagnostic-derivation.ts` | P2: Move scoring logic server-side |
| ~15 more legacy `/consulting` hrefs in deeper components | LOW | Various (CinematicHero, HeroSection, LuxuryNavbar, etc.) | Caught by permanent redirect; update labels in P2 |
| "advisory" in pages/consulting/index.tsx (full page) | LOW | `pages/consulting/index.tsx` | Full page is legacy; redirect catches users |
| "advisory" in contact.tsx form options | MEDIUM | `pages/contact.tsx` | Update form option labels in P2 |
| "advisory" in refund-policy.tsx | LOW | Legal page | Consider whether legal language should change |
| "premium" in download/artifact descriptions | LOW | Various | Context-dependent; some uses describe quality, not paywall |
| Inner Circle prop names (onUpgrade, isPremium) | LOW | Internal code, not rendered | Cosmetic debt, not user-facing |
