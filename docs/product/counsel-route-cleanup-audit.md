# Counsel Route Cleanup Audit

**Date:** 8 May 2026
**Method:** File-level audit of every route/link referencing consulting, advisory, or counsel.

---

## Route Classification

| Route | Classification | Action |
|-------|---------------|--------|
| `/counsel` | `CANONICAL_COUNSEL` | New governed escalation chamber |
| `/counsel/intake` | `CANONICAL_COUNSEL` | Structured counsel intake |
| `/api/counsel/intake` | `CANONICAL_COUNSEL` | Counsel intake API |
| `/consulting` | `LEGACY_REDIRECTED` | Permanent redirect to `/counsel` |
| `/consulting/index` | `LEGACY_REDIRECTED` | Old brochure page — still exists but should be retired |
| `/consulting/interventions` | `OPERATOR_ONLY` | Admin surface — keep as-is |
| `/consulting/strategy-room` | `LEGACY_REDIRECTED` | Already redirects to `/strategy-room` |
| `/contact` | `NON_PRODUCT_MARKETING_ONLY` | Keep for non-counsel enquiries only |
| `/private-clients` | `LEGACY_MARKETING` | Static page — candidate for retirement |

---

## Link Cleanup Status

| File | Old Link | New Link | Status |
|------|----------|----------|--------|
| `components/Navbar.tsx` | `/consulting` | `/counsel` | ✅ FIXED |
| `components/EnhancedFooter.tsx` | `/consulting` | `/counsel` | ✅ FIXED |
| `pages/index.tsx` | `/consulting` | `/counsel` | ✅ FIXED |
| `pages/consulting.tsx` | — | `/counsel` | ✅ CREATED (redirect) |
| `components/LuxuryNavbar.tsx` | `/consulting` | Not updated | ❌ STILL LEGACY |
| `components/QuickActionBar.tsx` | `/consulting` | Not updated | ❌ STILL LEGACY |
| `components/site/InstitutionalNav.tsx` | `/consulting` | Not updated | ❌ STILL LEGACY |
| `components/makeContentPage.tsx` | `/consulting` | Not updated | ❌ STILL LEGACY |
| `components/homepage/StrategicFunnelStrip.tsx` | `/consulting` | Not updated | ❌ STILL LEGACY |
| `components/homepage/MilestonesTimeline.tsx` | `/consulting` | Not updated | ❌ STILL LEGACY |
| `components/homepage/OGRFlagshipSection.tsx` | `/consulting` | Not updated | ❌ STILL LEGACY |
| `components/homepage/ServiceLines.tsx` | `/consulting` | Not updated | ❌ STILL LEGACY |
| `components/homepage/CinematicHero.tsx` | `/consulting/strategy-room` | Not updated | ❌ STILL LEGACY |
| `components/homepage/HeroSection.tsx` | `/consulting/strategy-room` | Not updated | ❌ STILL LEGACY |
| `components/enhanced/VenturesSection.tsx` | `/consulting` | Not updated | ❌ STILL LEGACY |
| `components/alignment/EnterpriseAdvisoryCTA.tsx` | `/consulting/strategy-room` | Not updated | ❌ STILL LEGACY |
| `components/diagnostics/InheritedSignalBanner.tsx` | `/consulting/strategy-room` | Not updated | ❌ STILL LEGACY |
| `components/diagnostics/SeriousBuyerGate.tsx` | `/consulting/strategy-room` | Not updated | ❌ STILL LEGACY |
| `components/strategy-room/RetainerEntryGate.tsx` | `/consulting?retainer=qualified` | Not updated | ❌ STILL LEGACY |
| `components/navigation/SurfaceAwareNav.tsx` | `/consulting/strategy-room` | Not updated | ❌ STILL LEGACY |
| `components/inner-circle/WorkspaceNav.tsx` | `/consulting/strategy-room` | Not updated | ❌ STILL LEGACY |
| `pages/strategy/index.tsx` | `/consulting` | Not updated | ❌ STILL LEGACY |
| `pages/decision-paths/index.tsx` | `/consulting/strategy-room` | Not updated | ❌ STILL LEGACY |
| `pages/editorials/[slug].tsx` | `/consulting/strategy-room` | Not updated | ❌ STILL LEGACY |
| `pages/artifacts/global-market-outlook-...tsx` | `/consulting/strategy-room` | Not updated | ❌ STILL LEGACY |
| `pages/constitution/command-centre.tsx` | `/consulting/strategy-room` | Not updated | ❌ STILL LEGACY |

---

## Summary

| Classification | Count |
|---------------|-------|
| `CANONICAL_COUNSEL` | 3 |
| `LEGACY_REDIRECTED` | 3 |
| `OPERATOR_ONLY` | 1 |
| `NON_PRODUCT_MARKETING_ONLY` | 1 |
| `LEGACY_MARKETING` | 1 |
| `STILL_LEGACY` | 22 |

**22 links still point to `/consulting` or `/consulting/strategy-room`.** These are in marketing components (homepage, nav, footer) and will redirect correctly via the `/consulting` → `/counsel` permanent redirect. The most critical product-path links (Navbar, Footer, homepage) have been updated. The remaining legacy links are in secondary marketing components that will resolve through the redirect.
