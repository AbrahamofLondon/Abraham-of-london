/**
 * lib/blog/select-featured-post.test.ts
 *
 * Tests for the selectFeaturedEssay helper.
 *
 * Covers:
 *   - featured=true wins over newest
 *   - multiple featured → newest wins
 *   - no featured → newest non-series wins
 *   - series parts excluded by default
 *   - series parts included when allowSeriesParts=true
 *   - empty / null inputs
 *   - all posts are series parts (no eligible) → null
 */

import { describe, expect, it } from "vitest";
import { selectFeaturedEssay } from "./select-featured-post";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const oldest = {
  slug: "oldest",
  title: "Oldest",
  dateIso: "2023-01-01T00:00:00.000Z",
  featured: false,
  series: null,
};

const middle = {
  slug: "middle",
  title: "Middle",
  dateIso: "2024-06-15T00:00:00.000Z",
  featured: false,
  series: null,
};

const newest = {
  slug: "newest",
  title: "Newest",
  dateIso: "2025-09-10T00:00:00.000Z",
  featured: false,
  series: null,
};

const featuredOld = {
  slug: "featured-old",
  title: "Featured Old",
  dateIso: "2023-03-01T00:00:00.000Z",
  featured: true,
  series: null,
};

const featuredNew = {
  slug: "featured-new",
  title: "Featured New",
  dateIso: "2025-08-20T00:00:00.000Z",
  featured: true,
  series: null,
};

const seriesPart = {
  slug: "the-accountant-in-uruk",
  title: "The Accountant in Uruk",
  dateIso: "2025-11-01T00:00:00.000Z", // newer than everything else
  featured: false,
  series: "the-burden-changes-hands",
};

const featuredSeriesPart = {
  slug: "who-holds-the-stylus",
  title: "Who Holds the Stylus",
  dateIso: "2025-11-05T00:00:00.000Z",
  featured: true,
  series: "the-burden-changes-hands",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("selectFeaturedEssay — basic cases", () => {
  it("returns null for an empty array", () => {
    expect(selectFeaturedEssay([])).toBeNull();
  });

  it("returns null for a null/undefined input", () => {
    // @ts-expect-error — testing runtime safety
    expect(selectFeaturedEssay(null)).toBeNull();
    // @ts-expect-error
    expect(selectFeaturedEssay(undefined)).toBeNull();
  });

  it("returns the only post when given a single post", () => {
    expect(selectFeaturedEssay([newest])).toBe(newest);
  });
});

describe("selectFeaturedEssay — no featured flag", () => {
  it("returns the newest post when none are featured", () => {
    const result = selectFeaturedEssay([oldest, newest, middle]);
    expect(result?.slug).toBe("newest");
  });

  it("does not mutate the input array", () => {
    const posts = [oldest, newest, middle];
    selectFeaturedEssay(posts);
    expect(posts[0]?.slug).toBe("oldest"); // order unchanged
  });
});

describe("selectFeaturedEssay — featured=true wins", () => {
  it("prefers a featured post over a newer non-featured post", () => {
    // featuredOld is older but featured; newest is newer but not featured
    const result = selectFeaturedEssay([newest, featuredOld, middle]);
    expect(result?.slug).toBe("featured-old");
  });

  it("returns the single featured post even if others are newer", () => {
    const result = selectFeaturedEssay([oldest, newest, middle, featuredOld]);
    expect(result?.slug).toBe("featured-old");
  });
});

describe("selectFeaturedEssay — multiple featured posts", () => {
  it("returns the newest featured post when multiple are featured", () => {
    const result = selectFeaturedEssay([featuredOld, featuredNew, newest]);
    expect(result?.slug).toBe("featured-new");
  });

  it("returns the only featured post when one of two is featured", () => {
    const result = selectFeaturedEssay([featuredOld, oldest, newest]);
    expect(result?.slug).toBe("featured-old");
  });
});

describe("selectFeaturedEssay — series exclusion (default)", () => {
  it("excludes series parts by default (even if newer)", () => {
    // seriesPart has the most recent date, but should be excluded
    const result = selectFeaturedEssay([oldest, newest, seriesPart]);
    expect(result?.slug).toBe("newest");
  });

  it("excludes a featured series part by default", () => {
    // featuredSeriesPart is both featured AND newer, but should be excluded
    const result = selectFeaturedEssay([oldest, newest, featuredSeriesPart]);
    expect(result?.slug).toBe("newest");
  });

  it("returns null when all posts are series parts and allowSeriesParts=false", () => {
    const result = selectFeaturedEssay([seriesPart, featuredSeriesPart]);
    expect(result).toBeNull();
  });
});

describe("selectFeaturedEssay — allowSeriesParts=true", () => {
  it("includes series parts when allowSeriesParts=true", () => {
    const result = selectFeaturedEssay(
      [oldest, newest, seriesPart],
      { allowSeriesParts: true },
    );
    // seriesPart is newest
    expect(result?.slug).toBe("the-accountant-in-uruk");
  });

  it("a featured series part wins when allowSeriesParts=true", () => {
    const result = selectFeaturedEssay(
      [oldest, newest, featuredSeriesPart],
      { allowSeriesParts: true },
    );
    expect(result?.slug).toBe("who-holds-the-stylus");
  });
});

describe("selectFeaturedEssay — works with partial FeaturedCandidate shape", () => {
  it("handles posts with no dateIso (sorts stably)", () => {
    const noDates = [
      { slug: "a", featured: false },
      { slug: "b", featured: false },
    ];
    const result = selectFeaturedEssay(noDates);
    // Neither has a date — should still return one without crashing
    expect(result).not.toBeNull();
  });

  it("handles posts where featured is undefined (treated as non-featured)", () => {
    const withUndefined = [
      { slug: "x", dateIso: "2024-01-01T00:00:00.000Z" },
      { slug: "y", dateIso: "2025-01-01T00:00:00.000Z" },
    ];
    const result = selectFeaturedEssay(withUndefined);
    expect(result?.slug).toBe("y"); // newest wins
  });
});

describe("selectFeaturedEssay — archive exclusion invariant", () => {
  it("the selected post is always in the input list", () => {
    const posts = [oldest, newest, middle, featuredOld];
    const result = selectFeaturedEssay(posts);
    expect(posts).toContain(result);
  });

  it("archiveStories derived by filter correctly excludes lead story", () => {
    const posts = [oldest, newest, middle, featuredOld];
    const lead = selectFeaturedEssay(posts);
    const archive = posts.filter((p) => p.slug !== lead?.slug);
    expect(archive).not.toContain(lead);
    expect(archive).toHaveLength(posts.length - 1);
  });
});
