// pages/strategy/[slug].tsx
import { allStrategies, type Strategy } from "contentlayer/generated";
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

export default function StrategyPage({ doc }: Props) {
  // 1. UNCONDITIONAL HOOK CALL SETUP:
  // Define 'code' with a safe fallback to satisfy the unconditional hook rule.
  // @ts-ignore: Suppress error for "code" property not found on type 'Markdown'.
  const code = doc?.body?.code ?? ""; 
  // Call hook unconditionally at the top level.
  const MDX = useMDXComponent(code);

  // 2. CONDITIONAL RETURN:
  if (!doc) return <p>Loading...</p>;

  // 3. RENDERING:
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <article className="prose mx-auto max-w-none">
        <h1 className="font-serif">{doc.title}</h1>
        {doc.description && <p className="text-lg">{doc.description}</p>}
        <p className="text-sm text-gray-500">By {doc.author} on {doc.date}</p>
        <MDX components={components as any} />
      </article>
    </div>
  );
}
