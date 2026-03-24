/* components/mdx/SafeMDXRenderer.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { getSafeComponents } from "@/components/mdx/MDXComponents";
import type { TierDirective } from "@/lib/resources/tier-metadata";

// Safe check for development mode that won't crash the browser
const IS_DEV = typeof process !== 'undefined' ? process.env.NODE_ENV !== "production" : false;

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

const STABLE_EMPTY_MDX_CODE = "function MDXContent(){return null} return { default: MDXContent };";

class MDXErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: undefined };
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
    if (IS_DEV) {
      console.error("[SafeMDXRenderer] MDXErrorBoundary caught:", err);
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
            The MDX compiled, but rendering failed at runtime.
          </p>
          {IS_DEV && this.state.message ? (
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

function InvalidComponentState({
  debug,
  code,
}: {
  debug?: boolean;
  code: string;
}) {
  return (
    <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-red-300/80">
        MDX hydration failure
      </div>
      <p className="mt-3 text-sm text-white/70">
        The compiled MDX did not return a valid component.
      </p>
      {(debug || IS_DEV) && (
        <pre className="mt-4 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
          {code.slice(0, 1200)}
        </pre>
      )}
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
  // Defensive check: If some compiled MDX tries to access 'process', 
  // we provide a tiny polyfill on the window if it's missing during the render phase.
  if (typeof window !== "undefined" && typeof (window as any).process === "undefined") {
    (window as any).process = { env: { NODE_ENV: IS_DEV ? "development" : "production" } };
  }

  const safeCode = React.useMemo(() => {
    return typeof code === "string" ? code.trim() : "";
  }, [code]);

  const hasCode = safeCode.length > 0;

  const stableDirective = React.useMemo(() => directive ?? undefined, [directive]);

  const merged = React.useMemo(() => {
    const incoming = components ?? {};
    const base = disableBaseComponents
      ? { ...incoming }
      : getSafeComponents(incoming as Record<string, any>);

    const nextMap: Record<string, any> = { ...base };

    if (nextMap.DocumentFooter) {
      const OriginalFooter = nextMap.DocumentFooter;
      nextMap.DocumentFooter = function DocumentFooterWithDirective(props: any) {
        return <OriginalFooter {...props} directive={stableDirective} />;
      };
    }

    return nextMap;
  }, [components, disableBaseComponents, stableDirective]);

  const mdxCodeForHook = hasCode ? safeCode : STABLE_EMPTY_MDX_CODE;
  
  // The error is thrown here because useMDXComponent executes the code string
  const MDXContent = useMDXComponent(mdxCodeForHook);

  if (!hasCode) {
    return <EmptyState />;
  }

  if (typeof MDXContent !== "function") {
    return <InvalidComponentState debug={debug} code={safeCode} />;
  }

  return (
    <MDXErrorBoundary>
      <div className="aol-mdx-content text-white">
        <MDXContent components={merged} />
      </div>

      {(debug || IS_DEV) && (
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