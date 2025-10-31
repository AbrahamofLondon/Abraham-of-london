// components/PrintMDXContent.tsx
import * as React from "react";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { mdxComponents } from "@/lib/mdx-components";
import BrandFrame from "@/components/print/BrandFrame";

type Props = {
  mdxSource: MDXRemoteSerializeResult;
  title?: string;
};

export default function PrintMDXContent({ mdxSource, title }: Props) {
  return (
    <BrandFrame title={title}>
      <div className="prose lg:prose-lg dark:prose-invert mx-auto">
        <MDXRemote {...mdxSource} components={mdxComponents} />
      </div>
    </BrandFrame>
  );
}
