// components/MDXContentRenderer.tsx
import { useMDXComponent } from "next-contentlayer2/hooks";
import { components } from "@/components/MdxComponents";
import * as React from "react";

interface MDXContentRendererProps {
  code: string;
}

export default function MDXContentRenderer({ code }: MDXContentRendererProps) {
  // Fix: Ensure code is never null/undefined when passed to the hook
  const validCode = code ?? ""; 
  const MDX = useMDXComponent(validCode);

  return <MDX components={components as any} />;
}
