// pages/print/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import { allResources, type Resource } from "contentlayer/generated";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { components } from "@/components/MdxComponents";
import BrandFrame from "@/components/print/BrandFrame";

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: allResources
      .map((r) => ({ params: { slug: r.slug || "" } }))
      .filter((p) => p.params.slug),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug;
  const doc = allResources.find((r) => r.slug === slug) || null;
  return { props: { doc } };
};

interface ResourcePrintProps {
  doc: Resource | null;
}

export default function ResourcePrint({ doc }: ResourcePrintProps) {
  if (!doc) return null; // ensure hooks aren't called before data exists

  // Call hook unconditionally with valid code
  const MDXContent = useMDXComponent(doc.body.code);

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
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}
