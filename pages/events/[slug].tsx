// pages/events/[slug].tsx
import { allEvents, type Event } from "contentlayer/generated";
import dynamic from 'next/dynamic';
import * as React from "react";

// Dynamically import the MDX renderer with ssr: false
const MDXRenderer = dynamic(
  () => import('@/components/MDXContentRenderer'), 
  { ssr: false, loading: () => <p>Loading content...</p> }
);


export async function getStaticPaths() {
  return {
    // Only includes non-draft events
    paths: allEvents
      .filter((e) => !e.draft)
      .map((e) => ({ params: { slug: e.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const doc = allEvents.find((e) => e.slug === params.slug) || null;
  return { props: { doc } };
}

interface Props { doc: Event | null }

export default function EventPage({ doc }: Props) {
  // 1. CODE EXTRACTION:
  // @ts-ignore: Suppress error for "code" property not found on type 'Markdown'.
  const code = (doc?.body as any)?.code ?? "";

  // 2. CONDITIONAL RETURN:
  if (!doc) return <p>Event not found.</p>;

  // 3. RENDERING:
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <article className="prose mx-auto max-w-none">
        <h1 className="font-serif">{doc.title}</h1>
        <p className="text-lg font-semibold">{(doc as any).summary}</p>
        
        {/* Use the client-only component */}
        <MDXRenderer code={code} />
      </article>
    </div>
  );
}
