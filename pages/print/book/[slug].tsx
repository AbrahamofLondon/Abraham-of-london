// pages/print/book/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import { allBooks, type Book } from "contentlayer/generated";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { components } from '@/components/MdxComponents';
import BrandFrame from "@/components/print/BrandFrame";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark";
import EmbossedSign from "@/components/print/EmbossedSign";

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: allBooks.map((b) => ({ params: { slug: b.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug;
  const doc = allBooks.find((b) => b.slug === slug) || null;
  return { props: { doc } };
};

interface BookPrintProps {
  doc: Book | null;
}

export default function BookPrint({ doc }: BookPrintProps) {
  if (!doc) return null; // early return before any hooks

  // Hook called unconditionally for all non-null renders
  const MDXContent = useMDXComponent(doc.body.code);

  return (
    <BrandFrame
      title={doc.title}
      subtitle={doc.description || ""}
      author={doc.author}
      date={doc.date}
      pageSize="A4"
      marginsMm={20}
    >
      <article className="prose max-w-none mx-auto">
        <h1 className="font-serif">{doc.title}</h1>
        {doc.description && <p className="text-lg">{doc.description}</p>}
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}
