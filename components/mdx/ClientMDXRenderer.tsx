// components/mdx/ClientMDXRenderer.tsx
"use client";

import React from "react";
import { useMDXComponent } from "next-contentlayer2/hooks";

interface ClientMDXRendererProps {
  code: string;
  components: any;
}

export default function ClientMDXRenderer({ code, components }: ClientMDXRendererProps) {
  const MDXContent = useMDXComponent(code);

  if (!MDXContent) {
    return <div>Loading MDX content...</div>;
  }

  return <MDXContent components={components} />;
}