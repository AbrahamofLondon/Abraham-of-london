// lib/MDXBody.tsx
import * as React from "react";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { mdxComponents } from "@/lib/mdx-components";

export type MDXBodyProps = {
  mdxSource: MDXRemoteSerializeResult;
  className?: string;
};

export function MDXBody({ mdxSource, className }: MDXBodyProps) {
  if (!mdxSource) return null;
  return (
    <div className={className ?? "prose lg:prose-lg dark:prose-invert"}>
      <MDXRemote {...mdxSource} components={mdxComponents} />
    </div>
  );
}
