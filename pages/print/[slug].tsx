// pages/print/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import {
  allPosts,
  allBooks,
  allEvents,
  allResources,
  allStrategies,
} from "contentlayer/generated";
import type { Post, Book, Event, Resource, Strategy } from "contentlayer/generated";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { components } from "@/components/MdxComponents";
import BrandFrame from "@/components/print/BrandFrame";

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
  // Always call the hook
  const code = doc?.body?.code ?? "";
  const MDXContent = useMDXComponent(code);

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
      <article className="prose max-w-none mx-auto">
        <h1 className="font-serif">{doc.title}</h1>
        {desc && <p className="text-lg">{desc}</p>}
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}
