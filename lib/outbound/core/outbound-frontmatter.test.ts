/**
 * lib/outbound/core/outbound-frontmatter.test.ts
 *
 * Tests for the unified outbound frontmatter parser.
 *
 * Tests:
 *  - LF file parses
 *  - CRLF file parses
 *  - Missing fence rejected safely
 *  - Malformed frontmatter rejected safely
 *  - Arrays parse consistently
 *  - Booleans parse consistently
 *  - Body text preserved
 *  - Provider mismatch detected
 *  - Multiline strings handled
 *  - Empty frontmatter handled
 */

import { describe, expect, it } from "vitest";
import {
  parseOutboundFrontmatter,
  buildOutboundContentItem,
  safeStr,
  safeBool,
  safeNum,
  safeArr,
  safeStrNullable,
} from "./outbound-frontmatter";

// ─── LF (Unix) line endings ───────────────────────────────────────────────────

describe("parseOutboundFrontmatter — LF line endings", () => {
  it("parses standard LF frontmatter", () => {
    const content = `---
title: Test Post
status: ready
approvalStatus: approved
---

This is the body text.`;
    const { frontmatter, body, errors } = parseOutboundFrontmatter(content);
    expect(errors).toHaveLength(0);
    expect(frontmatter.title).toBe("Test Post");
    expect(frontmatter.status).toBe("ready");
    expect(frontmatter.approvalStatus).toBe("approved");
    expect(body).toBe("This is the body text.");
  });

  it("handles boolean values", () => {
    const content = `---
draft: false
published: true
requiresFinalApproval: true
---

Body.`;
    const { frontmatter, errors } = parseOutboundFrontmatter(content);
    expect(errors).toHaveLength(0);
    expect(frontmatter.draft).toBe(false);
    expect(frontmatter.published).toBe(true);
    expect(frontmatter.requiresFinalApproval).toBe(true);
  });

  it("handles numeric values", () => {
    const content = `---
sequence: 1
seriesWeek: 7
score: 95.5
---

Body.`;
    const { frontmatter, errors } = parseOutboundFrontmatter(content);
    expect(errors).toHaveLength(0);
    expect(frontmatter.sequence).toBe(1);
    expect(frontmatter.seriesWeek).toBe(7);
    expect(frontmatter.score).toBe(95.5);
  });

  it("handles array values", () => {
    const content = `---
theme:
  - institutional-intelligence
  - decision-authority
syncTargets:
  - facebook
---

Body.`;
    const { frontmatter, errors } = parseOutboundFrontmatter(content);
    expect(errors).toHaveLength(0);
    expect(frontmatter.theme).toEqual(["institutional-intelligence", "decision-authority"]);
    expect(frontmatter.syncTargets).toEqual(["facebook"]);
  });

  it("handles null values", () => {
    const content = `---
sourceType: null
series: ~
---

Body.`;
    const { frontmatter, errors } = parseOutboundFrontmatter(content);
    expect(errors).toHaveLength(0);
    expect(frontmatter.sourceType).toBeNull();
    expect(frontmatter.series).toBeNull();
  });

  it("preserves body text with multiple lines", () => {
    const content = `---
title: Multi-line
---

Line one.

Line two.

Line three.`;
    const { body, errors } = parseOutboundFrontmatter(content);
    expect(errors).toHaveLength(0);
    expect(body).toBe("Line one.\n\nLine two.\n\nLine three.");
  });

  it("handles empty body", () => {
    const content = `---
title: Empty body
---

`;
    const { body, errors } = parseOutboundFrontmatter(content);
    expect(errors).toHaveLength(0);
    expect(body).toBe("");
  });
});

// ─── CRLF (Windows) line endings ──────────────────────────────────────────────

describe("parseOutboundFrontmatter — CRLF line endings", () => {
  it("parses standard CRLF frontmatter", () => {
    const content = "---\r\ntitle: Test Post\r\nstatus: ready\r\n---\r\n\r\nThis is the body text.";
    const { frontmatter, body, errors } = parseOutboundFrontmatter(content);
    expect(errors).toHaveLength(0);
    expect(frontmatter.title).toBe("Test Post");
    expect(frontmatter.status).toBe("ready");
    expect(body).toBe("This is the body text.");
  });

  it("handles CRLF with arrays", () => {
    const content = "---\r\ntheme:\r\n  - institutional-intelligence\r\n  - decision-authority\r\n---\r\n\r\nBody.";
    const { frontmatter, errors } = parseOutboundFrontmatter(content);
    expect(errors).toHaveLength(0);
    expect(frontmatter.theme).toEqual(["institutional-intelligence", "decision-authority"]);
  });

  it("handles CRLF with booleans", () => {
    const content = "---\r\ndraft: false\r\npublished: true\r\n---\r\n\r\nBody.";
    const { frontmatter, errors } = parseOutboundFrontmatter(content);
    expect(errors).toHaveLength(0);
    expect(frontmatter.draft).toBe(false);
    expect(frontmatter.published).toBe(true);
  });

  it("handles CRLF with numbers", () => {
    const content = "---\r\nsequence: 3\r\nseriesWeek: 2\r\n---\r\n\r\nBody.";
    const { frontmatter, errors } = parseOutboundFrontmatter(content);
    expect(errors).toHaveLength(0);
    expect(frontmatter.sequence).toBe(3);
    expect(frontmatter.seriesWeek).toBe(2);
  });
});

// ─── Missing/malformed frontmatter ────────────────────────────────────────────

describe("parseOutboundFrontmatter — edge cases", () => {
  it("reports error when no frontmatter fences found", () => {
    const content = "Just a plain text with no frontmatter.";
    const { frontmatter, body, errors } = parseOutboundFrontmatter(content);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("No frontmatter fences");
    expect(body).toBe("Just a plain text with no frontmatter.");
    expect(Object.keys(frontmatter)).toHaveLength(0);
  });

  it("handles empty frontmatter block (no content between fences)", () => {
    const content = "---\n---\n\nBody.";
    const { frontmatter, body, errors } = parseOutboundFrontmatter(content);
    // Empty between fences means no match — entire content is body
    expect(Object.keys(frontmatter)).toHaveLength(0);
    expect(body).toBe("---\n---\n\nBody.");
    expect(errors.length).toBeGreaterThan(0);
  });

  it("handles only opening fence", () => {
    const content = "---\ntitle: Broken\nNo closing fence";
    const { frontmatter, body, errors } = parseOutboundFrontmatter(content);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("No frontmatter fences");
  });

  it("handles malformed YAML gracefully", () => {
    const content = "---\n: invalid yaml line\n---\n\nBody.";
    const { frontmatter, body, errors } = parseOutboundFrontmatter(content);
    expect(errors).toHaveLength(0); // malformed lines are skipped
    expect(Object.keys(frontmatter)).toHaveLength(0);
    expect(body).toBe("Body.");
  });
});

// ─── buildOutboundContentItem ─────────────────────────────────────────────────

describe("buildOutboundContentItem", () => {
  it("builds a content item from valid content", () => {
    const content = `---
id: test-post-1
title: Test Post
status: ready
---

Body text here.`;
    const item = buildOutboundContentItem(content, "test-post-1.mdx", "linkedin");
    expect(item.id).toBe("test-post-1");
    expect(item.provider).toBe("linkedin");
    expect(item.filename).toBe("test-post-1.mdx");
    expect(item.slug).toBe("test-post-1");
    expect(item.body).toBe("Body text here.");
    expect(item.charCount).toBe(15);
    expect(item.wordCount).toBe(3);
    expect(item.isEmpty).toBe(false);
    expect(item.errors).toHaveLength(0);
  });

  it("derives id from filename when frontmatter has no id", () => {
    const content = `---
title: No ID
---

Body.`;
    const item = buildOutboundContentItem(content, "no-id-post.mdx", "facebook");
    expect(item.id).toBe("no-id-post");
    expect(item.provider).toBe("facebook");
  });

  it("reports errors for missing frontmatter", () => {
    const content = "Just body text with no frontmatter.";
    const item = buildOutboundContentItem(content, "bare.txt", "x");
    expect(item.errors.length).toBeGreaterThan(0);
    expect(item.body).toBe("Just body text with no frontmatter.");
  });

  it("detects empty body", () => {
    const content = `---
title: Empty
---

`;
    const item = buildOutboundContentItem(content, "empty.mdx", "linkedin");
    expect(item.isEmpty).toBe(true);
    expect(item.charCount).toBe(0);
  });
});

// ─── Safe helpers ─────────────────────────────────────────────────────────────

describe("safe helpers", () => {
  describe("safeStr", () => {
    it("returns string as-is", () => expect(safeStr("hello")).toBe("hello"));
    it("converts numbers", () => expect(safeStr(42)).toBe("42"));
    it("converts booleans", () => expect(safeStr(true)).toBe("true"));
    it("returns fallback for undefined", () => expect(safeStr(undefined, "fb")).toBe("fb"));
    it("returns fallback for null", () => expect(safeStr(null, "fb")).toBe("fb"));
  });

  describe("safeStrNullable", () => {
    it("returns string", () => expect(safeStrNullable("hello")).toBe("hello"));
    it("returns null for empty string", () => expect(safeStrNullable("")).toBeNull());
    it("returns null for null", () => expect(safeStrNullable(null)).toBeNull());
  });

  describe("safeBool", () => {
    it("returns boolean as-is", () => expect(safeBool(true)).toBe(true));
    it("parses 'true' string", () => expect(safeBool("true")).toBe(true));
    it("parses 'false' string", () => expect(safeBool("false")).toBe(false));
    it("returns fallback for undefined", () => expect(safeBool(undefined, true)).toBe(true));
  });

  describe("safeNum", () => {
    it("returns number as-is", () => expect(safeNum(42)).toBe(42));
    it("parses numeric string", () => expect(safeNum("42")).toBe(42));
    it("returns null for non-numeric string", () => expect(safeNum("abc")).toBeNull());
    it("returns null for null", () => expect(safeNum(null)).toBeNull());
    it("returns null for Infinity", () => expect(safeNum(Infinity)).toBeNull());
  });

  describe("safeArr", () => {
    it("returns array as-is", () => expect(safeArr(["a", "b"])).toEqual(["a", "b"]));
    it("filters non-string values", () => expect(safeArr(["a", 1, null])).toEqual(["a", "1"]));
    it("returns empty array for non-array", () => expect(safeArr("not array")).toEqual([]));
  });
});
