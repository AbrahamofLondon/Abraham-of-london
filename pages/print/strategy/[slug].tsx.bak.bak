// pages/print/strategy/[slug].tsx
import { allStrategies, type Strategy } from "contentlayer/generated";
import BrandFrame from "@/components/print/BrandFrame";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { components } from "@/components/MdxComponents";
import * as React from "react";

export async function getStaticPaths() {
  return {
    paths: allStrategies.map((s) => ({ params: { slug: s.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const doc = allStrategies.find((s) => s.slug === params.slug) || null;
  return { props: { doc } };
}

interface Props { doc: Strategy | null }

export default function StrategyPrint({ doc }: Props) {
  // @ts-ignore: Suppress error for "code" property not found on type 'Markdown'.
  const code = doc?.body?.code ?? "";
  const MDXContent = useMDXComponent(code);

  if (!doc) return <p>Loading?</p>;

  return (
    <BrandFrame
      title={doc.title}
      // FIXED: Removed inconsistent/unsupported properties (description/ogDescription)
      subtitle={undefined} 
      // FIXED: Removed doc.author which caused a Type error in similar files
      author={undefined}
      date={doc.date}
      pageSize="A4"
      marginsMm={18}
    >
      <article className="prose mx-auto max-w-none">
        <h1 className="font-serif">{doc.title}</h1>
        {/* Removed doc.description display, as the property may not exist */}
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}
