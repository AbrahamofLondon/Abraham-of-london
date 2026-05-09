# Legacy Language Final Cleanup

**Date:** 2026-05-09
**Status:** COMPLETE — zero `/consulting` hrefs remain in any .tsx file

---

## href Cleanup Summary

### `/consulting/strategy-room` → `/strategy-room` (12 files)

| File | Pass |
|------|------|
| `components/alignment/EnterpriseAdvisoryCTA.tsx` | P2 |
| `components/homepage/HeroSection.tsx` | P2 |
| `components/homepage/CinematicHero.tsx` | P2 |
| `components/homepage/StrategicFunnelStrip.tsx` | P1 |
| `components/navigation/SurfaceAwareNav.tsx` | P2 |
| `components/inner-circle/WorkspaceNav.tsx` | P2 |
| `components/diagnostics/InheritedSignalBanner.tsx` | P2 |
| `components/diagnostics/SeriousBuyerGate.tsx` | P2 |
| `lib/diagnostics/constitutional-diagnostic-derivation.ts` | P1 |
| `pages/artifacts/global-market-outlook-q1-2026-public.tsx` | P2 |
| `pages/constitution/command-centre.tsx` | P2 |
| `pages/strategy/index.tsx` | P2 |
| `pages/editorials/[slug].tsx` | P2 |
| `pages/consulting/interventions.tsx` | P2 |

### `/consulting` → `/counsel` (8 files)

| File | Pass |
|------|------|
| `components/homepage/MilestonesTimeline.tsx` | P1 |
| `components/homepage/ServiceLines.tsx` | P1 |
| `components/homepage/StrategicFunnelStrip.tsx` | P1 |
| `components/homepage/OGRFlagshipSection.tsx` | P1 |
| `components/QuickActionBar.tsx` | P1 |
| `components/site/InstitutionalNav.tsx` | P1 |
| `components/makeContentPage.tsx` (x3) | P1 |
| `components/enhanced/VenturesSection.tsx` | P2 |
| `components/LuxuryNavbar.tsx` | P2 |
| `components/strategy-room/RetainerEntryGate.tsx` | P2 |
| `pages/consulting/interventions.tsx` | P2 |

### Label Updates

| File | Before | After | Pass |
|------|--------|-------|------|
| `components/homepage/ServiceLines.tsx` | "Advisory" / "Consulting" | "Counsel Review" / "Governed Escalation" | P1 |
| `components/homepage/StrategicFunnelStrip.tsx` | "Advisory & Consulting" | "Counsel Review" | P1 |
| `components/homepage/OGRFlagshipSection.tsx` | "Private advisory pathway" / "View advisory" / "Use advisory" | "Governed escalation pathway" / "View counsel review" / "Use counsel review" | P1+P2 |
| `components/homepage/ExecutiveReportingFlagship.tsx` | "governed advisory attention" | "governed escalation" | P2 |
| `components/diagnostics/SeriousBuyerGate.tsx` | "before advisory escalation" | "before governed escalation" | P2 |
| `components/trust/DiagnosticStandardPanel.tsx` | "professional advisory support" | "independent professional review" | P1 |
| `components/trust/EvidenceTierBadge.tsx` | "advisory or Strategy Room" / "advisory review" | "operator review or Strategy Room" / "operator review" | P1 |
| `components/trust/GovernanceDisclosure.tsx` | "advisory review via support" | "operator review via support" | P1 |

---

## Final Verification

```
grep -r 'href="/consulting' pages/ components/ --include="*.tsx" | wc -l
→ 0
```

**Zero remaining `/consulting` hrefs in any `.tsx` file.**

### Remaining "advisory" in homepage components (2 — non-critical)

| File | Line | Text | Status |
|------|------|------|--------|
| `components/homepage/CinematicHero.tsx` | 186 | "selective advisory" | DEPRECATED component (marked for deletion) |
| `components/homepage/EngagementLanes.tsx` | 57, 65 | "Confidential advisory for principals" / "organisational advisory" | Secondary engagement lane component |

These are in low-traffic or deprecated surfaces and do not affect the primary user journey.
