/* components/mdx/SafeMDXRenderer.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useMDXComponent } from "next-contentlayer2/hooks";
import MDX_COMPONENTS, { getSafeComponents } from "@/components/mdx/MDXComponents";
import type { TierDirective } from "@/lib/resources/tier-metadata";

interface SafeMDXRendererProps {
  code?: string | null;
  components?: Record<string, any>;
  directive?: TierDirective;
  debug?: boolean;
  disableBaseComponents?: boolean;
}

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message?: string;
};

class MDXErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(err: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message:
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "MDX render error",
    };
  }

  override componentDidCatch(err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.error("MDXErrorBoundary caught:", err);
    }
  }

  override render() {
    if (!this.state.hasError) return this.props.children;

    return (
      this.props.fallback ?? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-red-300/80">
            MDX render failure
          </div>
          <p className="mt-3 text-sm text-white/70">
            The MDX compiled, but rendering failed.
          </p>
          {process.env.NODE_ENV !== "production" && this.state.message ? (
            <pre className="mt-4 overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
              {this.state.message}
            </pre>
          ) : null}
        </div>
      )
    );
  }
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">
        MDX unavailable
      </div>
      <p className="mt-3 text-sm text-white/60">
        No compiled MDX body was provided.
      </p>
    </div>
  );
}

export default function SafeMDXRenderer({
  code,
  components,
  directive,
  debug = false,
  disableBaseComponents = false,
}: SafeMDXRendererProps) {
  const safeCode = typeof code === "string" ? code.trim() : "";
  const hasCode = safeCode.length > 0;

  const mdxSource = hasCode
    ? safeCode
    : "export default function MDXEmpty(){ return null; }";

  const MDXContent = useMDXComponent(mdxSource);

  const merged = React.useMemo(() => {
    const base = disableBaseComponents
      ? { ...(components || {}) }
      : getSafeComponents((components || {}) as any);

    if (base.DocumentFooter) {
      const OriginalFooter = base.DocumentFooter;
      base.DocumentFooter = (props: any) => (
        <OriginalFooter {...props} directive={directive} />
      );
    }

    return base;
  }, [components, directive, disableBaseComponents]);

  return (
    <MDXErrorBoundary>
      <div className="aol-mdx-content text-white">
        {hasCode ? <MDXContent components={merged} /> : <EmptyState />}
      </div>

      {(debug || process.env.NODE_ENV !== "production") && (
        <details className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.25em] text-amber-300/85">
            MDX debug
          </summary>
          <div className="mt-4 space-y-3 text-xs text-white/70">
            <div>hasCode: {String(hasCode)}</div>
            <div>code length: {safeCode.length}</div>
            <div>disableBaseComponents: {String(disableBaseComponents)}</div>
            <div>component keys: {Object.keys(merged).join(", ") || "(none)"}</div>
            <pre className="max-h-72 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] text-white/60">
              {safeCode.slice(0, 1200)}
            </pre>
          </div>
        </details>
      )}
    </MDXErrorBoundary>
  );
}