# Release Regression Guard Report

**Date:** 2026-05-09
**Purpose:** Document CI-safe regression guard scripts that prevent messaging/trust/IP regressions

---

## Guard Scripts Created

### 1. `scripts/public-copy-guard.mjs`

**Purpose:** Prevents forbidden phrases from reappearing in user-facing code.

**Scans:** All `.tsx` files in `pages/`, `components/`, `app/`

**Blocks on:**
- "AI-accelerated market baseline"
- "proprietary algorithm"
- "kernel graph"
- "graph mechanics"
- "arbiter rules"
- "scoring formula"
- "machine learning" / "neural network" / "deep learning"
- "Upgrade Now"
- `href="/consulting"`
- "book a call"

**Result:** 1,019 files scanned, 0 violations.

---

### 2. `scripts/evidence-posture-guard.mjs`

**Purpose:** Prevents incorrect evidence posture labelling.

**Scans:** All `.ts` and `.tsx` files in `lib/`, `components/`, `pages/`, `app/`

**Blocks on:**
- `VERIFIED_CASE_EVIDENCE` classification (must use `SOURCE_LABELLED_EVIDENCE`)
- `confidenceLabel: "VERIFIED"` except in outcome-verification-contract and contradiction-graph-presenter (where VERIFIED is a legitimate posture for outcome-verified evidence)

**Result:** 2,600 files scanned, 0 violations.

---

### 3. `scripts/earned-progression-guard.mjs`

**Purpose:** Prevents SaaS paywall language from reappearing.

**Scans:** All `.tsx` files in `pages/`, `components/`, `app/`

**Blocks on:**
- "Unlock premium"
- "Unlock Access"
- "Upgrade Now"
- "unlock premium resources"
- "exclusive insights"
- "Subscribe to unlock"

**Result:** 1,019 files scanned, 0 violations.

---

## CI Integration

Add to `package.json` scripts:
```json
{
  "guard:public-copy": "node scripts/public-copy-guard.mjs",
  "guard:evidence-posture": "node scripts/evidence-posture-guard.mjs",
  "guard:earned-progression": "node scripts/earned-progression-guard.mjs",
  "guard:all": "node scripts/public-copy-guard.mjs && node scripts/evidence-posture-guard.mjs && node scripts/earned-progression-guard.mjs"
}
```

Run in CI alongside `mdx:integrity` and `mdx:gate`:
```yaml
- run: npm run guard:all
```

---

## Extension Points

As new patterns emerge, add them to the appropriate guard script:
- New forbidden phrases → `public-copy-guard.mjs`
- New evidence posture rules → `evidence-posture-guard.mjs`
- New SaaS/paywall patterns → `earned-progression-guard.mjs`
