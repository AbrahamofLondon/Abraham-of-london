// pages/print/event/[slug].tsx
import { allEvents, Event } from "contentlayer/generated"; // ⚡ FIX: Added Event type
import BrandFrame from "@/components/print/BrandFrame";
import { GetStaticProps, GetStaticPaths } from "next";
import { useMDXComponent } from "next-contentlayer2/hooks"; // ⚡ FIX: Added MDX hook import
import { components } from "@/components/MdxComponents"; // ⚡ FIX: Added MDX component map import
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark"; // Correct alias path
import EmbossedSign from "@/components/print/EmbossedSign"; // Correct alias path

/**
 * Generates the list of static paths for all event documents.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  return { 
    paths: allEvents.map(e => ({ params: { slug: e.slug } })), 
    fallback: false 
  };
}

/**
 * Fetches the event data based on the slug.
 */
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const doc = allEvents.find(e => e.slug === slug) || null;
  return { 
    props: { doc } 
  };
}

interface EventPrintProps {
  doc: Event | null;
}

/**
 * Component to render an event document in a print-friendly format.
 */
export default function EventPrint({ doc }: EventPrintProps) {
  if (!doc) return null;
  
  // ⚡ FIX 1: Call the hook UNCONDITIONALLY using 'doc'
  const MDXContent = useMDXComponent(doc.body.code)
  
  // Format date and time for the print subtitle
  const when = doc.date 
    ? new Date(doc.date).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }) 
    : "";
    
  // Combine formatted date/time and location for a concise subtitle
  const subtitle = `${when}${doc.location ? ` — ${doc.location}` : ""}`;

  return (
    <BrandFrame
      title={doc.title}
      subtitle={subtitle}
      author="Abraham of London"
      date={doc.date}
      pageSize="A4"
      marginsMm={18}
    >
      <article className="prose max-w-none mx-auto">
        <h1 className="font-serif">{doc.title}</h1>
        {/* ⚡ FIX 2: Render the component returned by the hook */}
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}