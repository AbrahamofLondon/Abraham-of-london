/* components/mdx/ClientOnlyMDXRenderer.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { getSafeComponents } from "@/components/mdx/MDXComponents";
import type { TierDirective } from "@/lib/resources/tier-metadata";

const IS_DEV = process.env.NODE_ENV !== "production";

interface ClientOnlyMDXRendererProps {
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
    /<\/[A-Z][A-Za-z0-9._-]*>/.test(s)
  );
}

function looksLikeRawMarkdown(code: string): boolean {
  const s = code.trim();
  if (!s) return false;
  if (looksLikeCompiledMdx(s) || looksLikeLeakedModuleCode(s)) return false;

  return (
    /^#{1,6}\s+/m.test(s) ||
    /^\s*[-*+]\s+/m.test(s) ||
    /^\s*\d+\.\s+/m.test(s) ||
    /(^|\n)\s*>\s+/.test(s) ||
    /\[([^\]]+)\]\(([^)]+)\)/.test(s) ||
    /```[\s\S]*?```/.test(s) ||
    /\*\*[^*]+\*\*/.test(s) ||
    /^\|(.+)\|$/m.test(s) ||
    s.length > 80
  );
}

function transformRawMdxToMarkdownLike(input: string): string {
  let s = safeString(input).replace(/\r\n/g, "\n").trim();
  if (!s) return "";

  s = s.replace(/^\s*import\s.+?;?\s*$/gm, "");
  s = s.replace(/^\s*export\s.+?;?\s*$/gm, "");

  s = s.replace(/^(\s*)<Callout\b([^>]*)>\s*$/gm, (_m: string, _indent: string, attrs: string) => {
    const titleMatch = attrs.match(
      /\btitle=(?:"([^"]*)"|'([^']*)'|{`([^`]*)`}|{"([^"]*)"}|{'([^']*)'})/,
    );
    const title =
      titleMatch?.[1] ||
      titleMatch?.[2] ||
      titleMatch?.[3] ||
      titleMatch?.[4] ||
      titleMatch?.[5] ||
      "Callout";
    return `> **${title}**\n>`;
  });

  s = s.replace(/^(\s*)<\/Callout>\s*$/gm, "");
  s = s.replace(/^(\s*)<SectionBreak\s*\/>\s*$/gm, "\n---\n");

  s = s.replace(
    /^(\s*)<PullQuote\b([^>]*)>\s*$/gm,
    (_m: string, _indent: string, attrs: string) => {
      const textMatch = attrs.match(
        /\bquote=(?:"([^"]*)"|'([^']*)'|{`([^`]*)`}|{"([^"]*)"}|{'([^']*)'})/,
      );
      const text =
        textMatch?.[1] ||
        textMatch?.[2] ||
        textMatch?.[3] ||
        textMatch?.[4] ||
        textMatch?.[5] ||
        "";
      return `> ${text}`;
    },
  );
  s = s.replace(/^(\s*)<\/PullQuote>\s*$/gm, "");

  s = s.replace(/<[A-Z][A-Za-z0-9._-]*\b[^>]*\/>/g, "");
  s = s.replace(
    /<[A-Z][A-Za-z0-9._-]*\b[^>]*>[\s\S]*?<\/[A-Z][A-Za-z0-9._-]*>/g,
    "",
  );

  s = s.replace(/\s+[A-Za-z_:][-A-Za-z0-9_:.]*=(?:\{[^}]*\}|"[^"]*"|'[^']*')/g, "");

  return s.trim();
}

function renderMarkdownToHtml(content: string): string {
  let processed = safeString(content).replace(/\r\n/g, "\n").trim();
  if (!processed) return "";

  processed = escapeHtml(processed);

  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="smdx-link">$1</a>',
  );
  processed = processed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  processed = processed.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  processed = processed.replace(/^###### (.+)$/gm, '<h6 class="smdx-h6">$1</h6>');
  processed = processed.replace(/^##### (.+)$/gm, '<h5 class="smdx-h5">$1</h5>');
  processed = processed.replace(/^#### (.+)$/gm, '<h4 class="smdx-h4">$1</h4>');
  processed = processed.replace(/^### (.+)$/gm, '<h3 class="smdx-h3">$1</h3>');
  processed = processed.replace(/^## (.+)$/gm, '<h2 class="smdx-h2">$1</h2>');
  processed = processed.replace(/^# (.+)$/gm, '<h1 class="smdx-h1">$1</h1>');

  processed = processed.replace(/^---$/gm, '<hr class="smdx-hr" />');

  processed = processed.replace(
    /^&gt;(.+)$/gm,
    '<blockquote class="smdx-blockquote">$1</blockquote>',
  );

  const ulRegex = /(?:^[-*+]\s+.+(?:\n|$))+/gm;
  processed = processed.replace(ulRegex, (match) => {
    const items = match
      .split("\n")
      .map((line) => line.replace(/^[-*+]\s+/, "").trim())
      .filter(Boolean)
      .map((item) => `<li class="smdx-li">${item}</li>`)
      .join("");
    return `<ul class="smdx-ul">${items}</ul>`;
  });

  const olRegex = /(?:^\d+\.\s+.+(?:\n|$))+/gm;
  processed = processed.replace(olRegex, (match) => {
    const items = match
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s+/, "").trim())
      .filter(Boolean)
      .map((item) => `<li class="smdx-oli">${item}</li>`)
      .join("");
    return `<ol class="smdx-ol">${items}</ol>`;
  });

  const blocks = processed.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^<(h[1-6]|ul|ol|blockquote|hr)/.test(trimmed)) return trimmed;
      return `<p class="smdx-p">${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Empty state component
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-white/5 bg-white/[0.02]">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/20">
        No content
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markdown fallback (no useMDXComponent needed)
// ---------------------------------------------------------------------------

function MarkdownFallback({ content }: { content: string }) {
  const html = React.useMemo(() => renderMarkdownToHtml(content), [content]);
  return (
    <div
      className="smdx-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ---------------------------------------------------------------------------
// Dynamic compiled MDX renderer (ssr:false avoids useMDXComponent during SSG)
// ---------------------------------------------------------------------------

import dynamic from "next/dynamic";

const DynamicCompiledMDXRenderer = dynamic(
  () =>
    import("./CompiledMDXRenderer").then((m) => ({
      default: m.CompiledMDXRenderer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[120px] items-center justify-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
          Loading…
        </span>
      </div>
    ),
  },
);

function CompiledMDXRendererWrapper({
  code,
  components,
}: {
  code: string;
  components: Record<string, any>;
}) {
  return <DynamicCompiledMDXRenderer code={code} components={components} />;
}

// ---------------------------------------------------------------------------
// Main ClientOnlyMDXRenderer — NO module-level import of useMDXComponent
// ---------------------------------------------------------------------------

export default function ClientOnlyMDXRenderer({
  code,
  components = {},
  directive,
  disableBaseComponents = false,
  debug = false,
}: ClientOnlyMDXRendererProps) {
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
    return (
      <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-amber-400">
          Content Warning
        </div>
        <p className="mt-3 text-sm text-white/50">
          This content could not be rendered.
        </p>
      </div>
    );
  }

  if (isRawMdx || isRaw) {
    const cleaned = transformRawMdxToMarkdownLike(safeCode);
    return <MarkdownFallback content={cleaned} />;
  }

  // Compiled MDX — use lazy-loaded renderer (avoids useMDXComponent during SSG)
  return (
    <div className="aol-mdx-content max-w-none">
      <CompiledMDXRendererWrapper
        code={safeCode}
        components={finalComponents}
      />
    </div>
  );
}
