/**
 * lib/mdx/static-mdx-runtime.test.ts
 *
 * Tests for renderDocBodyToStaticHtml — the SSG-safe MDX renderer.
 *
 * Coverage:
 * - compiled body.code + valid body.raw → rendered HTML via raw fallback
 * - compiled body.code with no body.raw → empty safely
 * - readable body.code → rendered as markdown
 * - raw editorial MDX with Callout/PullQuote-like tags → stripped and rendered
 * - empty doc → empty result
 * - leaked module code in body.code → skipped safely
 */

import { describe, expect, it } from "vitest";
import { renderDocBodyToStaticHtml } from "./static-mdx-runtime";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal Contentlayer-like document for testing. */
function makeDoc(overrides: {
  bodyCode?: string;
  legacyBodyCode?: string;
  rawBody?: string;
  content?: string;
}): any {
  const doc: any = {};
  if (overrides.bodyCode !== undefined) {
    doc.body = { ...(doc.body || {}), code: overrides.bodyCode };
  }
  if (overrides.rawBody !== undefined) {
    doc.body = { ...(doc.body || {}), raw: overrides.rawBody };
  }
  if (overrides.legacyBodyCode !== undefined) {
    doc.bodyCode = overrides.legacyBodyCode;
  }
  if (overrides.content !== undefined) {
    doc.content = overrides.content;
  }
  return doc;
}

/** Compiled MDX snippet (simulated — looks like real contentlayer output). */
function compiledMdxSnippet(): string {
  return [
    'var ye=Object.create;var L=Object.defineProperty;',
    'function MDXContent() {',
    '  return _jsx("div", { children: "Hello" });',
    '}',
    'export default MDXContent;',
  ].join("\n");
}

/** Raw editorial MDX with JSX component tags. */
function rawEditorialMdx(): string {
  return [
    "Man was not made merely to exist.",
    "",
    "That is the thesis.",
    "",
    "<Callout type=\"framework\" title=\"The Question\">",
    "What is man for?",
    "</Callout>",
    "",
    "## The Mandate",
    "",
    "Every civilisation answers this question.",
    "",
    "<PullQuote align=\"center\">",
    "Purpose is not a discovery. It is a recovery.",
    "</PullQuote>",
    "",
    "---",
    "",
    "### A Subheading",
    "",
    "Some **bold** and *italic* text with a [link](/test).",
  ].join("\n");
}

/** Readable markdown text (no compiled code). */
function readableMarkdown(): string {
  return [
    "# Hello World",
    "",
    "This is a **test** paragraph with a [link](/here).",
    "",
    "- Item one",
    "- Item two",
    "",
    "> A blockquote.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("renderDocBodyToStaticHtml", () => {
  // ── compiled body.code + valid body.raw ────────────────────────────────
  it("falls through to body.raw when body.code is compiled MDX", () => {
    const doc = makeDoc({
      bodyCode: compiledMdxSnippet(),
      rawBody: rawEditorialMdx(),
    });

    const result = renderDocBodyToStaticHtml(doc);

    expect(result.mode).toBe("raw-mdx");
    expect(result.html).toBeTruthy();
    // Should contain rendered markdown from the raw body
    expect(result.html).toContain("Man was not made merely to exist");
    expect(result.html).toContain("The Mandate");
    expect(result.html).toContain("<strong>bold</strong>");
    expect(result.html).toContain("<em>italic</em>");
    expect(result.html).toContain('<a href="/test"');
    // JSX component tags should be stripped
    expect(result.html).not.toContain("<Callout");
    expect(result.html).not.toContain("<PullQuote");
    expect(result.html).not.toContain("</Callout>");
    expect(result.html).not.toContain("</PullQuote>");
  });

  // ── compiled body.code with no body.raw ────────────────────────────────
  it("returns empty when body.code is compiled MDX and no body.raw exists", () => {
    const doc = makeDoc({
      bodyCode: compiledMdxSnippet(),
      // No rawBody, no content
    });

    const result = renderDocBodyToStaticHtml(doc);

    expect(result.mode).toBe("empty");
    expect(result.html).toBe("");
  });

  // ── compiled body.code falls through to content field ──────────────────
  it("falls through to content field when body.code is compiled and no body.raw", () => {
    const doc = makeDoc({
      bodyCode: compiledMdxSnippet(),
      content: "Some **fallback** content.",
    });

    const result = renderDocBodyToStaticHtml(doc);

    expect(result.mode).toBe("raw-mdx");
    expect(result.html).toBeTruthy();
    expect(result.html).toContain("<strong>fallback</strong>");
  });

  // ── readable body.code renders directly ────────────────────────────────
  it("renders readable body.code as markdown", () => {
    const doc = makeDoc({
      bodyCode: readableMarkdown(),
    });

    const result = renderDocBodyToStaticHtml(doc);

    expect(result.mode).toBe("markdown");
    expect(result.html).toBeTruthy();
    expect(result.html).toContain("<h1");
    expect(result.html).toContain("Hello World");
    expect(result.html).toContain("<strong>test</strong>");
    expect(result.html).toContain("<blockquote");
  });

  // ── raw editorial MDX with JSX tags ────────────────────────────────────
  it("strips JSX component tags from raw editorial MDX and renders cleanly", () => {
    const doc = makeDoc({
      rawBody: rawEditorialMdx(),
    });

    const result = renderDocBodyToStaticHtml(doc);

    expect(result.mode).toBe("raw-mdx");
    expect(result.html).toBeTruthy();
    // Core text preserved
    expect(result.html).toContain("Man was not made merely to exist");
    expect(result.html).toContain("That is the thesis");
    // JSX tags removed
    expect(result.html).not.toContain("<Callout");
    expect(result.html).not.toContain("</Callout>");
    expect(result.html).not.toContain("<PullQuote");
    expect(result.html).not.toContain("</PullQuote>");
    // Content between JSX tags is stripped along with the tags
    expect(result.html).not.toContain("What is man for?");
    expect(result.html).not.toContain("Purpose is not a discovery");
    // Markdown headings rendered
    expect(result.html).toContain("The Mandate");
    // Horizontal rules rendered
    expect(result.html).toContain("<hr");
  });

  // ── empty doc ──────────────────────────────────────────────────────────
  it("returns empty for a doc with no body fields", () => {
    const doc = makeDoc({});

    const result = renderDocBodyToStaticHtml(doc);

    expect(result.mode).toBe("empty");
    expect(result.html).toBe("");
  });

  // ── null/undefined doc ─────────────────────────────────────────────────
  it("returns empty for null doc", () => {
    const result = renderDocBodyToStaticHtml(null);
    expect(result.mode).toBe("empty");
    expect(result.html).toBe("");
  });

  it("returns empty for undefined doc", () => {
    const result = renderDocBodyToStaticHtml(undefined);
    expect(result.mode).toBe("empty");
    expect(result.html).toBe("");
  });

  // ── leaked module code ─────────────────────────────────────────────────
  it("skips body.code that looks like leaked module code and falls through", () => {
    const doc = makeDoc({
      bodyCode: [
        'Object.defineProperty(exports, "__esModule", { value: true });',
        'exports.default = function() {};',
      ].join("\n"),
      rawBody: "Fallback **content** here.",
    });

    const result = renderDocBodyToStaticHtml(doc);

    expect(result.mode).toBe("raw-mdx");
    expect(result.html).toBeTruthy();
    expect(result.html).toContain("<strong>content</strong>");
  });

  // ── legacy bodyCode field ──────────────────────────────────────────────
  it("renders readable legacy bodyCode as markdown", () => {
    const doc = makeDoc({
      legacyBodyCode: "## Legacy Title\n\nSome legacy text.",
    });

    const result = renderDocBodyToStaticHtml(doc);

    expect(result.mode).toBe("markdown");
    expect(result.html).toContain("Legacy Title");
    expect(result.html).toContain("legacy text");
  });

  // ── compiled legacy bodyCode falls through ─────────────────────────────
  it("falls through when legacy bodyCode is compiled MDX", () => {
    const doc = makeDoc({
      legacyBodyCode: compiledMdxSnippet(),
      rawBody: "## Fallback Title\n\nThis is a longer raw fallback text that contains markdown patterns like headings and enough content to be detected as readable.",
    });

    const result = renderDocBodyToStaticHtml(doc);

    expect(result.mode).toBe("raw-mdx");
    expect(result.html).toContain("Fallback Title");
    expect(result.html).toContain("raw fallback text");
  });

  // ── body.code + body.raw both present, body.code is readable ───────────
  it("prefers readable body.code over body.raw", () => {
    const doc = makeDoc({
      bodyCode: "# Code Title\n\nFrom code.",
      rawBody: "Raw content that should not be used.",
    });

    const result = renderDocBodyToStaticHtml(doc);

    expect(result.mode).toBe("markdown");
    expect(result.html).toContain("Code Title");
    expect(result.html).toContain("From code");
    expect(result.html).not.toContain("Raw content");
  });
});
