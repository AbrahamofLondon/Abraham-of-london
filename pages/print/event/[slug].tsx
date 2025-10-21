// pages/print/event/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import { allEvents, type Event } from "contentlayer/generated";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { components } from "@/components/MdxComponents";
import BrandFrame from "@/components/print/BrandFrame";

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: allEvents.map((e) => ({ params: { slug: e.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug;
  const doc = allEvents.find((e) => e.slug === slug) || null;
  return { props: { doc } };
};

interface EventPrintProps {
  doc: Event | null;
}

export default function EventPrint({ doc }: EventPrintProps) {
  // Keep hook order stable by calling it unconditionally
  const code = doc?.body?.code ?? "";
  const MDXContent = useMDXComponent(code);

  if (!doc) return <p>Loading…</p>;

  const when = doc.date
    ? new Date(doc.date).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })
    : "";
  const subtitle = `${when}${doc.location ? ` — ${doc.location}` : ""}`;

  return (
    <BrandFrame
      title={doc.title}
      subtitle={subtitle}
      author="Abraham of London"
      date={doc.date}
      pageSize="A4"
      marginsMm={18}
    >
      <article className="prose max-w-none mx-auto">
        <h1 className="font-serif">{doc.title}</h1>
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}
