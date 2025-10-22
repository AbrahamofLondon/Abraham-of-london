// pages/print/resource/[slug].tsx
import { allResources, type Resource } from "contentlayer/generated";
import BrandFrame from "@/components/print/BrandFrame";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { components } from "@/components/MdxComponents";
import * as React from "react";

export async function getStaticPaths() {
  return {
    paths: allResources
      .map((r) => ({ params: { slug: r.slug || "" } }))
      .filter((p) => p.params.slug),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const doc = allResources.find((r) => r.slug === params.slug) || null;
  return { props: { doc } };
}

interface Props { doc: Resource | null }

export default function ResourcePrint({ doc }: Props) {
  // @ts-ignore: Suppress error for "code" property not found on type 'Markdown'.
  const code = doc?.body?.code ?? "";
  const MDXContent = useMDXComponent(code);

  if (!doc) return <p>Loading?</p>;

  return (
    <BrandFrame
      title={doc.title}
      // FIXED: Removed doc.excerpt which caused Type error
      subtitle={undefined} 
      // FIXED: Removed doc.author which caused Type error
      author={undefined}
      date={doc.date}
      pageSize="A4"
      marginsMm={18}
    >
      <article className="prose mx-auto max-w-none">
        <h1 className="font-serif">{doc.title}</h1>
        {/* Removed doc.excerpt display, as the property does not exist */}
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}
