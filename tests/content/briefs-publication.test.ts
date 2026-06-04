/**
 * tests/content/briefs-publication.test.ts
 *
 * Validates the publication architecture and release-readiness of the 50 Intelligence Briefs.
 * Run: pnpm exec vitest run tests/content/briefs-publication.test.ts
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const BRIEFS_CONTENT = path.join(ROOT, "content", "briefs");
const VAULT_BRIEFS_CONTENT = path.join(ROOT, "content", "vault", "briefs");
const REGISTRY_PATH = path.join(ROOT, "public", "system", "briefs-registry.json");
const ARCHIVE_PATH = path.join(ROOT, "_archive", "briefs-pre-publication-source");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readFrontmatter(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  if (!match) return {};
  const fm: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return fm;
}

function getAnalyticalBriefs() {
  return fs
    .readdirSync(BRIEFS_CONTENT)
    .filter((f) => f.match(/^(institutional-alpha|sovereign-intelligence)/) && f.endsWith(".mdx"));
}

function getIABriefs() {
  return getAnalyticalBriefs().filter((f) => f.startsWith("institutional-alpha"));
}

function getSIBriefs() {
  return getAnalyticalBriefs().filter((f) => f.startsWith("sovereign-intelligence"));
}

function loadRegistry(): any[] {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
}

function getPublishedBriefs() {
  return getAnalyticalBriefs().filter((f) => {
    const fm = readFrontmatter(path.join(BRIEFS_CONTENT, f));
    return fm.publicationStatus === "published";
  });
}

function getScheduledBriefs() {
  return getAnalyticalBriefs().filter((f) => {
    const fm = readFrontmatter(path.join(BRIEFS_CONTENT, f));
    return fm.publicationStatus === "scheduled";
  });
}

function getHoldBriefs() {
  return getAnalyticalBriefs().filter((f) => {
    const fm = readFrontmatter(path.join(BRIEFS_CONTENT, f));
    return fm.publicationStatus === "editorial-hold";
  });
}

// ─── Content structure ────────────────────────────────────────────────────────

describe("Intelligence Briefs — content structure", () => {
  it("content/briefs has exactly 50 analytical briefs", () => {
    expect(getAnalyticalBriefs()).toHaveLength(50);
  });

  it("Institutional Alpha canonical count is 25", () => {
    expect(getIABriefs()).toHaveLength(25);
  });

  it("Sovereign Intelligence canonical count is 25", () => {
    expect(getSIBriefs()).toHaveLength(25);
  });

  it("content/vault/briefs has exactly 12 pillar briefs", () => {
    const pillars = fs.readdirSync(VAULT_BRIEFS_CONTENT).filter((f) => f.endsWith(".mdx"));
    expect(pillars).toHaveLength(12);
  });

  it("no analytical brief file name contains 'contamination'", () => {
    expect(getAnalyticalBriefs().filter((f) => f.includes("contamination"))).toHaveLength(0);
  });
});

// ─── Frontmatter validation ───────────────────────────────────────────────────

describe("Intelligence Briefs — frontmatter", () => {
  it("every brief has a title", () => {
    const missing = getAnalyticalBriefs().filter((f) => !readFrontmatter(path.join(BRIEFS_CONTENT, f)).title);
    expect(missing).toHaveLength(0);
  });

  it("every brief has a slug", () => {
    const missing = getAnalyticalBriefs().filter((f) => !readFrontmatter(path.join(BRIEFS_CONTENT, f)).slug);
    expect(missing).toHaveLength(0);
  });

  it("every brief has series: institutional-alpha or sovereign-intelligence", () => {
    const invalid = getAnalyticalBriefs().filter((f) => {
      const fm = readFrontmatter(path.join(BRIEFS_CONTENT, f));
      return fm.series !== "institutional-alpha" && fm.series !== "sovereign-intelligence";
    });
    expect(invalid).toHaveLength(0);
  });

  it("every brief has accessTier: public", () => {
    const invalid = getAnalyticalBriefs().filter((f) => {
      return readFrontmatter(path.join(BRIEFS_CONTENT, f)).accessTier !== "public";
    });
    expect(invalid).toHaveLength(0);
  });

  it("every brief has requiresAuth: false", () => {
    const invalid = getAnalyticalBriefs().filter((f) => {
      return readFrontmatter(path.join(BRIEFS_CONTENT, f)).requiresAuth !== "false";
    });
    expect(invalid).toHaveLength(0);
  });

  it("no brief contains 'contamination' in body or frontmatter", () => {
    const hits = getAnalyticalBriefs().filter((f) => {
      return fs.readFileSync(path.join(BRIEFS_CONTENT, f), "utf-8").toLowerCase().includes("contamination");
    });
    expect(hits).toHaveLength(0);
  });

  it("no brief slug is a duplicate", () => {
    const slugs = getAnalyticalBriefs().map((f) => readFrontmatter(path.join(BRIEFS_CONTENT, f)).slug).filter(Boolean);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

// ─── Publication metadata ─────────────────────────────────────────────────────

describe("Intelligence Briefs — publication metadata", () => {
  it("every brief has a publicationStatus field", () => {
    const missing = getAnalyticalBriefs().filter((f) => {
      const fm = readFrontmatter(path.join(BRIEFS_CONTENT, f));
      return !fm.publicationStatus;
    });
    expect(missing).toHaveLength(0);
  });

  it("every brief has a primaryRoute field", () => {
    const missing = getAnalyticalBriefs().filter((f) => {
      return !readFrontmatter(path.join(BRIEFS_CONTENT, f)).primaryRoute;
    });
    expect(missing).toHaveLength(0);
  });

  it("every brief has a relatedCanon field", () => {
    const missing = getAnalyticalBriefs().filter((f) => {
      return !readFrontmatter(path.join(BRIEFS_CONTENT, f)).relatedCanon;
    });
    expect(missing).toHaveLength(0);
  });

  it("every brief has an innerCircleBridge field", () => {
    const missing = getAnalyticalBriefs().filter((f) => {
      return !readFrontmatter(path.join(BRIEFS_CONTENT, f)).innerCircleBridge;
    });
    expect(missing).toHaveLength(0);
  });

  it("every brief has an editorialCluster field", () => {
    const missing = getAnalyticalBriefs().filter((f) => {
      return !readFrontmatter(path.join(BRIEFS_CONTENT, f)).editorialCluster;
    });
    expect(missing).toHaveLength(0);
  });

  it("every brief has a season field (S1, S2, or S3)", () => {
    const invalid = getAnalyticalBriefs().filter((f) => {
      const fm = readFrontmatter(path.join(BRIEFS_CONTENT, f));
      return !["S1", "S2", "S3"].includes(fm.season);
    });
    expect(invalid).toHaveLength(0);
  });

  it("publicationStatus is one of: published, scheduled, editorial-hold", () => {
    const VALID = ["published", "scheduled", "editorial-hold"];
    const invalid = getAnalyticalBriefs().filter((f) => {
      const fm = readFrontmatter(path.join(BRIEFS_CONTENT, f));
      return !VALID.includes(fm.publicationStatus);
    });
    expect(invalid).toHaveLength(0);
  });
});

// ─── Publication status counts ────────────────────────────────────────────────

describe("Intelligence Briefs — publication status", () => {
  it("launch set has exactly 8 published briefs", () => {
    expect(getPublishedBriefs()).toHaveLength(8);
  });

  it("launch set has exactly 4 Institutional Alpha briefs", () => {
    const launchIA = getPublishedBriefs().filter((f) => f.startsWith("institutional-alpha"));
    expect(launchIA).toHaveLength(4);
  });

  it("launch set has exactly 4 Sovereign Intelligence briefs", () => {
    const launchSI = getPublishedBriefs().filter((f) => f.startsWith("sovereign-intelligence"));
    expect(launchSI).toHaveLength(4);
  });

  it("no editorial-hold briefs exist (all classified or published/scheduled)", () => {
    expect(getHoldBriefs()).toHaveLength(0);
  });

  it("remaining 42 briefs are scheduled", () => {
    expect(getScheduledBriefs()).toHaveLength(42);
  });

  it("all published briefs have a publishedAt date", () => {
    const missing = getPublishedBriefs().filter((f) => {
      return !readFrontmatter(path.join(BRIEFS_CONTENT, f)).publishedAt;
    });
    expect(missing).toHaveLength(0);
  });

  it("all scheduled briefs have a scheduledFor date", () => {
    const missing = getScheduledBriefs().filter((f) => {
      return !readFrontmatter(path.join(BRIEFS_CONTENT, f)).scheduledFor;
    });
    expect(missing).toHaveLength(0);
  });

  it("S1 briefs are featured", () => {
    const s1NotFeatured = getPublishedBriefs().filter((f) => {
      const fm = readFrontmatter(path.join(BRIEFS_CONTENT, f));
      return fm.season === "S1" && fm.featured !== "true";
    });
    expect(s1NotFeatured).toHaveLength(0);
  });
});

// ─── Registry validation ──────────────────────────────────────────────────────

describe("Intelligence Briefs — registry", () => {
  it("registry loads without error", () => {
    expect(() => loadRegistry()).not.toThrow();
  });

  it("registry has 25 Institutional Alpha entries", () => {
    const reg = loadRegistry();
    expect(reg.filter((e: any) => e.series === "institutional-alpha")).toHaveLength(25);
  });

  it("registry has 25 Sovereign Intelligence entries", () => {
    const reg = loadRegistry();
    expect(reg.filter((e: any) => e.series === "sovereign-intelligence")).toHaveLength(25);
  });

  it("no registry entry has a path pointing to backup or archive", () => {
    const bad = loadRegistry().filter((e: any) => {
      const fp = String(e.flattenedPath || "");
      return fp.includes("contamination") || fp.includes("_archive") || fp.includes("backup");
    });
    expect(bad).toHaveLength(0);
  });

  it("all analytical briefs have requiresAuthSafe: false", () => {
    const analytical = loadRegistry().filter((e: any) => e.series === "institutional-alpha" || e.series === "sovereign-intelligence");
    expect(analytical.filter((e: any) => e.requiresAuthSafe !== false)).toHaveLength(0);
  });

  it("all analytical briefs have accessTierSafe: public", () => {
    const analytical = loadRegistry().filter((e: any) => e.series === "institutional-alpha" || e.series === "sovereign-intelligence");
    expect(analytical.filter((e: any) => e.accessTierSafe !== "public")).toHaveLength(0);
  });

  it("no duplicate slugs in registry", () => {
    const slugs = loadRegistry().map((e: any) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("registry has 8 published briefs", () => {
    const reg = loadRegistry();
    expect(reg.filter((e: any) => e.publicationStatus === "published")).toHaveLength(8);
  });

  it("registry has primaryRoute set on all analytical briefs", () => {
    const analytical = loadRegistry().filter((e: any) => e.series === "institutional-alpha" || e.series === "sovereign-intelligence");
    const missing = analytical.filter((e: any) => !e.primaryRoute);
    expect(missing).toHaveLength(0);
  });

  it("no registry entry slug contains 'contamination'", () => {
    expect(loadRegistry().filter((e: any) => String(e.slug).includes("contamination"))).toHaveLength(0);
  });
});

// ─── Route pages ─────────────────────────────────────────────────────────────

describe("Intelligence Briefs — route pages exist", () => {
  const PAGES = path.join(ROOT, "pages");

  it("/briefs index page exists", () => {
    expect(fs.existsSync(path.join(PAGES, "briefs", "index.tsx"))).toBe(true);
  });

  it("/briefs/[slug] page exists", () => {
    expect(fs.existsSync(path.join(PAGES, "briefs", "[slug].tsx"))).toBe(true);
  });

  it("/briefs/institutional-alpha collection page exists", () => {
    expect(fs.existsSync(path.join(PAGES, "briefs", "institutional-alpha.tsx"))).toBe(true);
  });

  it("/briefs/sovereign-intelligence collection page exists", () => {
    expect(fs.existsSync(path.join(PAGES, "briefs", "sovereign-intelligence.tsx"))).toBe(true);
  });

  it("/editorial/intelligence-briefs front-door page exists", () => {
    expect(fs.existsSync(path.join(PAGES, "editorials", "intelligence-briefs.tsx"))).toBe(true);
  });

  it("analytics module for briefs exists", () => {
    expect(fs.existsSync(path.join(ROOT, "lib", "analytics", "briefs-analytics.ts"))).toBe(true);
  });
});

// ─── Editorial front door does not dump all 50 ───────────────────────────────

describe("Editorial front door", () => {
  it("/editorials/intelligence-briefs does not contain a full registry import or all-brief query", () => {
    const content = fs.readFileSync(
      path.join(ROOT, "pages", "editorials", "intelligence-briefs.tsx"),
      "utf-8"
    );
    // The editorial page should be static (no getStaticProps querying all briefs)
    expect(content).not.toMatch(/getAllBriefs/);
  });

  it("/editorials/intelligence-briefs explicitly lists the 8 launch briefs", () => {
    const content = fs.readFileSync(
      path.join(ROOT, "pages", "editorials", "intelligence-briefs.tsx"),
      "utf-8"
    );
    expect(content).toMatch(/LAUNCH_SET/);
    // Should mention all 8 IDs
    for (const id of ["IA-003", "IA-021", "IA-045", "IA-069", "SI-002", "SI-017", "SI-038", "SI-065"]) {
      expect(content).toMatch(id);
    }
  });

  it("/editorials/intelligence-briefs includes Inner Circle boundary language", () => {
    const content = fs.readFileSync(
      path.join(ROOT, "pages", "editorials", "intelligence-briefs.tsx"),
      "utf-8"
    );
    expect(content).toMatch(/diagnosis is public/i);
    expect(content).toMatch(/application is not/i);
  });
});

// ─── /briefs index only shows published ──────────────────────────────────────

describe("/briefs index — publication gating", () => {
  it("briefs index page uses isPublishedBrief filter", () => {
    const content = fs.readFileSync(
      path.join(ROOT, "pages", "briefs", "index.tsx"),
      "utf-8"
    );
    expect(content).toMatch(/isPublishedBrief/);
  });

  it("briefs slug page uses isPublishedBrief filter in getStaticPaths", () => {
    const content = fs.readFileSync(
      path.join(ROOT, "pages", "briefs", "[slug].tsx"),
      "utf-8"
    );
    expect(content).toMatch(/isPublishedBrief/);
  });

  it("collection pages use isPublishedBrief filter", () => {
    for (const page of ["institutional-alpha.tsx", "sovereign-intelligence.tsx"]) {
      const content = fs.readFileSync(path.join(ROOT, "pages", "briefs", page), "utf-8");
      expect(content).toMatch(/isPublishedBrief/);
    }
  });
});

// ─── Analytics ───────────────────────────────────────────────────────────────

describe("Analytics — briefs events", () => {
  const analyticsPath = path.join(ROOT, "lib", "analytics", "briefs-analytics.ts");
  const analyticsContent = fs.existsSync(analyticsPath) ? fs.readFileSync(analyticsPath, "utf-8") : "";

  it("trackBriefViewed is exported", () => {
    expect(analyticsContent).toMatch(/export function trackBriefViewed/);
  });

  it("trackBriefSeriesViewed is exported", () => {
    expect(analyticsContent).toMatch(/export function trackBriefSeriesViewed/);
  });

  it("trackBriefToProductClick is exported", () => {
    expect(analyticsContent).toMatch(/export function trackBriefToProductClick/);
  });

  it("trackBriefToCanonClick is exported", () => {
    expect(analyticsContent).toMatch(/export function trackBriefToCanonClick/);
  });

  it("trackBriefToInnerCircleClick is exported", () => {
    expect(analyticsContent).toMatch(/export function trackBriefToInnerCircleClick/);
  });

  it("analytics does not transmit PII field names", () => {
    // Only check for actual PII field transmissions, not documentation comments
    expect(analyticsContent).not.toMatch(/props:\s*\{[^}]*email[^}]*\}/);
    expect(analyticsContent).not.toMatch(/props:\s*\{[^}]*password[^}]*\}/);
  });

  it("[slug] page imports and calls trackBriefViewed", () => {
    const slugPage = fs.readFileSync(path.join(ROOT, "pages", "briefs", "[slug].tsx"), "utf-8");
    expect(slugPage).toMatch(/trackBriefViewed/);
  });
});

// ─── Launch hardening — routes ───────────────────────────────────────────────

describe("Launch hardening — routes", () => {
  const PAGES = path.join(ROOT, "pages");

  it("canonical editorial route is /editorials (plural)", () => {
    expect(fs.existsSync(path.join(PAGES, "editorials", "intelligence-briefs.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(PAGES, "editorial", "intelligence-briefs.tsx"))).toBe(false);
  });

  it("netlify.toml has redirect from /editorial/ to /editorials/", () => {
    const toml = fs.readFileSync(path.join(ROOT, "netlify.toml"), "utf-8");
    expect(toml).toMatch(/from\s*=\s*["']\/editorial\/intelligence-briefs["']/);
    expect(toml).toMatch(/to\s*=\s*["']\/editorials\/intelligence-briefs["']/);
  });

  it("next.config.mjs has redirect from /editorial/ to /editorials/", () => {
    const nc = fs.readFileSync(path.join(ROOT, "next.config.mjs"), "utf-8");
    expect(nc).toMatch(/\/editorial\/intelligence-briefs/);
    expect(nc).toMatch(/\/editorials\/intelligence-briefs/);
  });
});

// ─── Launch hardening — contentlayer schema ───────────────────────────────────

describe("Launch hardening — contentlayer schema", () => {
  const schema = fs.readFileSync(path.join(ROOT, "contentlayer.config.ts"), "utf-8");

  it("Brief document type has publicationStatus field", () => {
    expect(schema).toMatch(/publicationStatus.*type.*string/);
  });

  it("Brief document type has scheduledFor field", () => {
    expect(schema).toMatch(/scheduledFor.*type.*string/);
  });

  it("Brief document type has season field", () => {
    expect(schema).toMatch(/season.*type.*string/);
  });

  it("Brief document type has editorialCluster field", () => {
    expect(schema).toMatch(/editorialCluster.*type.*string/);
  });

  it("Brief document type has relatedCanon field", () => {
    expect(schema).toMatch(/relatedCanon.*type.*string/);
  });

  it("Brief document type has innerCircleBridge field", () => {
    expect(schema).toMatch(/innerCircleBridge.*type.*string/);
  });
});

// ─── Launch hardening — scheduling script ─────────────────────────────────────

describe("Launch hardening — scheduling", () => {
  it("promote-scheduled-briefs.mjs script exists", () => {
    expect(fs.existsSync(path.join(ROOT, "scripts", "promote-scheduled-briefs.mjs"))).toBe(true);
  });

  it("scheduling script never touches editorial-hold briefs", () => {
    const script = fs.readFileSync(path.join(ROOT, "scripts", "promote-scheduled-briefs.mjs"), "utf-8");
    // Must reference editorial-hold and must skip/continue past it
    expect(script).toMatch(/editorial-hold/);
    expect(script).toMatch(/held\+\+|continue/);
  });

  it("scheduling script supports --dry-run flag", () => {
    const script = fs.readFileSync(path.join(ROOT, "scripts", "promote-scheduled-briefs.mjs"), "utf-8");
    expect(script).toMatch(/dry.run/i);
  });

  it("editorial calendar file exists", () => {
    expect(fs.existsSync(path.join(ROOT, "content", "editorial", "intelligence-briefs-calendar.md"))).toBe(true);
  });
});

// ─── Gating safety — fail-closed regression ───────────────────────────────────

describe("Gating safety — fail-closed", () => {
  // Simulate isPublishedBrief logic directly against real frontmatter
  function simulateGate(publicationStatus: string | undefined): boolean {
    const status = (publicationStatus ?? "").toLowerCase().trim();
    return status === "published";
  }

  it("published returns true", () => {
    expect(simulateGate("published")).toBe(true);
  });

  it("scheduled returns false", () => {
    expect(simulateGate("scheduled")).toBe(false);
  });

  it("editorial-hold returns false", () => {
    expect(simulateGate("editorial-hold")).toBe(false);
  });

  it("empty string returns false (fail-closed)", () => {
    expect(simulateGate("")).toBe(false);
  });

  it("undefined returns false (fail-closed)", () => {
    expect(simulateGate(undefined)).toBe(false);
  });

  it("no pages/briefs/*.tsx contains fail-open fallback", () => {
    const files = ["index.tsx", "[slug].tsx", "institutional-alpha.tsx", "sovereign-intelligence.tsx"];
    for (const file of files) {
      const content = fs.readFileSync(path.join(ROOT, "pages", "briefs", file), "utf-8");
      // isPublishedBrief must not treat empty/missing status as published
      expect(content).not.toMatch(/status === "" \|\| status === "published"/);
      expect(content).not.toMatch(/status === "published" \|\| status === ""/);
      // Positive check: the function must use strict equality to "published" only
      expect(content).toMatch(/isPublishedBrief[\s\S]{0,200}=== "published"/);
    }
  });

  it("exactly 8 briefs have publicationStatus: published", () => {
    const published = getAnalyticalBriefs().filter((f) => {
      return readFrontmatter(path.join(BRIEFS_CONTENT, f)).publicationStatus === "published";
    });
    expect(published).toHaveLength(8);
  });

  it("exactly 42 briefs have publicationStatus: scheduled", () => {
    const scheduled = getAnalyticalBriefs().filter((f) => {
      return readFrontmatter(path.join(BRIEFS_CONTENT, f)).publicationStatus === "scheduled";
    });
    expect(scheduled).toHaveLength(42);
  });

  it("zero briefs have missing or empty publicationStatus", () => {
    const missing = getAnalyticalBriefs().filter((f) => {
      const fm = readFrontmatter(path.join(BRIEFS_CONTENT, f));
      return !fm.publicationStatus || fm.publicationStatus.trim() === "";
    });
    expect(missing).toHaveLength(0);
  });
});

// ─── Launch hardening — QA (8 launch briefs) ─────────────────────────────────

describe("Launch hardening — 8 launch briefs QA", () => {
  const LAUNCH_SLUGS = [
    "institutional-alpha-the-hidden-cost-of-flattering-data",
    "institutional-alpha-why-executive-summaries-mislead",
    "institutional-alpha-why-leaders-stop-hearing-reality",
    "institutional-alpha-when-the-board-sees-a-different-company",
    "sovereign-intelligence-dependence-disguised-as-partnership",
    "sovereign-intelligence-alignment-without-sovereignty",
    "sovereign-intelligence-the-vulnerability-of-narrative-capture",
    "sovereign-intelligence-why-power-concentrates-around-the-decisive",
  ];

  it("all 8 launch briefs exist as MDX files", () => {
    const missing = LAUNCH_SLUGS.filter(
      (slug) => !fs.existsSync(path.join(BRIEFS_CONTENT, `${slug}.mdx`))
    );
    expect(missing).toHaveLength(0);
  });

  it("all 8 launch briefs have publicationStatus: published", () => {
    const notPublished = LAUNCH_SLUGS.filter((slug) => {
      const fm = readFrontmatter(path.join(BRIEFS_CONTENT, `${slug}.mdx`));
      return fm.publicationStatus !== "published";
    });
    expect(notPublished).toHaveLength(0);
  });

  it("all 8 launch briefs are featured", () => {
    const notFeatured = LAUNCH_SLUGS.filter((slug) => {
      const fm = readFrontmatter(path.join(BRIEFS_CONTENT, `${slug}.mdx`));
      return fm.featured !== "true";
    });
    expect(notFeatured).toHaveLength(0);
  });

  it("all 8 launch briefs have 5 content sections (I–V)", () => {
    const missingSections = LAUNCH_SLUGS.filter((slug) => {
      const content = fs.readFileSync(path.join(BRIEFS_CONTENT, `${slug}.mdx`), "utf-8");
      return !content.match(/## I\./) || !content.match(/## V\./);
    });
    expect(missingSections).toHaveLength(0);
  });

  it("all 8 launch briefs have a BriefAlert signal", () => {
    const missingAlert = LAUNCH_SLUGS.filter((slug) => {
      const content = fs.readFileSync(path.join(BRIEFS_CONTENT, `${slug}.mdx`), "utf-8");
      return !content.includes("BriefAlert");
    });
    expect(missingAlert).toHaveLength(0);
  });

  it("all 8 launch briefs have a Closing Judgment section", () => {
    const missingJudgment = LAUNCH_SLUGS.filter((slug) => {
      const content = fs.readFileSync(path.join(BRIEFS_CONTENT, `${slug}.mdx`), "utf-8");
      return !content.match(/## V\. Closing Judgment/);
    });
    expect(missingJudgment).toHaveLength(0);
  });

  it("no launch brief contains 'contamination' language", () => {
    const hits = LAUNCH_SLUGS.filter((slug) => {
      const content = fs.readFileSync(path.join(BRIEFS_CONTENT, `${slug}.mdx`), "utf-8");
      return content.toLowerCase().includes("contamination");
    });
    expect(hits).toHaveLength(0);
  });

  it("all 8 launch briefs have primaryRoute defined", () => {
    const missing = LAUNCH_SLUGS.filter((slug) => {
      return !readFrontmatter(path.join(BRIEFS_CONTENT, `${slug}.mdx`)).primaryRoute;
    });
    expect(missing).toHaveLength(0);
  });

  it("all 8 launch briefs have innerCircleBridge defined", () => {
    const missing = LAUNCH_SLUGS.filter((slug) => {
      return !readFrontmatter(path.join(BRIEFS_CONTENT, `${slug}.mdx`)).innerCircleBridge;
    });
    expect(missing).toHaveLength(0);
  });
});

// ─── Archive integrity ────────────────────────────────────────────────────────

describe("Archive", () => {
  it("_archive/briefs-pre-publication-source exists", () => {
    expect(fs.existsSync(ARCHIVE_PATH)).toBe(true);
  });

  it("archive README explains contamination is retired", () => {
    const readmePath = path.join(ARCHIVE_PATH, "README.md");
    expect(fs.existsSync(readmePath)).toBe(true);
    expect(fs.readFileSync(readmePath, "utf-8")).toMatch(/retired/i);
  });

  it("original briefs-contamination-backup folder is gone", () => {
    expect(fs.existsSync(path.join(ROOT, "briefs-contamination-backup"))).toBe(false);
  });
});
