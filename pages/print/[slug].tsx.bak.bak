// pages/print/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import dynamic from 'next/dynamic'; // <-- 1. Import dynamic
import * as React from "react";

// Import all document sources
import {
  allPosts,
  allBooks,
  allEvents,
  allResources,
  allStrategies,
} from "contentlayer/generated";
import type { Post, Book, Event, Resource, Strategy } from "contentlayer/generated";
// ⚠️ Remove the following two lines:
// import { useMDXComponent } from "next-contentlayer2/hooks";
// import { components } from "@/components/MdxComponents";

import BrandFrame from "@/components/print/BrandFrame";

// 2. Dynamically import the MDX rendering component, disabling SSR
const PrintMDXContent = dynamic(
  () => import('@/components/print/PrintMDXContent'),
  { 
    ssr: false, // <-- CRITICAL: Prevents 'undefined (reading default)' error
    loading: () => (
        <article className="prose max-w-none mx-auto">
            <p>Compiling document...</p>
        </article>
    )
  }
);


// ... (rest of your imports, type definitions, and getStaticPaths/getStaticProps remain the same) ...

// Union type for any document that has MDX body + common fields
type AnyDoc = (Post | Book | Event | Resource | Strategy) & {
  body: { code: string };
  slug: string;
  title: string;
  date?: string;
  author?: string;
  description?: string;
  excerpt?: string;
  ogDescription?: string;
  location?: string;
};

const ALL: AnyDoc[] = [
  ...(allPosts as AnyDoc[]),
  ...(allBooks as AnyDoc[]),
  ...(allEvents as AnyDoc[]),
  ...(allResources as AnyDoc[]),
  ...(allStrategies as AnyDoc[]),
];

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: ALL.map((d) => ({ params: { slug: d.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug;
  const doc = ALL.find((d) => d.slug === slug) || null;
  return { props: { doc } };
};

export default function PrintPage({ doc }: { doc: AnyDoc | null }) {
  const code = doc?.body?.code ?? "";

  if (!doc) return <p>Loading…</p>;

  // Choose a subtitle heuristic
  const when =
    doc.date ? new Date(doc.date).toLocaleDateString(undefined, { dateStyle: "long" }) : "";
  const desc = doc.description || (doc as any).ogDescription || doc.excerpt || "";
  const loc = (doc as any).location ? ` — ${(doc as any).location}` : "";
  const subtitle = [when, desc].filter(Boolean).join(" · ") + loc;

  return (
    <BrandFrame
      title={doc.title}
      subtitle={subtitle}
      author={doc.author || "Abraham of London"}
      date={doc.date}
      pageSize="A4"
      marginsMm={18}
    >
      {/* 3. Pass props to the dynamically loaded component */}
      <PrintMDXContent 
          code={code} 
          title={doc.title} 
          description={desc} 
      />
    </BrandFrame>
  );
}