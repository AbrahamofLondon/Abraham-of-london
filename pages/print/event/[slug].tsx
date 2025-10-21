// pages/print/event/[slug].tsx
import { allEvents, Event } from "contentlayer2/generated"; // 1. Updated import path and imported 'Event' type
import BrandFrame from "@/components/print/BrandFrame";
import { GetStaticProps, GetStaticPaths } from "next"; // 2. Imported Next.js types

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
  // Ensure params.slug is correctly handled
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const doc = allEvents.find(e => e.slug === slug) || null;
  
  return { 
    props: { doc } 
  };
}

// Interface for component props
interface EventPrintProps {
  doc: Event | null; // 3. Used explicit ContentLayer Event type instead of 'any'
}

/**
 * Component to render an event document in a print-friendly format.
 */
export default function EventPrint({ doc }: EventPrintProps) {
  if (!doc) return null;
  
  // Next-ContentLayer hook to render the MDX body
  const MDX = useMDXComponent(doc.body.code);
  
  // Format date and time for the print subtitle
  const when = doc.date 
    ? new Date(doc.date).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }) 
    : "";
    
  // Combine formatted date/time and location for a concise subtitle
  const subtitle = `${when}${doc.location ? ` — ${doc.location}` : ""}`;

  return (
    <BrandFrame
      title={doc.title}
      subtitle={subtitle} // Use the combined string
      author="Abraham of London"
      date={doc.date}
      pageSize="A4"
      marginsMm={18}
    >
      <article className="prose max-w-none mx-auto">
        {/* The title is already passed to BrandFrame but is often repeated inside the article for print layout fidelity */}
        <h1 className="font-serif">{doc.title}</h1>
        <MDX />
      </article>
    </BrandFrame>
  );
}