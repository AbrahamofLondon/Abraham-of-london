// pages/print/event/[slug].tsx
import { allEvents, type Event } from "contentlayer/generated";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { components } from "@/components/MdxComponents";
import * as React from "react";

export async function getStaticPaths() {
  return {
    paths: allEvents.map((d) => ({ params: { slug: d.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const doc = allEvents.find((d) => d.slug === params.slug) || null;
  return { props: { doc } };
}

interface Props { doc: Event | null }

export default function EventPrintPage({ doc }: Props) {
  // FIX: Bypassing Type error for code
  const code = (doc?.body as any)?.code ?? ""; 
  const MDX = useMDXComponent(code);

  if (!doc) return <p>Loading...</p>;

  return (
    <div className="print-page print-event">
      {/* Customize your print layout here */}
      <h1>{(doc as any).title}</h1>
      <p>Date: {(doc as any).date}</p>
      <MDX components={components as any} />
    </div>
  );
}
