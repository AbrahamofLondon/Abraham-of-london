/* components/mdx/SafeMDXRenderer.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useMDXComponent } from "next-contentlayer2/hooks";
import MDX_COMPONENTS from "@/components/mdx/MDXComponents";

interface SafeMDXRendererProps {
  code: string;
  components?: Record<string, any>;
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

  static getDerivedStateFromError(err: any): ErrorBoundaryState {
    return {
      hasError: true,
      message: err?.message ? String(err.message) : "MDX render error",
    };
  }

  override componentDidCatch(err: any) {
    if (process.env.NODE_ENV !== "production") {
      console.error("MDXErrorBoundary caught:", err);
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-10 rounded-3xl border border-white/10 bg-white/[0.02]">
            <div className="aol-micro text-white/40">MDX RENDER FAILURE</div>
            <div className="mt-3 text-white/70 text-sm leading-relaxed">
              The document rendered with an invalid component or malformed MDX.
            </div>
            {process.env.NODE_ENV !== "production" && this.state.message ? (
              <pre className="mt-4 text-xs text-white/55 overflow-auto border border-white/10 rounded-2xl p-4 bg-black/30">
                {this.state.message}
              </pre>
            ) : null}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default function SafeMDXRenderer({ code, components }: SafeMDXRendererProps) {
  // Ensure `process` exists in the browser BEFORE evaluating Contentlayer output.
  // Contentlayer-generated code may reference `process.env.NODE_ENV`.
  const g = globalThis as any;
  if (typeof window !== "undefined") {
    g.process = g.process || { env: {} };
    g.process.env = g.process.env || {};
    g.process.env.NODE_ENV = g.process.env.NODE_ENV || "production";
  }

  const hasCode = typeof code === "string" && code.trim().length > 0;
  const mdxCode = hasCode ? code : "export default function Empty(){ return null }";

  // ✅ Hook must be unconditional (no conditional calls)
  const Component = useMDXComponent(mdxCode);

  const merged = React.useMemo(
    () => ({
      ...MDX_COMPONENTS,
      ...(components || {}),
    }),
    [components]
  );

  if (!hasCode) {
    return (
      <div className="p-12 text-center border border-white/10 bg-white/[0.02] rounded-3xl">
        <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
          Loading document…
        </p>
      </div>
    );
  }

  return (
    <MDXErrorBoundary>
      <div className="aol-mdx-content">
        <Component components={merged} />
      </div>
    </MDXErrorBoundary>
  );
}