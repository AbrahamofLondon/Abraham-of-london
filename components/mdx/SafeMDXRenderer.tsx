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

function transformRawMdxToMarkdownLike(input: string): string {
  let s = safeString(input).replace(/\r\n/g, "\n").trim();
  if (!s) return "";

  // Strip JS module lines
  s = s.replace(/^\s*import\s.+?;?\s*$/gm, "");
  s = s.replace(/^\s*export\s.+?;?\s*$/gm, "");

  // Callout blocks
  s = s.replace(/^\s*<Callout\b([^>]*)>\s*$/gm, (_m, attrs: string) => {
    const titleMatch = attrs.match(/\btitle=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/);
    const title =
      titleMatch?.[1] ||
      titleMatch?.[2] ||
      titleMatch?.[3] ||
      titleMatch?.[4] ||
      titleMatch?.[5] ||
      "Callout";
    return `> **${title}**\n>`;
  });
  s = s.replace(/^\s*<\/Callout>\s*$/gm, "");

  // Section breaks and dividers
  s = s.replace(/^\s*<SectionBreak\s*\/>\s*$/gm, "\n---\n");
  s = s.replace(/^\s*<Divider\s*\/>\s*$/gm, "\n---\n");
  s = s.replace(/^\s*<Rule\s*\/>\s*$/gm, "\n---\n");

  // PullQuote
  s = s.replace(/^\s*<PullQuote\b([^>]*)>\s*$/gm, (_m, attrs: string) => {
    const textMatch = attrs.match(/\bquote=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/);
    const text =
      textMatch?.[1] ||
      textMatch?.[2] ||
      textMatch?.[3] ||
      textMatch?.[4] ||
      textMatch?.[5] ||
      "";
    return text ? `> *${text}*` : "";
  });
  s = s.replace(/^\s*<\/PullQuote>\s*$/gm, "");

  // Blockquote wrappers
  s = s.replace(/^\s*<Blockquote>\s*$/gm, "> ");
  s = s.replace(/^\s*<\/Blockquote>\s*$/gm, "");

  // Common lowercase HTML wrappers used in MDX prose
  s = s.replace(/^\s*<(div|section|article|span)\b[^>]*>\s*$/gm, "");
  s = s.replace(/^\s*<\/(div|section|article|span)>\s*$/gm, "");

  // Self-closing anchors / wrappers
  s = s.replace(/^\s*<div\b[^>]*id=["']([^"']+)["'][^>]\/>\s*$/gm, "\n---\n");
  s = s.replace(/^\s*<(div|section|article|span)\b[^>]*\/>\s*$/gm, "");

  // Bracket tokens used as visual component markers
  s = s.replace(/^\s*\[Link\]\s*$/gm, "**Link**");
  s = s.replace(/^\s*\[Rule\]\s*$/gm, "---");

  // Generic capitalized component wrappers
  s = s.replace(/^\s*<([A-Z][A-Za-z0-9._-]*)\b([^>]*)\/>\s*$/gm, (_m, tag: string) => {
    return `**[${tag}]**`;
  });

  s = s.replace(/^\s*<([A-Z][A-Za-z0-9._-]*)\b([^>]*)>\s*$/gm, (_m, tag: string) => {
    return `**[${tag}]**`;
  });

  s = s.replace(/^\s*<\/([A-Z][A-Za-z0-9._-]*)>\s*$/gm, "");

  // Remove isolated JSX expressions / comments
  s = s.replace(/^\s*\{\s*\/\*[\s\S]*?\*\/\s*\}\s*$/gm, "");
  s = s.replace(/^\s*\{[^{}\n]*\}\s*$/gm, "");

  s = s.replace(/\n{3,}/g, "\n\n").trim();

  return s;
}

function RawMarkdownFallback({ content }: { content: string }) {
  const html = React.useMemo(() => {
    let processed = safeString(content).replace(/\r\n/g, "\n").trim();

    // Convert remaining JSX component markers to horizontal rules BEFORE escaping.
    // Handles <Divider />, <Rule />, <SectionBreak /> that may survive from raw MDX.
    processed = processed.replace(/^\s*<(Divider|Rule|SectionBreak)\s*\/?\s*>\s*$/gm, "\n---\n");
    // Also handle self-closing without space: <Divider/>
    processed = processed.replace(/<(Divider|Rule|SectionBreak)\s*\/?\s*>/g, "\n---\n");

    // Strip remaining inline HTML tags (preserving text content) before escaping.
    // Prevents <span class="...">text</span> from appearing as literal escaped tags.
    // Self-closing tags (e.g. <br />, <img ... />) are removed entirely.
    processed = processed.replace(/<[a-z][^>]*\/\s*>/gi, "");
    processed = processed.replace(/<\/?[a-z][a-z0-9]*(?:\s[^>]*)?>/gi, "");

    processed = escapeHtml(processed);

    processed = processed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-amber-400 hover:text-amber-300 underline decoration-amber-400/30">$1</a>',
    );

    processed = processed.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    processed = processed.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

    processed = processed.replace(
      /^###### (.+)$/gm,
      '<h6 class="mt-6 mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">$1</h6>',
    );
    processed = processed.replace(
      /^##### (.+)$/gm,
      '<h5 class="mt-8 mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-amber-200/80">$1</h5>',
    );
    processed = processed.replace(
      /^#### (.+)$/gm,
      '<h4 class="mt-10 mb-3 font-serif text-xl text-zinc-300">$1</h4>',
    );
    processed = processed.replace(
      /^### (.+)$/gm,
      '<h3 class="mt-12 mb-4 font-serif text-2xl text-zinc-200">$1</h3>',
    );
    processed = processed.replace(
      /^## (.+)$/gm,
      '<h2 class="mt-16 mb-5 border-b border-white/10 pb-3 font-mono text-[10px] uppercase tracking-[0.35em] text-amber-400">$1</h2>',
    );
    processed = processed.replace(
      /^# (.+)$/gm,
      '<h1 class="mt-10 mb-6 font-serif text-4xl tracking-tight text-white">$1</h1>',
    );

    const blocks = processed.split(/\n{2,}/);

    const joined = blocks
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return "";

        if (/^<h[1-6]/.test(trimmed)) return trimmed;

        if (/^---$/.test(trimmed)) {
          return `<hr class="my-8 border-white/10" />`;
        }

        if (/^&gt;/.test(trimmed)) {
          const quoteBody = trimmed
            .split("\n")
            .map((line) => line.replace(/^&gt;\s?/, "").trim())
            .join("<br />");

          return `<blockquote class="my-8 border-l-2 border-amber-400/40 pl-5 italic text-white/75">${quoteBody}</blockquote>`;
        }

        if (/^[-*+]\s+/m.test(trimmed)) {
          const items = trimmed
            .split("\n")
            .map((line) => line.replace(/^[-*+]\s+/, "").trim())
            .filter(Boolean)
            .map(
              (item) =>
                `<li class="flex items-start gap-3 text-white/80"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"></span><span>${item}</span></li>`,
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
              (item) => `<li class="ml-5 list-decimal text-white/80">${item}</li>`,
            )
            .join("");

          return `<ol class="mb-6 space-y-3">${items}</ol>`;
        }

        return `<p class="mb-6 leading-8 text-white/80">${trimmed.replace(/\n/g, "<br />")}</p>`;
      })
      .join("");

    // Final cleanup: convert remaining component marker artifacts
    // like <strong>[Divider]</strong> into proper <hr> elements.
    return joined
      .replace(/<strong>\[(Divider|Rule|SectionBreak)\]<\/strong>/g,
        '<hr class="my-8 border-white/10" />')
      .replace(/&lt;(Divider|Rule|SectionBreak)\s*\/?&gt;/g,
        '<hr class="my-8 border-white/10" />');
  }, [content]);

  // Belt-and-suspenders: strip any [ComponentName] markers that survived.
  const cleanHtml = html
    .replace(/<strong>\[(?:Divider|Rule|SectionBreak)\]<\/strong>/g, '<hr class="my-8 border-t border-white/10" />')
    .replace(/\[(?:Divider|Rule|SectionBreak)\]/g, '<hr class="my-8 border-t border-white/10" />');

  return (
    <div
      className="aol-mdx-content max-w-none"
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
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
    return <EmptyState />;
  }

  const isSuspicious = looksLikeLeakedModuleCode(safeCode);
  const isCompiled = !isSuspicious && looksLikeCompiledMdx(safeCode);
  const isRawMdx = !isSuspicious && !isCompiled && looksLikeRawMdx(safeCode);
  const isRaw = !isSuspicious && !isCompiled && !isRawMdx && looksLikeRawMarkdown(safeCode);

  if (debug && IS_DEV) {
    console.log("[SafeMDXRenderer]", {
      codeLength: safeCode.length,
      isCompiled,
      isRawMdx,
      isRaw,
      isSuspicious,
      preview: safeCode.slice(0, 250),
    });
  }

  if (isSuspicious) {
    return <SuspiciousCodeState code={safeCode} />;
  }

  if (isRawMdx) {
    const normalized = transformRawMdxToMarkdownLike(safeCode);
    return <RawMarkdownFallback content={normalized} />;
  }

  if (isRaw) {
    // Run the MDX-to-markdown transform even for raw content,
    // to handle component tokens like <Divider /> and <Rule />
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