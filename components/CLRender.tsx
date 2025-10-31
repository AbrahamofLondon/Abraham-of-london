// components/CLRender.tsx

import React from "react";
// 🔑 CRITICAL: Change to named import from the renamed file
import { MDXComponents } from "@/components/mdx-components"; 

export default function CLRender({ Content, code }: { Content: any; code?: any }) {
  // Content is a compiled MDX component from contentlayer
  return <Content components={MDXComponents} code={code} />;
}