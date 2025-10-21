// pages/print/strategy/[slug].tsx

// Assuming Contentlayer type is 'Strategy' and all documents are 'allStrategies'
import { allStrategies, Strategy } from "contentlayer/generated"; 
import BrandFrame from "@/components/print/BrandFrame";
import { useMDXComponent } from "next-contentlayer/hooks"; // ⚡ FIX: Import useMDXComponent
import { components } from "@/components/MdxComponents"; // ⚡ FIX: Import components map


// NOTE: Replaced the redundant 'next-contentlayer2' imports with standard Contentlayer import from above.

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

interface StrategyPrintProps {
  doc: Strategy | null; // ⚡ FIX: Use explicit Contentlayer type
}

export default function StrategyPrint({ doc }: StrategyPrintProps) {
  // ⚡ FIX 1: Check document existence first
  if (!doc) return null;
  
  // ⚡ FIX 2: Call the hook UNCONDITIONALLY (using doc.body.code)
  const MDXContent = useMDXComponent(doc.body.code)

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
        {/* ⚡ FIX 3: Render the component returned by the hook */}
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}