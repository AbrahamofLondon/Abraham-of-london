/**
 * lib/mdx/static-mdx-runtime.ts
 *
 * Static-safe MDX rendering utilities for SSG pages.
 *
 * This module MUST NOT import:
 *   - next-contentlayer2/hooks
 *   - mdx-bundler/client
 *   - useMDXComponent
 *   - getMDXComponent
 *
 * It provides markdown/HTML rendering for Contentlayer content
 * WITHOUT runtime MDX evaluation (new Function / eval).
 *
 * Use this in getStaticProps / SSG pages instead of SafeMDXRenderer.
 */

import * as React from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StaticRenderMode = "html" | "markdown" | "raw-mdx" | "empty";

export interface StaticRenderResult {
  mode: StaticRenderMode;
  /** The rendered HTML string. Empty string if mode is "empty". */
  html: string;
}

// ---------------------------------------------------------------------------
// Simple markdown → HTML converter (no dependencies)
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarkdownToHtml(content: string): string {
  let processed = content.replace(/\r\n/g, "\n").trim();
  if (!processed) return "";

  // Escape HTML first
  processed = escapeHtml(processed);

  // Links: [text](url)
  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="static-mdx-link">$1</a>',
  );

  // Bold: **text**
  processed = processed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic: *text*
  processed = processed.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  // Headings
  processed = processed.replace(/^###### (.+)$/gm, '<h6 class="static-mdx-h6">$1</h6>');
  processed = processed.replace(/^##### (.+)$/gm, '<h5 class="static-mdx-h5">$1</h5>');
  processed = processed.replace(/^#### (.+)$/gm, '<h4 class="static-mdx-h4">$1</h4>');
  processed = processed.replace(/^### (.+)$/gm, '<h3 class="static-mdx-h3">$1</h3>');
  processed = processed.replace(/^## (.+)$/gm, '<h2 class="static-mdx-h2">$1</h2>');
  processed = processed.replace(/^# (.+)$/gm, '<h1 class="static-mdx-h1">$1</h1>');

  // Horizontal rule
  processed = processed.replace(/^---$/gm, '<hr class="static-mdx-hr" />');

  // Blockquotes
  processed = processed.replace(
    /^&gt;\s?(.+)$/gm,
    '<blockquote class="static-mdx-blockquote">$1</blockquote>',
  );

  // Unordered lists
  const ulRegex = /(?:^[-*+]\s+.+(?:\n|$))+/gm;
  processed = processed.replace(ulRegex, (match) => {
    const items = match
      .split("\n")
      .map((line) => line.replace(/^[-*+]\s+/, "").trim())
      .filter(Boolean)
      .map((item) => `<li class="static-mdx-li">${item}</li>`)
      .join("");
    return `<ul class="static-mdx-ul">${items}</ul>`;
  });

  // Ordered lists
  const olRegex = /(?:^\d+\.\s+.+(?:\n|$))+/gm;
  processed = processed.replace(olRegex, (match) => {
    const items = match
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s+/, "").trim())
      .filter(Boolean)
      .map((item) => `<li class="static-mdx-oli">${item}</li>`)
      .join("");
    return `<ol class="static-mdx-ol">${items}</ol>`;
  });

  // Paragraphs: split by blank lines, wrap non-block elements
  const blocks = processed.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Skip if already wrapped in a block-level element
      if (/^<(h[1-6]|ul|ol|blockquote|hr|table|pre)/.test(trimmed)) return trimmed;
      return `<p class="static-mdx-p">${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Raw MDX → markdown-like text (strip JSX components, keep text)
// ---------------------------------------------------------------------------

function transformRawMdxToMarkdownLike(input: string): string {
  let s = input.replace(/\r\n/g, "\n").trim();
  if (!s) return "";

  // Strip import/export statements
  s = s.replace(/^\s*import\s.+?;?\s*$/gm, "");
  s = s.replace(/^\s*export\s.+?;?\s*$/gm, "");

  // Strip JSX component tags (self-closing and paired)
  s = s.replace(/<[A-Z][A-Za-z0-9._-]*\b[^>]*\/>/g, "");
  s = s.replace(/<[A-Z][A-Za-z0-9._-]*\b[^>]*>[\s\S]*?<\/[A-Z][A-Za-z0-9._-]*>/g, "");

  // Strip remaining JSX attributes from intrinsic elements
  s = s.replace(/\s+[A-Za-z_:][-A-Za-z0-9_:.]*=(?:\{[^}]*\}|"[^"]*"|'[^']*')/g, "");

  return s.trim();
}

// ---------------------------------------------------------------------------
// Content classifier (mirrors getRenderableBody logic but without imports)
// ---------------------------------------------------------------------------

function looksLikeCompiledMdx(value: string): boolean {
  if (!value) return false;
  return (
    /\bfunction\s+MDXContent\s*\(/.test(value) ||
    /\buseMDXComponents\b/.test(value) ||
    /\breturn\s+_jsx\s*\(/.test(value) ||
    /\breturn\s+_jsxs\s*\(/.test(value) ||
    /\b_jsx\s*\(/.test(value) ||
    /\b_jsxs\s*\(/.test(value) ||
    /\bjsxDEV\s*\(/.test(value) ||
    /react\/jsx-runtime/.test(value) ||
    /\/\*@jsxRuntime\s+automatic\*\//.test(value)
  );
}

function looksLikeLeakedModuleCode(value: string): boolean {
  if (!value) return false;
  return (
    /\bObject\.defineProperty\s*\(\s*exports\b/.test(value) ||
    /\bmodule\.exports\b/.test(value) ||
    /\bexports\.[A-Za-z_$]/.test(value) ||
    /\b__esModule\b/.test(value) ||
    /\brequire\s*\(/.test(value)
  );
}

function looksLikeReadableText(value: string): boolean {
  if (!value) return false;
  if (looksLikeCompiledMdx(value)) return false;
  if (looksLikeLeakedModuleCode(value)) return false;
  return (
    /^#{1,6}\s+/m.test(value) ||
    /^\s*[-*+]\s+/m.test(value) ||
    /^\s*\d+\.\s+/m.test(value) ||
    /(^|\n)\s*>\s+/.test(value) ||
    /\[([^\]]+)\]\(([^)]+)\)/.test(value) ||
    /```[\s\S]*?```/.test(value) ||
    /\*\*[^*]+\*\*/.test(value) ||
    value.length > 80
  );
}

// ---------------------------------------------------------------------------
// Main entry: render contentlayer doc body to static HTML
// ---------------------------------------------------------------------------

/**
 * Render Contentlayer document body to static HTML.
 *
 * This is the SSG-safe replacement for `getRenderableBody` + `SafeMDXRenderer`.
 * It does NOT import or use `useMDXComponent`, `next-contentlayer2/hooks`,
 * or `mdx-bundler/client`.
 *
 * Design:
 * - If body.code is compiled MDX (requires runtime eval), skip it and fall
 *   through to body.raw / content for static rendering.
 * - If body.code is leaked module code, skip it as suspicious.
 * - If body.code is readable text, render it directly as markdown.
 * - If body.raw is available and readable, transform MDX-like tags and render.
 * - Never returns empty HTML when a viable raw text fallback exists.
 */
export function renderDocBodyToStaticHtml(doc: any): StaticRenderResult {
  const bodyCode = typeof doc?.body?.code === "string" ? doc.body.code.trim() : "";
  const legacyBodyCode = typeof doc?.bodyCode === "string" ? doc.bodyCode.trim() : "";
  const rawBody = typeof doc?.body?.raw === "string" ? doc.body.raw.trim() : "";
  const content = typeof doc?.content === "string" ? doc.content.trim() : "";

  // 1. Try body.code — if it's compiled MDX, skip to raw fallback
  if (bodyCode) {
    if (looksLikeCompiledMdx(bodyCode) && !looksLikeLeakedModuleCode(bodyCode)) {
      // Compiled MDX requires runtime evaluation — fall through to raw body
      // instead of returning empty.
    } else if (looksLikeLeakedModuleCode(bodyCode)) {
      // Suspicious — skip body.code, fall through to raw body
    } else if (looksLikeReadableText(bodyCode)) {
      // Raw readable text — render as markdown
      return {
        mode: "markdown",
        html: renderMarkdownToHtml(bodyCode),
      };
    }
  }

  // 2. Try legacy bodyCode
  if (legacyBodyCode) {
    if (looksLikeCompiledMdx(legacyBodyCode) && !looksLikeLeakedModuleCode(legacyBodyCode)) {
      // Compiled MDX — fall through to raw body
    } else if (looksLikeReadableText(legacyBodyCode)) {
      return {
        mode: "markdown",
        html: renderMarkdownToHtml(legacyBodyCode),
      };
    }
  }

  // 3. Try raw body content
  const rawCandidate = rawBody || content;
  if (rawCandidate && looksLikeReadableText(rawCandidate)) {
    const cleaned = transformRawMdxToMarkdownLike(rawCandidate);
    return {
      mode: "raw-mdx",
      html: renderMarkdownToHtml(cleaned),
    };
  }

  // 4. Empty
  return { mode: "empty", html: "" };
}

// ---------------------------------------------------------------------------
// React component for static MDX rendering
// ---------------------------------------------------------------------------

interface StaticMDXRendererProps {
  /** The document object from Contentlayer */
  doc?: any;
  /** Pre-rendered HTML (if already computed in getStaticProps) */
  html?: string;
  /** CSS class name for the wrapper div */
  className?: string;
  /** Fallback content when nothing to render */
  fallback?: React.ReactNode;
}

/**
 * StaticMDXRenderer — renders Contentlayer content WITHOUT useMDXComponent.
 *
 * Safe to use in SSG (getStaticProps) pages.
 * Does not import next-contentlayer2/hooks or mdx-bundler/client.
 *
 * Usage in getStaticProps:
 *   const { html } = renderDocBodyToStaticHtml(doc);
 *   return { props: { staticHtml: html } };
 *
 * Usage in component:
 *   <StaticMDXRenderer html={staticHtml} />
 */
export function StaticMDXRenderer({
  doc,
  html: propHtml,
  className,
  fallback,
}: StaticMDXRendererProps) {
  const html = React.useMemo(() => {
    if (propHtml !== undefined) return propHtml;
    if (doc) return renderDocBodyToStaticHtml(doc).html;
    return "";
  }, [doc, propHtml]);

  if (!html) {
    return <>{fallback ?? null}</>;
  }

  return (
    <div
      className={className ?? "static-mdx-content prose prose-invert max-w-none"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
