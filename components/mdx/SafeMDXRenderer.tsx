"use client";

import * as React from "react";
// ✅ Authoritative Hook for Next.js 16/Contentlayer2
import { useMDXComponent } from "next-contentlayer2/hooks"; 
import MDX_COMPONENTS from "@/components/mdx/MDXComponents";

interface SafeMDXRendererProps {
  code: string;
  components?: Record<string, any>;
}

/**
 * SafeMDXRenderer
 * The authoritative engine for the 75 intelligence briefs.
 */
export default function SafeMDXRenderer({ code, components }: SafeMDXRendererProps) {
  // 1. Guard against un-initialized or missing code strings
  // This prevents the "mdxExport is undefined" crash by ensuring the hook 
  // never attempts to parse a null/empty string.
  const hasCode = React.useMemo(() => typeof code === "string" && code.length > 0, [code]);

  // 2. Resolve the Component 
  // We pass an empty string if code is missing to keep the hook call stable 
  // but we won't render the output unless hasCode is true.
  const Component = useMDXComponent(hasCode ? code : "");

  // 3. Memoize components to prevent re-render flickers in the 75 briefs
  const merged = React.useMemo(() => ({
    ...MDX_COMPONENTS,
    ...(components || {})
  }), [components]);

  // 4. Loading/Error State
  if (!hasCode || !Component) {
    return (
      <div className="p-12 text-center border border-white/5 bg-white/[0.02] rounded-3xl">
        <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">
          Reifying Asset Vault...
        </p>
      </div>
    );
  }

  // 5. Final Sovereign Render
  return (
    <div className="aol-mdx-content animate-in fade-in duration-700">
      <Component components={merged} />
    </div>
  );
}