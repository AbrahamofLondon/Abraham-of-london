# Token Blast-Radius Inventory — Phase 1 Prerequisite

Produced before any token definition changes, per the Phase 1 authorization. For each owner-authorized token: direct `var()` usage, every Tailwind class family that resolves to it (including the dead `aol.*` literal namespace, which does NOT reference the var), Shadcn/DS adapter status (currently none exist — that's what Phase 1A/1B establishes), and consumer breakdown by file category.

## `--aol-bg`

- **Direct `var()` usage (pages/app/components):** 3 usages across 1 files
- **Direct `var()` usage (CSS source files):** 4 usages across 2 files — styles/globals.css (3), app/globals.css (1)
- **Tailwind class families:**
  - `background` (top-level semantic): 2 usages / 1 files
  - `surface-bg` (legacy surface-* (fallback)): 0 usages / 0 files
  - `brand-obsidian` (brand.* (correct)): 0 usages / 0 files
  - `softBlack` (convenience alias): 1 usages / 1 files
  - `obsidian` (convenience alias): 0 usages / 0 files
  - `aol-void` (aol.* (DEAD literal, does not reference var)) ⚠ DOES NOT REFERENCE THE VAR (dead literal): 0 usages / 0 files
  - `aol-base` (aol.* (DEAD literal, does not reference var)) ⚠ DOES NOT REFERENCE THE VAR (dead literal): 0 usages / 0 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 3
- **By file category:**
    - component:UNREACHABLE: 2
    - route:PUBLIC_CUSTOMER: 1

## `--aol-bg-2`

- **Direct `var()` usage (pages/app/components):** 0 usages across 0 files
- **Direct `var()` usage (CSS source files):** 3 usages across 1 files — styles/globals.css (3)
- **Tailwind class families:**
  - `surface-bg-muted` (legacy surface-* (fallback)): 0 usages / 0 files
  - `brand-obsidian-2` (brand.* (correct)): 0 usages / 0 files
  - `deepCharcoal` (convenience alias): 45 usages / 23 files
  - `aol-lifted` (aol.* (DEAD literal)) ⚠ DOES NOT REFERENCE THE VAR (dead literal): 0 usages / 0 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 23
- **By file category:**
    - component:UNREACHABLE: 17
    - component:SHARED_PUBLIC_REACHABLE: 6

## `--aol-bg-3`

- **Direct `var()` usage (pages/app/components):** 0 usages across 0 files
- **Direct `var()` usage (CSS source files):** 7 usages across 1 files — styles/globals.css (7)
- **Tailwind class families:**
  - `brand-charcoal` (brand.* (correct)): 18 usages / 6 files
  - `charcoal` (convenience alias): 11 usages / 7 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 13
- **By file category:**
    - component:UNREACHABLE: 9
    - route:PUBLIC_CUSTOMER: 2
    - component:ADMIN_ONLY: 1
    - component:SHARED_PUBLIC_REACHABLE: 1

## `--aol-panel`

- **Direct `var()` usage (pages/app/components):** 0 usages across 0 files
- **Direct `var()` usage (CSS source files):** 0 usages across 0 files
- **Tailwind class families:**
  - `surface-panel` (legacy surface-* (fallback)): 0 usages / 0 files
  - `brand-panel` (brand.* (correct)): 0 usages / 0 files
  - `aol-panel` (aol.* (DEAD literal)) ⚠ DOES NOT REFERENCE THE VAR (dead literal): 0 usages / 0 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 0
- **By file category:**

## `--aol-panel-2`

- **Direct `var()` usage (pages/app/components):** 0 usages across 0 files
- **Direct `var()` usage (CSS source files):** 0 usages across 0 files
- **Tailwind class families:**
  - `surface-panel-alt` (legacy surface-* (fallback)): 0 usages / 0 files
  - `brand-panel-2` (brand.* (correct)): 0 usages / 0 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 0
- **By file category:**

## `--aol-panel-3`

- **Direct `var()` usage (pages/app/components):** 0 usages across 0 files
- **Direct `var()` usage (CSS source files):** 0 usages across 0 files
- **Tailwind class families:**
  - `brand-panel-3` (brand.* (correct)): 0 usages / 0 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 0
- **By file category:**

## `--aol-ink`

- **Direct `var()` usage (pages/app/components):** 0 usages across 0 files
- **Direct `var()` usage (CSS source files):** 15 usages across 2 files — styles/globals.css (7), app/globals.css (8)
- **Tailwind class families:**
  - `foreground` (top-level semantic): 2 usages / 1 files
  - `surface-text` (legacy surface-* (fallback)): 0 usages / 0 files
  - `brand-cream` (brand.* (correct)): 33 usages / 7 files
  - `cream` (convenience alias): 106 usages / 43 files
  - `warmWhite` (convenience alias): 19 usages / 14 files
  - `aol-heading` (aol.* (DEAD literal)) ⚠ DOES NOT REFERENCE THE VAR (dead literal): 0 usages / 0 files
  - `aol-body` (aol.* (DEAD literal)) ⚠ DOES NOT REFERENCE THE VAR (dead literal): 0 usages / 0 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 58
- **By file category:**
    - component:UNREACHABLE: 42
    - route:PUBLIC_CUSTOMER: 9
    - component:SHARED_PUBLIC_REACHABLE: 5
    - component:ADMIN_ONLY: 1
    - route:CONTROLLED_CUSTOMER: 1

## `--aol-ink-dim`

- **Direct `var()` usage (pages/app/components):** 0 usages across 0 files
- **Direct `var()` usage (CSS source files):** 7 usages across 1 files — app/globals.css (7)
- **Tailwind class families:**
  - `brand-cream-dim` (brand.* (correct)): 3 usages / 2 files
  - `aol-dim` (aol.* (DEAD literal)) ⚠ DOES NOT REFERENCE THE VAR (dead literal): 0 usages / 0 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 2
- **By file category:**
    - component:UNREACHABLE: 1
    - component:ADMIN_ONLY: 1

## `--aol-ink-muted`

- **Direct `var()` usage (pages/app/components):** 0 usages across 0 files
- **Direct `var()` usage (CSS source files):** 3 usages across 1 files — app/globals.css (3)
- **Tailwind class families:**
  - `surface-text-muted` (legacy surface-* (fallback)): 0 usages / 0 files
  - `brand-cream-muted` (brand.* (correct)): 3 usages / 2 files
  - `aol-muted` (aol.* (DEAD literal)) ⚠ DOES NOT REFERENCE THE VAR (dead literal): 0 usages / 0 files
  - `aol-faint` (aol.* (DEAD literal)) ⚠ DOES NOT REFERENCE THE VAR (dead literal): 0 usages / 0 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 2
- **By file category:**
    - component:UNREACHABLE: 1
    - component:ADMIN_ONLY: 1

## `--aol-gold`

- **Direct `var()` usage (pages/app/components):** 0 usages across 0 files
- **Direct `var()` usage (CSS source files):** 25 usages across 2 files — styles/globals.css (3), app/globals.css (22)
- **Tailwind class families:**
  - `ring` (top-level semantic): 0 usages / 0 files
  - `surface-accent` (legacy surface-* (fallback)): 0 usages / 0 files
  - `brand-gold` (brand.* (correct)): 116 usages / 7 files
  - `softGold` (convenience alias): 111 usages / 27 files
  - `gold` (convenience alias): 320 usages / 36 files
  - `aol-gold` (aol.* (DEAD literal)) ⚠ DOES NOT REFERENCE THE VAR (dead literal): 0 usages / 0 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 68
- **By file category:**
    - component:UNREACHABLE: 43
    - component:SHARED_PUBLIC_REACHABLE: 11
    - route:PUBLIC_CUSTOMER: 8
    - route:CONTROLLED_CUSTOMER: 2
    - component:ADMIN_ONLY: 2
    - route:ADMIN: 1
    - route:INTERNAL_OPERATOR: 1

## `--aol-gold-strong`

- **Direct `var()` usage (pages/app/components):** 0 usages across 0 files
- **Direct `var()` usage (CSS source files):** 6 usages across 1 files — app/globals.css (6)
- **Tailwind class families:**
  - `brand-gold-strong` (brand.* (correct)): 0 usages / 0 files
  - `amber` (convenience alias): 0 usages / 0 files
  - `aol-gold-strong` (aol.* (DEAD literal)) ⚠ DOES NOT REFERENCE THE VAR (dead literal): 0 usages / 0 files
  - `aol-amber` (aol.* (DEAD literal)) ⚠ DOES NOT REFERENCE THE VAR (dead literal): 0 usages / 0 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 0
- **By file category:**

## `--aol-gold-soft`

- **Direct `var()` usage (pages/app/components):** 0 usages across 0 files
- **Direct `var()` usage (CSS source files):** 0 usages across 0 files
- **Tailwind class families:**
  - `surface-accent-soft` (legacy surface-* (fallback)): 0 usages / 0 files
  - `brand-gold-soft` (brand.* (correct)): 0 usages / 0 files
  - `aol-gold-soft` (aol.* (DEAD literal)) ⚠ DOES NOT REFERENCE THE VAR (dead literal): 0 usages / 0 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 0
- **By file category:**

## `--aol-danger`

- **Direct `var()` usage (pages/app/components):** 0 usages across 0 files
- **Direct `var()` usage (CSS source files):** 0 usages across 0 files
- **Tailwind class families:**
  - `brand-danger` (brand.* (correct)): 0 usages / 0 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 0
- **By file category:**

## `--aol-success`

- **Direct `var()` usage (pages/app/components):** 0 usages across 0 files
- **Direct `var()` usage (CSS source files):** 0 usages across 0 files
- **Tailwind class families:**
  - `brand-success` (brand.* (correct)): 0 usages / 0 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 0
- **By file category:**

## `--aol-warning`

- **Direct `var()` usage (pages/app/components):** 0 usages across 0 files
- **Direct `var()` usage (CSS source files):** 0 usages across 0 files
- **Tailwind class families:**
  - `brand-warning` (brand.* (correct)): 0 usages / 0 files
- **Shadcn adapter:** NOT_WIRED — app/globals.css's Shadcn block (--background, --foreground, --primary, --destructive, etc.) is independently defined in OKLCH, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **DS adapter:** NOT_WIRED — styles/design-system.css's base :root block independently hardcodes its own value for the corresponding --ds-* concept, not derived from this token. Establishing this derivation is Phase 1A/1B scope.
- **Total distinct consumer files:** 0
- **By file category:**

