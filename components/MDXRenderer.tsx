// components/MDXRenderer.tsx
import * as React from "react";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { mdxComponents } from "@/lib/mdx-components";

type Props = {
  mdxSource: MDXRemoteSerializeResult;
  wrapperClassName?: string;
};

export default function MDXRenderer({ mdxSource, wrapperClassName }: Props) {
  if (!mdxSource) return null;
  return (
    <article className={wrapperClassName ?? "prose lg:prose-lg dark:prose-invert"}>
      <MDXRemote {...mdxSource} components={mdxComponents} />
    </article>
  );
}
