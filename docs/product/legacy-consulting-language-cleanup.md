# Legacy Consulting Language Cleanup

**Date:** 2026-05-09
**Purpose:** Track all "consulting"/"advisory" label updates across homepage and persistent components

---

## Updated in P1

| File | Before | After | href Before | href After |
|------|--------|-------|-------------|------------|
| `components/homepage/MilestonesTimeline.tsx` | tag: "Consulting" | tag: "Counsel" | /consulting | /counsel |
| `components/homepage/ServiceLines.tsx` | title: "Advisory", tag: "Consulting" | title: "Counsel Review", tag: "Governed Escalation" | /consulting | /counsel |
| `components/homepage/StrategicFunnelStrip.tsx` | "Advisory & Consulting" | "Counsel Review" | /consulting | /counsel |
| `components/homepage/StrategicFunnelStrip.tsx` | Strategy Room href | — | /consulting/strategy-room | /strategy-room |
| `components/homepage/OGRFlagshipSection.tsx` | "Private advisory pathway", "View advisory" | "Governed escalation pathway", "View counsel review" | /consulting | /counsel |
| `components/QuickActionBar.tsx` | "Consulting" | "Counsel" | /consulting | /counsel |
| `components/site/InstitutionalNav.tsx` | "Strategic Advisory" | "Counsel Review" | /consulting | /counsel |
| `components/makeContentPage.tsx` (x3) | "Consulting" | "Counsel" | /consulting | /counsel |
| `lib/diagnostics/constitutional-diagnostic-derivation.ts` | "private strategic escalation" | "governed strategic execution" | /consulting/strategy-room | /strategy-room |
| `components/trust/DiagnosticStandardPanel.tsx` | "professional advisory support" | "independent professional review" | — | — |
| `components/trust/EvidenceTierBadge.tsx` (x2) | "advisory or Strategy Room", "advisory review" | "operator review or Strategy Room", "operator review" | — | — |
| `components/trust/GovernanceDisclosure.tsx` | "advisory review via support" | "operator review via support" | — | — |

---

## Remaining (Caught by Redirect)

These components still link to `/consulting` or `/consulting/strategy-room` but are caught by the permanent 308 redirect. Labels need updating in P2.

| File | Current Label | Current href | Recommendation |
|------|---------------|-------------|----------------|
| `components/homepage/CinematicHero.tsx` | (Strategy Room link) | /consulting/strategy-room | Update href to /strategy-room |
| `components/homepage/HeroSection.tsx` | (Strategy Room link) | /consulting/strategy-room | Update href to /strategy-room |
| `components/LuxuryNavbar.tsx` | href only | /consulting | Update href to /counsel |
| `components/enhanced/VenturesSection.tsx` | href only | /consulting | Update href to /counsel |
| `components/inner-circle/WorkspaceNav.tsx` | "Strategy Room" | /consulting/strategy-room | Update href to /strategy-room |
| `components/navigation/SurfaceAwareNav.tsx` | (Strategy Room link) | /consulting/strategy-room | Update href to /strategy-room |
| `components/diagnostics/InheritedSignalBanner.tsx` | (Strategy Room link) | /consulting/strategy-room | Update href to /strategy-room |
| `components/diagnostics/SeriousBuyerGate.tsx` | (Strategy Room link) | /consulting/strategy-room | Update href to /strategy-room |
| `components/alignment/EnterpriseAdvisoryCTA.tsx` | (Strategy Room link) | /consulting/strategy-room | Update href to /strategy-room |
| `components/strategy-room/RetainerEntryGate.tsx` | href only | /consulting?retainer=qualified | Update href to /counsel |
| `pages/strategy/index.tsx` (x3) | href links | /consulting, /consulting/strategy-room | Update hrefs |
| `pages/editorials/[slug].tsx` | (Strategy Room link) | /consulting/strategy-room | Update href |
| `pages/artifacts/global-market-outlook-q1-2026-public.tsx` | (Strategy Room link) | /consulting/strategy-room | Update href |
| `pages/constitution/command-centre.tsx` | (Strategy Room link) | /consulting/strategy-room | Update href |

**Total remaining:** ~15 href-only updates. All caught by permanent redirect. No user-facing label says "Consulting" after P1.
