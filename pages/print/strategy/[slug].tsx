pages/print/strategy/[slug].tsx
import { useLivePreview } from "next-contentlayer2/hooks";
import { allPosts } from 'contentlayer2/generated'; // or similar
import BrandFrame from "@/components/print/BrandFrame";

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

export default function StrategyPrint({ doc }: { doc: any }) {
  if (!doc) return null;
  const Component = useMDXComponent(document?.body.code)
  if (!document) return <p>Loading...</p>;
  return (
    <BrandFrame
      title={doc.title}
      subtitle={doc.description || doc.ogDescription || ""}
      author={doc.author || "Abraham of London"}
      date={doc.date}
      pageSize="A4"
      marginsMm={18}
    >
      <article className="prose max-w-none mx-auto">
        <h1 className="font-serif">{doc.title}</h1>
        {doc.description && <p className="text-lg">{doc.description}</p>}
        <MDX />
      </article>
    </BrandFrame>
  );
}
