/* components/mdx/SafeMDXRenderer.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { getSafeComponents } from "@/components/mdx/MDXComponents";
import type { TierDirective } from "@/lib/resources/tier-metadata";

const IS_DEV = process.env.NODE_ENV !== "production";

interface SafeMDXRendererProps {
  code?: string | null;
  components?: Record<string, any>;
  directive?: TierDirective;
  debug?: boolean;
  disableBaseComponents?: boolean;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function looksLikeCompiledMdx(code: string): boolean {
  const s = code.trim();
  if (!s) return false;

  return (
    /\bfunction\s+MDXContent\s*\(/.test(s) ||
    /\buseMDXComponents\b/.test(s) ||
    /\breturn\s+_jsx\s*\(/.test(s) ||
    /\breturn\s+_jsxs\s*\(/.test(s) ||
    /\b_jsx\s*\(/.test(s) ||
    /\b_jsxs\s*\(/.test(s) ||
    /\bjsxDEV\s*\(/.test(s) ||
    /react\/jsx-runtime/.test(s) ||
    /\/\*@jsxRuntime\s+automatic\*\//.test(s)
  );
}

function looksLikeLeakedModuleCode(code: string): boolean {
  const s = code.trim();
  if (!s) return false;

  return (
    /\bObject\.defineProperty\s*\(\s*exports\b/.test(s) ||
    /\bmodule\.exports\b/.test(s) ||
    /\bexports\.[A-Za-z_$]/.test(s) ||
    /\b__esModule\b/.test(s) ||
    /\brequire\s*\(/.test(s)
  );
}

function looksLikeRawMdx(code: string): boolean {
  const s = code.trim();
  if (!s) return false;
  if (looksLikeCompiledMdx(s) || looksLikeLeakedModuleCode(s)) return false;

  return (
    /^\s*import\s.+from\s+["'][^"']+["'];?\s*$/m.test(s) ||
    /^\s*export\s.+$/m.test(s) ||
    /<[A-Z][A-Za-z0-9._-]*\b[^>]*>/.test(s) ||
    /<\/[A-Z][A-Za-z0-9._-]*>/.test(s) ||
    /<[A-Z][A-Za-z0-9._-]*\b[^>]*/.test(s)
  );
}

function looksLikeRawMarkdown(code: string): boolean {
  const s = code.trim();
  if (!s) return false;

  if (looksLikeCompiledMdx(s) || looksLikeLeakedModuleCode(s)) {
    return false;
  }

  return (
    /^#{1,6}\s+/m.test(s) ||
    /^\s*[-*+]\s+/m.test(s) ||
    /^\s*\d+\.\s+/m.test(s) ||
    /(^|\n)\s*>\s+/.test(s) ||
    /\[([^\]]+)\]\(([^)]+)\)/.test(s) ||
    /```[\s\S]*?```/.test(s) ||
    /\*\*[^*]+\*\*/.test(s) ||
    /^---$/m.test(s) ||
    /^\|(.+)\|$/m.test(s) ||
    s.length > 80
  );
}

class MDXErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (message: string) => void;
  },
  { hasError: boolean; error: string | null }
> {
  constructor(
    props: {
      children: React.ReactNode;
      fallback?: React.ReactNode;
      onError?: (message: string) => void;
    },
  ) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  override componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    const message = error instanceof Error ? error.message : String(error);

    if (this.props.onError) {
      this.props.onError(message);
    }

    if (IS_DEV) {
      console.error("[SafeMDXRenderer] Render error:", error, errorInfo);
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <div className="font-mono text-xs uppercase tracking-widest text-red-400">
              MDX Rendering Failed
            </div>
            <p className="mt-3 text-sm text-red-300/80">
              The content could not be rendered properly.
            </p>
            {IS_DEV && this.state.error && (
              <pre className="mt-6 max-h-64 overflow-auto rounded-xl bg-black/60 p-4 text-left text-xs whitespace-pre-wrap text-red-400/70">
                {this.state.error}
              </pre>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
        No content to display
      </div>
    </div>
  );
}

function stripInlineJsxProps(input: string): string {
  return input.replace(/\s+[A-Za-z_:][-A-Za-z0-9_:.]*=(\{[^}]*\}|"[^"]*"|'[^']*')/g, "");
}

// ---------------------------------------------------------------------------
// Protected zones — extract code blocks and inline code before transforms,
// restore after. Prevents JSX stripping inside code fences.
// ---------------------------------------------------------------------------

type ProtectedZone = { placeholder: string; content: string };

function protectZones(input: string): { text: string; zones: ProtectedZone[] } {
  const zones: ProtectedZone[] = [];
  let idx = 0;

  // Protect fenced code blocks (``` ... ```)
  let text = input.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `\x00PROTECTED_${idx++}\x00`;
    zones.push({ placeholder, content: match });
    return placeholder;
  });

  // Protect inline code (` ... `)
  text = text.replace(/`[^`\n]+`/g, (match) => {
    const placeholder = `\x00PROTECTED_${idx++}\x00`;
    zones.push({ placeholder, content: match });
    return placeholder;
  });

  // Protect HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, (match) => {
    const placeholder = `\x00PROTECTED_${idx++}\x00`;
    zones.push({ placeholder, content: match });
    return placeholder;
  });

  return { text, zones };
}

function restoreZones(text: string, zones: ProtectedZone[]): string {
  let result = text;
  for (const zone of zones) {
    result = result.replace(zone.placeholder, zone.content);
  }
  return result;
}

function extractAttr(attrs: string, name: string): string {
  const re = new RegExp(
    `\\b${name}=(?:"([^"]*)"|'([^']*)'|\\{\`([^\`]*)\`\\}|\\{"([^"]*)"\\}|\\{'([^']*)'\\})`,
  );
  const m = attrs.match(re);
  return m?.[1] || m?.[2] || m?.[3] || m?.[4] || m?.[5] || "";
}

function transformRawMdxToMarkdownLike(input: string): string {
  let s = safeString(input).replace(/\r\n/g, "\n").trim();
  if (!s) return "";

  // Protect code blocks, inline code, and HTML comments from transformation
  const { text: unprotected, zones } = protectZones(s);
  s = unprotected;

  // Strip JS module lines
  s = s.replace(/^\s*import\s.+?;?\s*$/gm, "");
  s = s.replace(/^\s*export\s.+?;?\s*$/gm, "");

  // ── Callout blocks (multi-line: open tag, content, close tag) ────────
  // Matches <Callout ...>content</Callout> across lines, preserves inner
  // content as blockquote with bold title.
  s = s.replace(
    /<Callout\b([^>]*)>([\s\S]*?)<\/Callout>/g,
    (_m, attrs: string, inner: string) => {
      const title = extractAttr(attrs, "title") || "Note";
      const body = inner
        .trim()
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
      return `> **${title}**\n${body}`;
    },
  );
  // Single-line self-closing: <Callout title="..." />
  s = s.replace(/<Callout\b([^>]*)\/>/g, (_m, attrs: string) => {
    const title = extractAttr(attrs, "title") || "Note";
    return `> **${title}**`;
  });
  // Orphan open/close tags (already handled above, but safety net)
  s = s.replace(/^\s*<\/?Callout[^>]*>\s*$/gm, "");

  // ── Section breaks and dividers ──────────────────────────────────────
  s = s.replace(/<(SectionBreak|Divider|Rule)\s*\/?>/g, "\n---\n");

  // ── PullQuote ────────────────────────────────────────────────────────
  s = s.replace(
    /<PullQuote\b([^>]*)>([\s\S]*?)<\/PullQuote>/g,
    (_m, attrs: string, inner: string) => {
      const text = extractAttr(attrs, "quote") || inner.trim();
      return text ? `> *${text}*` : "";
    },
  );
  s = s.replace(/<PullQuote\b([^>]*)\/>/g, (_m, attrs: string) => {
    const text = extractAttr(attrs, "quote");
    return text ? `> *${text}*` : "";
  });
  s = s.replace(/^\s*<\/?PullQuote[^>]*>\s*$/gm, "");

  // ── Blockquote wrappers ──────────────────────────────────────────────
  s = s.replace(/<Blockquote>([\s\S]*?)<\/Blockquote>/g, (_m, inner: string) => {
    return inner
      .trim()
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  });
  s = s.replace(/^\s*<\/?Blockquote>\s*$/gm, "");

  // ── Lowercase HTML wrappers ──────────────────────────────────────────
  s = s.replace(/^\s*<(div|section|article|span)\b[^>]*>\s*$/gm, "");
  s = s.replace(/^\s*<\/(div|section|article|span)>\s*$/gm, "");
  s = s.replace(/^\s*<(div|section|article|span)\b[^>]*\/>\s*$/gm, "");

  // ── Bracket tokens ───────────────────────────────────────────────────
  s = s.replace(/^\s*\[Rule\]\s*$/gm, "---");

  // ── Multi-line JSX components (open+close with inner content) ────────
  s = s.replace(
    /<([A-Z][A-Za-z0-9._-]*)\b[\s\S]*?>([\s\S]*?)<\/\1>/g,
    (_m, _tag: string, inner: string) => inner.trim(),
  );
  // ── Multi-line self-closing JSX ──────────────────────────────────────
  s = s.replace(/<[A-Z][A-Za-z0-9._-]*\b[\s\S]*?\/>/g, "");
  // ── Single-line opening/closing JSX tags ─────────────────────────────
  s = s.replace(/^\s*<\/?[A-Z][A-Za-z0-9._-]*[^>]*>\s*$/gm, "");

  // ── JSX expressions / comments ───────────────────────────────────────
  s = s.replace(/^\s*\{\s*\/\*[\s\S]*?\*\/\s*\}\s*$/gm, "");
  s = s.replace(/^\s*\{[^{}\n]*\}\s*$/gm, "");

  // ── Clean up stray empty blockquote markers (lone ">") ───────────────
  s = s.replace(/^\s*>\s*$/gm, "");

  s = s.replace(/\n{3,}/g, "\n\n").trim();

  // Restore protected zones (code blocks, inline code, HTML comments)
  return restoreZones(s, zones);
}

function RawMarkdownFallback({ content }: { content: string }) {
  const html = React.useMemo(() => {
    let processed = safeString(content).replace(/\r\n/g, "\n").trim();

    // Convert remaining JSX component markers to horizontal rules BEFORE escaping.
    processed = processed.replace(/<(Divider|Rule|SectionBreak)\s*\/?>/g, "\n---\n");

    // Strip remaining JSX tags (preserve text content where possible).
    processed = processed.replace(/<([A-Z][A-Za-z0-9._-]*)\b[\s\S]*?>([\s\S]*?)<\/\1>/g, "$2");
    processed = processed.replace(/<[A-Z][A-Za-z0-9._-]*\b[\s\S]*?\/>/g, "");
    processed = processed.replace(/<\/?[A-Z][A-Za-z0-9._-]*[^>]*>/g, "");
    processed = processed.replace(/<[a-z][^>]*\/\s*>/gi, "");
    processed = processed.replace(/<\/?[a-z][a-z0-9]*(?:\s[^>]*)?>/gi, "");

    // Strip stray empty blockquote markers BEFORE escaping
    processed = processed.replace(/^\s*>\s*$/gm, "");

    processed = escapeHtml(processed);

    // ── Inline formatting ──────────────────────────────────────────────
    processed = processed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" style="color:var(--mdx-accent);text-decoration:underline;text-underline-offset:3px">$1</a>',
    );

    processed = processed.replace(
      /\*\*([^*]+)\*\*/g,
      '<strong style="color:var(--mdx-accent);font-weight:600">$1</strong>',
    );
    processed = processed.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

    // ── Headings ──────────────────────────────────────────────────────
    processed = processed.replace(
      /^###### (.+)$/gm,
      '<h6 class="mt-6 mb-2 font-mono text-[10px] uppercase tracking-[0.22em]" style="color:var(--mdx-muted)">$1</h6>',
    );
    processed = processed.replace(
      /^##### (.+)$/gm,
      '<h5 class="mt-8 mb-3 font-mono text-[11px] uppercase tracking-[0.28em]" style="color:var(--mdx-muted)">$1</h5>',
    );
    processed = processed.replace(
      /^#### (.+)$/gm,
      '<h4 class="mt-10 mb-3 font-serif text-xl" style="color:var(--mdx-heading)">$1</h4>',
    );
    processed = processed.replace(
      /^### (.+)$/gm,
      '<h3 class="mt-12 mb-4 font-serif text-2xl" style="color:var(--mdx-heading)">$1</h3>',
    );
    processed = processed.replace(
      /^## (.+)$/gm,
      '<h2 class="mt-16 mb-5 pb-3 font-mono text-[10px] uppercase tracking-[0.35em]" style="color:var(--mdx-accent);border-bottom:1px solid var(--mdx-border)">$1</h2>',
    );
    processed = processed.replace(
      /^# (.+)$/gm,
      '<h1 class="mt-10 mb-6 font-serif text-4xl tracking-tight" style="color:var(--mdx-heading)">$1</h1>',
    );

    // ── Block-level processing ─────────────────────────────────────────
    const blocks = processed.split(/\n{2,}/);

    const joined = blocks
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return "";
        // Skip stray escaped > markers (artifact of Callout conversion)
        if (/^&gt;\s*$/.test(trimmed)) return "";

        if (/^<h[1-6]/.test(trimmed)) return trimmed;

        if (/^---$/.test(trimmed)) {
          return '<hr class="my-8" style="border-color:var(--mdx-border)" />';
        }

        // Blockquotes: collect all > lines in the block
        if (/^&gt;/m.test(trimmed)) {
          const quoteBody = trimmed
            .split("\n")
            .map((line) => line.replace(/^&gt;\s?/, "").trim())
            .filter(Boolean)
            .join("<br />");

          if (!quoteBody) return "";

          return `<blockquote class="my-8 border-l-2 pl-5 italic" style="color:var(--mdx-muted);border-color:var(--mdx-accent)">${quoteBody}</blockquote>`;
        }

        if (/^[-*+]\s+/m.test(trimmed)) {
          const items = trimmed
            .split("\n")
            .map((line) => line.replace(/^[-*+]\s+/, "").trim())
            .filter(Boolean)
            .map(
              (item) =>
                `<li class="flex items-start gap-3" style="color:var(--mdx-text)"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style="background:var(--mdx-accent)"></span><span>${item}</span></li>`,
            )
            .join("");

          return `<ul class="mb-6 space-y-3">${items}</ul>`;
        }

        if (/^\d+\.\s+/m.test(trimmed)) {
          const items = trimmed
            .split("\n")
            .map((line) => line.replace(/^\d+\.\s+/, "").trim())
            .filter(Boolean)
            .map(
              (item) => `<li class="ml-5 list-decimal" style="color:var(--mdx-text)">${item}</li>`,
            )
            .join("");

          return `<ol class="mb-6 space-y-3">${items}</ol>`;
        }

        return `<p class="mb-6 leading-8" style="color:var(--mdx-text)">${trimmed.replace(/\n/g, "<br />")}</p>`;
      })
      .join("");

    // Final cleanup: convert any surviving component markers to <hr> or strip
    return joined
      .replace(/<strong[^>]*>\[(Divider|Rule|SectionBreak)\]<\/strong>/g,
        '<hr class="my-8" style="border-color:var(--mdx-border)" />')
      .replace(/&lt;(Divider|Rule|SectionBreak)\s*\/?&gt;/g,
        '<hr class="my-8" style="border-color:var(--mdx-border)" />')
      .replace(/<strong[^>]*>\[[A-Z][A-Za-z0-9._-]*\]<\/strong>/g, "")
      .replace(/\[[A-Z][A-Za-z0-9._-]*\]/g, "")
      .replace(/&lt;\/?[A-Z][A-Za-z0-9._-]*[^&]*&gt;/g, "")
      // Strip any stray escaped > that survived (artifact cleanup)
      .replace(/<p[^>]*>\s*&gt;\s*<\/p>/g, "");
  }, [content]);

  return (
    <div
      className="aol-mdx-content max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function SuspiciousCodeState({ code }: { code: string }) {
  return (
    <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
      <div className="font-mono text-xs uppercase tracking-widest text-amber-400">
        Content Payload Invalid
      </div>
      <p className="mt-3 text-sm text-white/70">
        The payload appears to be leaked module code rather than renderable MDX.
      </p>
      {IS_DEV ? (
        <pre className="mt-6 max-h-64 overflow-auto rounded-xl bg-black/60 p-4 text-left text-xs whitespace-pre-wrap text-amber-200/70">
          {code.slice(0, 4000)}
        </pre>
      ) : null}
    </div>
  );
}

function CompiledMDXRenderer({
  code,
  components,
}: {
  code: string;
  components: Record<string, any>;
}) {
  const MDXContent = useMDXComponent(code);
  return <MDXContent components={components} />;
}

export default function SafeMDXRenderer({
  code,
  components = {},
  directive,
  disableBaseComponents = false,
  debug = false,
}: SafeMDXRendererProps) {
  const safeCode = React.useMemo(() => safeString(code).trim(), [code]);
  const [renderError, setRenderError] = React.useState<string | null>(null);

  const finalComponents = React.useMemo(() => {
    const base = disableBaseComponents
      ? { ...components }
      : getSafeComponents(components);

    if (directive && base.DocumentFooter) {
      const Original = base.DocumentFooter;
      const Wrapped = (props: any) => (
        <Original {...props} directive={directive} />
      );
      Wrapped.displayName = "DocumentFooterWithDirective";
      base.DocumentFooter = Wrapped;
    }

    return base;
  }, [components, disableBaseComponents, directive]);

  if (!safeCode) {
    if (IS_DEV) console.warn("[MDX] Empty content passed to renderer");
    return <EmptyState />;
  }

  const isSuspicious = looksLikeLeakedModuleCode(safeCode);
  const isCompiled = !isSuspicious && looksLikeCompiledMdx(safeCode);
  const isRawMdx = !isSuspicious && !isCompiled && looksLikeRawMdx(safeCode);
  const isRaw = !isSuspicious && !isCompiled && !isRawMdx && looksLikeRawMarkdown(safeCode);

  // Observability — log render path decision for every invocation.
  // Production: warn-level only for non-compiled paths (indicates fallback).
  // Dev: full diagnostic.
  const renderPath = isSuspicious
    ? "suspicious"
    : isCompiled
      ? "compiled"
      : isRawMdx
        ? "raw-mdx"
        : isRaw
          ? "markdown"
          : "unclassified";

  if (IS_DEV || renderPath !== "compiled") {
    console[renderPath === "compiled" ? "log" : "warn"](
      `[MDX:${renderPath}]`,
      { length: safeCode.length, preview: safeCode.slice(0, 120) },
    );
  }

  if (isSuspicious) {
    return <SuspiciousCodeState code={safeCode} />;
  }

  if (isRawMdx || isRaw) {
    const cleaned = transformRawMdxToMarkdownLike(safeCode);
    return <RawMarkdownFallback content={cleaned} />;
  }

  return (
    <MDXErrorBoundary
      onError={(message) => setRenderError(message)}
      fallback={
        renderError ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <div className="font-mono text-xs uppercase tracking-widest text-red-400">
              MDX Rendering Failed
            </div>
            <p className="mt-3 text-sm text-white/70">
              The content could not be rendered properly.
            </p>
            {IS_DEV && (
              <pre className="mt-6 max-h-64 overflow-auto rounded-xl bg-black/60 p-4 text-left text-xs whitespace-pre-wrap text-red-400/70">
                {safeCode.slice(0, 4000)}
              </pre>
            )}
          </div>
        ) : undefined
      }
    >
      <div className="aol-mdx-content max-w-none">
        <CompiledMDXRenderer code={safeCode} components={finalComponents} />
      </div>
    </MDXErrorBoundary>
  );
}