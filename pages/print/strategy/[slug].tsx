import { allStrategies, type Strategy } from "contentlayer/generated";
import BrandFrame from "@/components/print/BrandFrame";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { components } from "@/components/MdxComponents";

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

interface Props { doc: Strategy | null }

export default function StrategyPrint({ doc }: Props) {
  const code = doc?.body?.code ?? "";
  const MDXContent = useMDXComponent(code);

  if (!doc) return <p>Loading…</p>;

  return (
    <BrandFrame
      title={doc.title}
      subtitle={doc.description || doc.ogDescription || ""}
      author={doc.author || "Abraham of London"}
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
