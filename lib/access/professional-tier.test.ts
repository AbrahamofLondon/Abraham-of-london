/**
 * lib/access/professional-tier.test.ts
 *
 * Backward-compatibility and correctness tests for the Professional runtime tier.
 * Covers: TIER_ORDER membership, TIER_HIERARCHY rank, TIER_LABELS, TIER_ALIASES,
 * normalizeUserTier, normalizeRuntimeTier, hasAccess, and the legacy inner_circle bridge.
 */

import { describe, it, expect } from "vitest";
import {
  TIER_ORDER,
  TIER_HIERARCHY,
  TIER_LABELS,
  TIER_ALIASES,
  normalizeUserTier,
  normalizeRequiredTier,
  normalizeRuntimeTier,
  hasAccess,
  isAccessTier,
  type AccessTier,
} from "@/lib/access/tier-policy";

// ─────────────────────────────────────────────────────────────────────────────
// TIER_ORDER membership
// ─────────────────────────────────────────────────────────────────────────────

describe("TIER_ORDER", () => {
  it("includes professional", () => {
    expect(TIER_ORDER).toContain("professional");
  });

  it("includes inner_circle (legacy DB value preserved)", () => {
    expect(TIER_ORDER).toContain("inner_circle");
  });

  it("professional appears before inner_circle (canonical ordering)", () => {
    const profIdx = (TIER_ORDER as readonly string[]).indexOf("professional");
    const icIdx   = (TIER_ORDER as readonly string[]).indexOf("inner_circle");
    expect(profIdx).toBeLessThan(icIdx);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TIER_HIERARCHY ranks
// ─────────────────────────────────────────────────────────────────────────────

describe("TIER_HIERARCHY", () => {
  it("professional rank is 2", () => {
    expect(TIER_HIERARCHY.professional).toBe(2);
  });

  it("inner_circle rank is 2 (same as professional — legacy parity)", () => {
    expect(TIER_HIERARCHY.inner_circle).toBe(2);
  });

  it("professional ranks above member", () => {
    expect(TIER_HIERARCHY.professional).toBeGreaterThan(TIER_HIERARCHY.member);
  });

  it("professional ranks below restricted", () => {
    expect(TIER_HIERARCHY.professional).toBeLessThan(TIER_HIERARCHY.restricted);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TIER_LABELS — user-facing names
// ─────────────────────────────────────────────────────────────────────────────

describe("TIER_LABELS", () => {
  it("professional label is 'Professional'", () => {
    expect(TIER_LABELS.professional).toBe("Professional");
  });

  it("inner_circle label is 'Professional' (legacy shows same label)", () => {
    expect(TIER_LABELS.inner_circle).toBe("Professional");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TIER_ALIASES — alias resolution
// ─────────────────────────────────────────────────────────────────────────────

describe("TIER_ALIASES", () => {
  it("'professional' alias resolves to professional", () => {
    expect(TIER_ALIASES["professional"]).toBe("professional");
  });

  it("'pro' alias resolves to professional", () => {
    expect(TIER_ALIASES["pro"]).toBe("professional");
  });

  it("'inner_circle' alias resolves to inner_circle (DB write compatibility)", () => {
    expect(TIER_ALIASES["inner_circle"]).toBe("inner_circle");
  });

  it("'premium' alias still resolves to inner_circle (legacy Stripe metadata)", () => {
    expect(TIER_ALIASES["premium"]).toBe("inner_circle");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isAccessTier
// ─────────────────────────────────────────────────────────────────────────────

describe("isAccessTier", () => {
  it("recognises 'professional' as a valid AccessTier", () => {
    expect(isAccessTier("professional")).toBe(true);
  });

  it("recognises 'inner_circle' as a valid AccessTier", () => {
    expect(isAccessTier("inner_circle")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// normalizeUserTier — string → AccessTier
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeUserTier", () => {
  it("'professional' → 'professional'", () => {
    expect(normalizeUserTier("professional")).toBe("professional");
  });

  it("'pro' → 'professional'", () => {
    expect(normalizeUserTier("pro")).toBe("professional");
  });

  it("'PROFESSIONAL' (caps) → 'professional'", () => {
    expect(normalizeUserTier("PROFESSIONAL")).toBe("professional");
  });

  it("'inner_circle' → 'inner_circle' (DB write path unchanged)", () => {
    expect(normalizeUserTier("inner_circle")).toBe("inner_circle");
  });

  it("'inner-circle' → 'inner_circle'", () => {
    expect(normalizeUserTier("inner-circle")).toBe("inner_circle");
  });

  it("unknown string → 'public' (safe fallback)", () => {
    expect(normalizeUserTier("not-a-tier")).toBe("public");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// normalizeRuntimeTier — canonical display/gate tier
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeRuntimeTier", () => {
  it("inner_circle → professional (legacy DB records surface as Professional)", () => {
    expect(normalizeRuntimeTier("inner_circle")).toBe("professional");
  });

  it("professional → professional (idempotent)", () => {
    expect(normalizeRuntimeTier("professional")).toBe("professional");
  });

  it("member → member (unchanged)", () => {
    expect(normalizeRuntimeTier("member")).toBe("member");
  });

  it("public → public (unchanged)", () => {
    expect(normalizeRuntimeTier("public")).toBe("public");
  });

  it("restricted → restricted (unchanged)", () => {
    expect(normalizeRuntimeTier("restricted")).toBe("restricted");
  });

  it("owner → owner (unchanged)", () => {
    expect(normalizeRuntimeTier("owner")).toBe("owner");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hasAccess — gate logic
// ─────────────────────────────────────────────────────────────────────────────

describe("hasAccess — professional tier gates", () => {
  it("professional user can access professional-gated content", () => {
    expect(hasAccess("professional", "professional")).toBe(true);
  });

  it("professional user can access member-gated content", () => {
    expect(hasAccess("professional", "member")).toBe(true);
  });

  it("professional user can access public content", () => {
    expect(hasAccess("professional", "public")).toBe(true);
  });

  it("professional user cannot access restricted content (restricted > professional)", () => {
    expect(hasAccess("professional", "restricted")).toBe(false);
  });

  it("member user cannot access professional-gated content", () => {
    expect(hasAccess("member", "professional")).toBe(false);
  });

  it("public user cannot access professional-gated content", () => {
    expect(hasAccess("public", "professional")).toBe(false);
  });
});

describe("hasAccess — inner_circle legacy parity", () => {
  it("inner_circle user can access professional-gated content (same rank)", () => {
    expect(hasAccess("inner_circle", "professional")).toBe(true);
  });

  it("professional user can access inner_circle-gated content (same rank)", () => {
    expect(hasAccess("professional", "inner_circle")).toBe(true);
  });

  it("inner_circle user can access member content", () => {
    expect(hasAccess("inner_circle", "member")).toBe(true);
  });

  it("member user cannot access inner_circle content", () => {
    expect(hasAccess("member", "inner_circle")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// normalizeRequiredTier — document/frontmatter resolution
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizeRequiredTier", () => {
  it("'professional' in frontmatter resolves to professional", () => {
    expect(normalizeRequiredTier("professional")).toBe("professional");
  });

  it("'inner_circle' in frontmatter resolves to inner_circle", () => {
    expect(normalizeRequiredTier("inner_circle")).toBe("inner_circle");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Complete normalizeRuntimeTier round-trip: DB value → display tier
// ─────────────────────────────────────────────────────────────────────────────

describe("DB → runtime tier round-trip", () => {
  it("existing InnerCircleMember with tier='inner_circle' resolves to 'professional' at runtime", () => {
    const dbTier: AccessTier = "inner_circle";
    const runtimeTier = normalizeRuntimeTier(dbTier);
    expect(runtimeTier).toBe("professional");
  });

  it("new member with tier='professional' resolves to 'professional' at runtime (idempotent)", () => {
    const dbTier: AccessTier = "professional";
    const runtimeTier = normalizeRuntimeTier(dbTier);
    expect(runtimeTier).toBe("professional");
  });

  it("downgraded member with tier='member' resolves to 'member' (subscription cancellation)", () => {
    const dbTier: AccessTier = "member";
    const runtimeTier = normalizeRuntimeTier(dbTier);
    expect(runtimeTier).toBe("member");
  });
});
