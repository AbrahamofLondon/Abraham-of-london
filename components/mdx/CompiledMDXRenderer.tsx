/* components/mdx/CompiledMDXRenderer.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useMDXComponent } from "next-contentlayer2/hooks";

interface CompiledMDXRendererProps {
  code: string;
  components: Record<string, any>;
}

/**
 * CompiledMDXRenderer — uses useMDXComponent to evaluate compiled MDX code.
 *
 * This component is lazily loaded by SafeMDXRenderer to avoid importing
 * useMDXComponent (and transitively mdx-bundler/client) during SSG,
 * which would trigger Next.js 16's <Html> document import guard.
 */
export function CompiledMDXRenderer({
  code,
  components,
}: CompiledMDXRendererProps) {
  const MDXContent = useMDXComponent(code);
  return <MDXContent components={components} />;
}
