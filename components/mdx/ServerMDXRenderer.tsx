/* components/mdx/ServerMDXRenderer.tsx */
"use client";

import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

export default function ServerMDXRenderer({ code }: { code: string }) {
  return <SafeMDXRenderer code={code} />;
}