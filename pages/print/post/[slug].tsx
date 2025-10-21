// pages/print/post/[slug].tsx
import { allPosts } from "contentlayer/generated";
import BrandFrame from "@/components/print/BrandFrame";
import { GetStaticProps, GetStaticPaths } from "next"; // 2. Imported Next.js types

/**
 * Generates the list of static paths for all posts.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  return { 
    paths: allPosts.map(p => ({ params: { slug: p.slug } })), 
    fallback: false 
  };
}

/**
 * Fetches the post data based on the slug.
 */
export const getStaticProps: GetStaticProps = async ({ params }) => {
  // Ensure params.slug is a string
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const doc = allPosts.find(p => p.slug === slug) || null;
  
  return { 
    props: { doc } 
  };
}

// Interface for component props
interface PostPrintProps {
  doc: Post | null; // 3. Used explicit ContentLayer Post type
}

/**
 * Component to render a post in a print-friendly format.
 */
export default function PostPrint({ doc }: PostPrintProps) {
  if (!doc) return null;

  // Next-ContentLayer hook to render the MDX body
  const MDX = useMDXComponent(doc.body.code);
  
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
        {/* Re-render title/description inside the main article body for print context */}
        <h1 className="font-serif">{doc.title}</h1>
        {doc.description && <p className="text-lg">{doc.description}</p>}
        <MDX />
      </article>
    </BrandFrame>
  );
}