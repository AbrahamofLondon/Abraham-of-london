// pages/print/post/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import { allPosts, type Post } from "contentlayer/generated";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { components } from "@/components/MdxComponents";
import BrandFrame from "@/components/print/BrandFrame";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark";
import EmbossedSign from "@/components/print/EmbossedSign";

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: allPosts.map((p) => ({ params: { slug: p.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug;
  const doc = allPosts.find((p) => p.slug === slug) || null;
  return { props: { doc } };
};

interface PostPrintProps {
  doc: Post | null;
}

export default function PostPrint({ doc }: PostPrintProps) {
  if (!doc) return null;

  const MDXContent = useMDXComponent(doc.body.code);

  return (
    <BrandFrame
      title={doc.title}
      subtitle={doc.description || doc.excerpt || ""}
      author={doc.author}
      date={doc.date}
      pageSize="A4"
      marginsMm={18}
    >
      <article className="prose max-w-none mx-auto">
        <h1 className="font-serif">{doc.title}</h1>
        {doc.description && <p className="text-lg">{doc.description}</p>}
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}
