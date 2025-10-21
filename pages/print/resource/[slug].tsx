pages/print/resource/[slug].tsx
import { allResources } from "contentlayer/generated";
import { allPosts } from 'contentlayer2/generated'; // or similar
import BrandFrame from "@/components/print/BrandFrame";

export async function getStaticPaths() {
  return {
    paths: allResources.map((r) => ({ params: { slug: r.slug || "" } })).filter(p => p.params.slug),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const doc = allResources.find((r) => r.slug === params.slug) || null;
  return { props: { doc } };
}

export default function ResourcePrint({ doc }: { doc: any }) {
  if (!doc) return null;
  const Component = useMDXComponent(document?.body.code)
  if (!document) return <p>Loading...</p>;
  return (
    <BrandFrame
      title={doc.title}
      subtitle={doc.excerpt || ""}
      author={doc.author || "Abraham of London"}
      date={doc.date}
      pageSize="A4"
      marginsMm={18}
    >
      <article className="prose max-w-none mx-auto">
        <h1 className="font-serif">{doc.title}</h1>
        {doc.excerpt && <p className="text-lg">{doc.excerpt}</p>}
        <MDX />
      </article>
    </BrandFrame>
  );
}
