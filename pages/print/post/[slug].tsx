// pages/print/post/[slug].tsx
import { allPosts, Post } from "contentlayer/generated"; // ⚡ FIX: Added Post type
import BrandFrame from "@/components/print/BrandFrame";
import { GetStaticProps, GetStaticPaths } from "next";
import { useMDXComponent } from "next-contentlayer2/hooks"; // ⚡ FIX: Added MDX hook import
import { components } from "@/components/MdxComponents"; // ⚡ FIX: Added MDX component map import
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark"; // Correct alias path
import EmbossedSign from "@/components/print/EmbossedSign"; // Correct alias path

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
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const doc = allPosts.find(p => p.slug === slug) || null;
  return { 
    props: { doc } 
  };
}

interface PostPrintProps {
  doc: Post | null;
}

/**
 * Component to render a post in a print-friendly format.
 */
export default function PostPrint({ doc }: PostPrintProps) {
  if (!doc) return null;

  // ⚡ FIX 1: Call the hook UNCONDITIONALLY using 'doc'
  const MDXContent = useMDXComponent(doc.body.code)
  
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
        {/* ⚡ FIX 2: Render the component returned by the hook */}
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}