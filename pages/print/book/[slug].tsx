import { allBooks, type Book } from "contentlayer/generated";
import BrandFrame from "@/components/print/BrandFrame";
import type { GetStaticProps, GetStaticPaths } from "next";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { components } from "@/components/MdxComponents";

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: allBooks.map((b) => ({ params: { slug: b.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug;
  const doc = allBooks.find((b) => b.slug === slug) || null;
  return { props: { doc } };
};

interface Props { doc: Book | null }

export default function BookPrint({ doc }: Props) {
  const code = doc?.body?.code ?? "";
  const MDXContent = useMDXComponent(code);

  if (!doc) return <p>Loading…</p>;

  return (
    <BrandFrame
      title={doc.title}
      subtitle={doc.description || ""}
      author={doc.author}
      date={doc.date}
      pageSize="A4"
      marginsMm={20}
    >
      <article className="prose mx-auto max-w-none">
        <h1 className="font-serif">{doc.title}</h1>
        {doc.description && <p className="text-lg">{doc.description}</p>}
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}
