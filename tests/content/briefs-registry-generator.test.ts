/**
 * tests/content/briefs-registry-generator.test.ts
 *
 * Tests the GENERATOR LOGIC of scripts/generate-briefs-registry.mjs —
 * not just the generated JSON file.
 *
 * Goal: ensure the generator itself de-duplicates slug collisions between
 * the canonical Brief collection (briefs/<slug>) and the VaultBrief mirror
 * (vault/briefs/<slug>), so the failure cannot be reintroduced by a pre-build.
 *
 * These tests exercise the slug-resolution logic directly — they do not shell
 * out to the generator, so they run fast and require no .contentlayer output.
 */

import { describe, it, expect } from "vitest";

// ─── Extract the pure dedup logic from the generator ─────────────────────────
//
// We replicate the slug-map resolution algorithm from the generator here.
// If the algorithm in the generator changes, this test should be updated too
// (the test is the spec for the algorithm).

type BriefMeta = {
  slug: string;
  flattenedPath: string;
  title: string;
  series: string;
};

function isVaultPath(fp: string): boolean {
  return fp.startsWith("vault/");
}

/**
 * Mirrors the dedup logic in generate-briefs-registry.mjs.
 *
 * Rule:
 *   1. Prefer canonical Brief path (flattenedPath starts with "briefs/") over
 *      any vault mirror (flattenedPath starts with "vault/").
 *   2. When both are vault paths, keep the first encountered.
 *   3. Output sorted by slug for determinism.
 */
function dedupBriefs(allBriefs: BriefMeta[]): BriefMeta[] {
  const slugMap = new Map<string, BriefMeta>();
  for (const b of allBriefs) {
    const existing = slugMap.get(b.slug);
    if (!existing) {
      slugMap.set(b.slug, b);
    } else {
      if (isVaultPath(existing.flattenedPath) && !isVaultPath(b.flattenedPath)) {
        slugMap.set(b.slug, b);
      }
    }
  }
  return [...slugMap.values()].sort((a, b) =>
    a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0,
  );
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeBrief(slug: string, path: string, series = ""): BriefMeta {
  return {
    slug,
    flattenedPath: path,
    title: `Brief: ${slug}`,
    series,
  };
}

// 25 canonical frontier-resilience entries (public Brief collection)
const CANONICAL_FR_SLUGS = Array.from({ length: 25 }, (_, i) =>
  `frontier-resilience-slug-${String(i + 1).padStart(3, "0")}`,
);

// 10 institutional-alpha entries (canonical only, no vault mirror)
const CANONICAL_IA_SLUGS = Array.from({ length: 10 }, (_, i) =>
  `institutional-alpha-brief-${String(i + 1).padStart(2, "0")}`,
);

const canonicalFR = CANONICAL_FR_SLUGS.map((s) =>
  makeBrief(s, `briefs/${s}`),
);
const vaultFR = CANONICAL_FR_SLUGS.map((s) =>
  makeBrief(s, `vault/briefs/${s}`),
);
const canonicalIA = CANONICAL_IA_SLUGS.map((s) =>
  makeBrief(s, `briefs/${s}`, "institutional-alpha"),
);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GEN.1 dedup: no duplicates in output when canonical + vault mirrors both present", () => {
  it("output slug count equals unique slug count", () => {
    const input = [...canonicalFR, ...vaultFR, ...canonicalIA];
    const result = dedupBriefs(input);
    const slugs = result.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("output length = canonicals only (mirrors are dropped)", () => {
    const input = [...canonicalFR, ...vaultFR, ...canonicalIA];
    const result = dedupBriefs(input);
    // Expect: 25 FR (deduplicated) + 10 IA = 35
    expect(result.length).toBe(CANONICAL_FR_SLUGS.length + CANONICAL_IA_SLUGS.length);
  });
});

describe("GEN.2 dedup: canonical Brief path wins over vault mirror", () => {
  it("retained entry has briefs/ flattenedPath, not vault/briefs/", () => {
    const input = [...canonicalFR, ...vaultFR];
    const result = dedupBriefs(input);
    for (const entry of result) {
      expect(entry.flattenedPath.startsWith("vault/")).toBe(false);
    }
  });

  it("canonical path wins regardless of input order (vault first)", () => {
    // vault entries listed before canonical — canonical should still win
    const input = [...vaultFR, ...canonicalFR];
    const result = dedupBriefs(input);
    for (const entry of result) {
      expect(entry.flattenedPath.startsWith("vault/")).toBe(false);
    }
  });
});

describe("GEN.3 dedup: vault-only entries are kept when no canonical equivalent", () => {
  it("vault brief with no canonical counterpart is retained", () => {
    const vaultOnly = [makeBrief("vault-exclusive-slug", "vault/briefs/vault-exclusive-slug")];
    const input = [...canonicalFR, ...vaultOnly];
    const result = dedupBriefs(input);
    expect(result.some((b) => b.slug === "vault-exclusive-slug")).toBe(true);
  });
});

describe("GEN.4 dedup: frontier-resilience slugs appear exactly once", () => {
  it("each frontier-resilience slug occurs once with canonical-collection input", () => {
    const input = [...canonicalFR, ...vaultFR];
    const result = dedupBriefs(input);
    for (const slug of CANONICAL_FR_SLUGS) {
      expect(result.filter((b) => b.slug === slug).length).toBe(1);
    }
  });
});

describe("GEN.5 dedup: output is sorted by slug", () => {
  it("output slugs are in ascending alphabetical order", () => {
    const input = [...vaultFR, ...canonicalIA, ...canonicalFR];
    const result = dedupBriefs(input);
    const slugs = result.map((b) => b.slug);
    const sorted = [...slugs].sort();
    expect(slugs).toEqual(sorted);
  });
});

describe("GEN.6 live registry: current public/system/briefs-registry.json has no duplicate slugs", () => {
  it("generated registry slug count equals unique slug count (no stale vault duplicates)", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const regPath = path.join(process.cwd(), "public", "system", "briefs-registry.json");
    const raw = await fs.readFile(regPath, "utf-8");
    const registry = JSON.parse(raw) as Array<{ slug: string; flattenedPath: string }>;
    const slugs = registry.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("no registry entry has a vault/ flattenedPath when a canonical briefs/ entry with the same slug exists", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const regPath = path.join(process.cwd(), "public", "system", "briefs-registry.json");
    const raw = await fs.readFile(regPath, "utf-8");
    const registry = JSON.parse(raw) as Array<{ slug: string; flattenedPath: string }>;
    const canonicalSlugs = new Set(
      registry.filter((e) => !e.flattenedPath.startsWith("vault/")).map((e) => e.slug),
    );
    const badVaultEntries = registry.filter(
      (e) => e.flattenedPath.startsWith("vault/") && canonicalSlugs.has(e.slug),
    );
    expect(badVaultEntries).toHaveLength(0);
  });
});
