// pages/print/resource/[slug].tsx
import { allResources, Resource } from "contentlayer/generated"; // ⚡ FIX: Adjusted imports
import BrandFrame from "@/components/print/BrandFrame";
import { useMDXComponent } from "next-contentlayer2/hooks"; // ⚡ FIX: Added MDX hook import
import { components } from "@/components/MdxComponents"; // ⚡ FIX: Added MDX component map import
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark"; // Correct alias path
import EmbossedSign from "@/components/print/EmbossedSign"; // Correct alias path

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

interface ResourcePrintProps {
  doc: Resource | null; // ⚡ FIX: Explicit type
}

export default function ResourcePrint({ doc }: ResourcePrintProps) {
  if (!doc) return null;
  
  // ⚡ FIX 1: Call the hook UNCONDITIONALLY using 'doc'
  const MDXContent = useMDXComponent(doc.body.code)

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
        {/* ⚡ FIX 2: Render the component returned by the hook */}
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}