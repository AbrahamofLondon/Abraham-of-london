import { allPosts, type Post } from "contentlayer/generated";
import BrandFrame from "@/components/print/BrandFrame";
import type { GetStaticProps, GetStaticPaths } from "next";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { components } from "@/components/MdxComponents";

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: allPosts.map((p) => ({ params: { slug: p.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug;
  const doc = allPosts.find((p) => p.slug === slug) || null;
  return { props: { doc } };
};

interface Props { doc: Post | null }

export default function PostPrint({ doc }: Props) {
  const code = doc?.body?.code ?? "";
  const MDXContent = useMDXComponent(code);

  if (!doc) return <p>Loading…</p>;

  return (
    <BrandFrame
      title={doc.title}
      subtitle={doc.description || doc.excerpt || ""}
      author={doc.author}
      date={doc.date}
      pageSize="A4"
      marginsMm={18}
    >
      <article className="prose mx-auto max-w-none">
        <h1 className="font-serif">{doc.title}</h1>
        {doc.description && <p className="text-lg">{doc.description}</p>}
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}
