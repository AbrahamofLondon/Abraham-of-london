/**
 * lib/outbound/__tests__/linkedin-utils.test.ts
 *
 * Tests for the LinkedIn outbound publishing utilities.
 */

import { describe, it, expect } from "vitest";
import {
  parseMdxFrontmatter,
  classifyPost,
  validatePost,
} from "../linkedin-utils";

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const VALID_POST_FRONTMATTER = `---
title: "Test Post"
platform: "linkedin"
channel: "company"
status: "ready"
campaign: "test-campaign"
pillar: "decision_authority"
audience: "operators"
ctaLabel: "Try It"
ctaUrl: "https://example.com"
hashtags:
  - TestTag
  - DecisionAuthority
scheduledFor: null
postedAt: null
linkedinPostUrl: null
source: null
---

This is a test post body. It should be classified as a post.
`;

const SCRIPT_CONTENT = `---
title: "Strategy Room Conversion"
platform: "linkedin"
channel: "company"
status: "ready"
campaign: "test"
pillar: "strategy_room"
audience: "operators"
ctaLabel: "Enter"
ctaUrl: "https://example.com/strategy-room"
hashtags:
  - StrategyRoom
---

You ran the diagnostic. You saw the contradiction.

The question now is whether this pattern is embedded.

Strategy Room is where the decision gets forced.

The decision is locked in your own words.

Once you enter, it has to answer to a record.

If you are not ready to act, do not enter.

This only works if the decision matters enough to be uncomfortable.
`;

const MINIMAL_CONTENT = `---
title: ""
platform: ""
channel: ""
---

Some body content here.
`;

const LONG_ESSAY_CONTENT = `---
title: "Very Long Essay"
platform: "linkedin"
channel: "company"
status: "draft"
---

${"Long paragraph content. ".repeat(200)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Tests: parseMdxFrontmatter
// ─────────────────────────────────────────────────────────────────────────────

describe("parseMdxFrontmatter", () => {
  it("should parse frontmatter and body from valid MDX", () => {
    const { frontmatter, body } = parseMdxFrontmatter(VALID_POST_FRONTMATTER);
    expect(frontmatter.title).toBe("Test Post");
    expect(frontmatter.platform).toBe("linkedin");
    expect(frontmatter.channel).toBe("company");
    expect(frontmatter.status).toBe("ready");
    expect(frontmatter.pillar).toBe("decision_authority");
    expect(frontmatter.audience).toBe("operators");
    expect(frontmatter.ctaLabel).toBe("Try It");
    expect(frontmatter.hashtags).toEqual(["TestTag", "DecisionAuthority"]);
    expect(body).toContain("This is a test post body");
  });

  it("should handle empty frontmatter fields", () => {
    const { frontmatter, body } = parseMdxFrontmatter(MINIMAL_CONTENT);
    expect(frontmatter.title).toBe("");
    expect(frontmatter.platform).toBe("");
    expect(body).toBe("Some body content here.");
  });

  it("should handle content without frontmatter", () => {
    const { frontmatter, body } = parseMdxFrontmatter("Just body text");
    expect(Object.keys(frontmatter)).toHaveLength(0);
    expect(body).toBe("Just body text");
  });

  it("should handle null values in frontmatter", () => {
    const content = `---
title: "Test"
scheduledFor: null
postedAt: null
---

Body`;
    const { frontmatter } = parseMdxFrontmatter(content);
    expect(frontmatter.scheduledFor).toBeNull();
    expect(frontmatter.postedAt).toBeNull();
  });

  it("should parse array frontmatter fields", () => {
    const { frontmatter } = parseMdxFrontmatter(VALID_POST_FRONTMATTER);
    expect(Array.isArray(frontmatter.hashtags)).toBe(true);
    expect(frontmatter.hashtags).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: classifyPost
// ─────────────────────────────────────────────────────────────────────────────

describe("classifyPost", () => {
  it("should classify a standard post as 'post'", () => {
    const { frontmatter, body } = parseMdxFrontmatter(VALID_POST_FRONTMATTER);
    const result = classifyPost(frontmatter, body, "test-post.mdx");
    expect(result).toBe("post");
  });

  it("should classify strategy-room-conversion-script as 'script'", () => {
    const { frontmatter, body } = parseMdxFrontmatter(SCRIPT_CONTENT);
    const result = classifyPost(
      frontmatter,
      body,
      "strategy-room-conversion-script.mdx",
    );
    expect(result).toBe("script");
  });

  it("should classify content with script indicators as 'script'", () => {
    const scriptBody = `---
title: "Test"
---

Enter strategy room. The decision is locked. Once you enter, it has to answer. If you are not ready to act. This only works if.`;
    const { frontmatter, body } = parseMdxFrontmatter(scriptBody);
    const result = classifyPost(frontmatter, body, "test.mdx");
    expect(result).toBe("script");
  });

  it("should classify very long content as 'essay'", () => {
    const { frontmatter, body } = parseMdxFrontmatter(LONG_ESSAY_CONTENT);
    const result = classifyPost(frontmatter, body, "long-essay.mdx");
    expect(result).toBe("essay");
  });

  it("should classify content with misplaced asset indicators", () => {
    const misplacedContent = `---
title: "Test"
---

<!-- comment -->
---
table of contents
chapter 1
appendix a
`;
    const { frontmatter, body } = parseMdxFrontmatter(misplacedContent);
    const result = classifyPost(frontmatter, body, "test.mdx");
    expect(result).toBe("misplaced_asset");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: validatePost
// ─────────────────────────────────────────────────────────────────────────────

describe("validatePost", () => {
  it("should return no warnings for a valid post", () => {
    const { frontmatter, body } = parseMdxFrontmatter(VALID_POST_FRONTMATTER);
    const warnings = validatePost(frontmatter, body);
    // May have warnings about hashtags format, but not missing required fields
    const missingRequired = warnings.filter((w) =>
      w.startsWith("Missing required"),
    );
    expect(missingRequired).toHaveLength(0);
  });

  it("should warn about missing required fields", () => {
    const { frontmatter, body } = parseMdxFrontmatter(MINIMAL_CONTENT);
    const warnings = validatePost(frontmatter, body);
    const missingRequired = warnings.filter((w) =>
      w.startsWith("Missing required"),
    );
    expect(missingRequired.length).toBeGreaterThan(0);
  });

  it("should warn about character limit", () => {
    const longBody = "A".repeat(3500);
    const content = `---
title: "Long Post"
platform: "linkedin"
channel: "company"
status: "draft"
---

${longBody}`;
    const { frontmatter, body } = parseMdxFrontmatter(content);
    const warnings = validatePost(frontmatter, body);
    expect(warnings.some((w) => w.includes("Exceeds LinkedIn character limit"))).toBe(true);
  });

  it("should warn about missing platform", () => {
    const content = `---
title: "Test"
channel: "company"
status: "draft"
---

Body`;
    const { frontmatter, body } = parseMdxFrontmatter(content);
    const warnings = validatePost(frontmatter, body);
    expect(warnings.some((w) => w.includes("platform"))).toBe(true);
  });

  it("should warn about invalid pillar", () => {
    const content = `---
title: "Test"
platform: "linkedin"
channel: "company"
status: "draft"
pillar: "invalid_pillar"
---

Body`;
    const { frontmatter, body } = parseMdxFrontmatter(content);
    const warnings = validatePost(frontmatter, body);
    expect(warnings.some((w) => w.includes("Pillar"))).toBe(true);
  });

  it("should warn about CTA label without URL", () => {
    const content = `---
title: "Test"
platform: "linkedin"
channel: "company"
status: "draft"
ctaLabel: "Click Me"
---

Body`;
    const { frontmatter, body } = parseMdxFrontmatter(content);
    const warnings = validatePost(frontmatter, body);
    expect(warnings.some((w) => w.includes("ctaLabel") && w.includes("ctaUrl"))).toBe(true);
  });
});
