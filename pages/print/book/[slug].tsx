// pages/print/book/[slug].tsx
import { allBooks } from "contentlayer/generated";
import BrandFrame from "@/components/print/BrandFrame";
import { GetStaticProps, GetStaticPaths } from "next"; // 2. Imported Next.js types

/**
 * Generates the list of static paths for all book documents.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  return { 
    paths: allBooks.map(b => ({ params: { slug: b.slug } })), 
    fallback: false 
  };
}

/**
 * Fetches the book data based on the slug.
 */
export const getStaticProps: GetStaticProps = async ({ params }) => {
  // Ensure params.slug is correctly handled
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const doc = allBooks.find(b => b.slug === slug) || null;
  
  return { 
    props: { doc } 
  };
}

// Interface for component props
interface BookPrintProps {
  doc: Book | null; // 3. Used explicit ContentLayer Book type instead of 'any'
}

/**
 * Component to render a book document in a print-friendly format.
 */
export default function BookPrint({ doc }: BookPrintProps) {
  if (!document) return <p>Loading...</p>;
  
  // Next-ContentLayer hook to render the MDX body
  const Component = useMDXComponent(document?.body.code)
  if (!document) return null
  
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
        {/* Re-render title/description inside the main article body for print context */}
        <h1 className="font-serif">{doc.title}</h1>
        {doc.description && <p className="text-lg">{doc.description}</p>}
        <MDX />
      </article>
    </BrandFrame>
  );
}