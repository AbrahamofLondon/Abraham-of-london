# Inner Circle Language Cleanup

**Date:** 2026-05-09
**Purpose:** Remove SaaS paywall language from Inner Circle and access-gated surfaces

---

## Changes Made

| File | Line | Before | After |
|------|------|--------|-------|
| `components/inner-circle/EmptyState.tsx` | 94 | "Unlock premium content" | "Access earned-tier content" |
| `components/inner-circle/EmptyState.tsx` | 95 | "Get exclusive insights" | "Receive governed intelligence" |
| `components/inner-circle/EmptyState.tsx` | 96 | "Access advanced tools" | "Enter advanced instruments" |
| `components/inner-circle/EmptyState.tsx` | 97 | "Join elite community" | "Join the inner circle" |
| `components/inner-circle/EmptyState.tsx` | 171 | "Upgrade your tier for exclusive access" | "Progress your tier through engagement" |
| `components/inner-circle/EmptyState.tsx` | 177 | "Upgrade Now" | "Progress Now" |
| `components/inner-circle/QuickActions.tsx` | 52 | "Upgrade Plan" | "Advance Your Plan" |
| `components/inner-circle/QuickActions.tsx` | 53 | "Unlock premium features" | "Access higher-tier features" |
| `components/inner-circle/StatsOverview.tsx` | 178 | "unlock higher tiers" | "progress to higher tiers" |
| `components/DownloadCard.tsx` | 227 | "Unlock Access" | "Request Access" |

---

## Remaining (P2)

| File | Line | Current Text | Issue | Recommendation |
|------|------|-------------|-------|----------------|
| `components/downloads/DownloadHero.tsx` | 103 | "unlock premium resources" | "unlock" + "premium" | → "access earned-tier resources" |
| `components/alignment/PatternObservatory.tsx` | 140 | "Upgrade to Premium" | SaaS button | → "Progress to Earned Tier" |
| `components/living/NextLayerUnlockedPanel.tsx` | 41 | "Next layer unlocked" | "unlocked" | → "Next layer available" |
| `components/playbooks/VaultGate.tsx` | 22 | "Request access to unlock" | "unlock" | → "Request access" |
| `components/diagnostics/ExecutiveReportSamplePreview.tsx` | 211 | "What makes this premium" | "premium" as heading | → "What the report produces" |
| `components/resources/ResourceDownload.tsx` | 49 | "access premium content" | "premium" | → "access earned-tier content" |
| `components/premium/DownloadButton.tsx` | 372 | "premium download" | "premium" | → "governed download" |
| Internal prop names (`onUpgrade`, `isPremium`) | Various | Code-only | Not user-facing | Cosmetic; no urgency |
