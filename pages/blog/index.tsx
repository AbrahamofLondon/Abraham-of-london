// Example of the page logic to restore (using getServerSideProps)

import React from "react";
import { GetServerSideProps } from 'next';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';

// Import your custom components
import { MDXComponents } from '@/components/mdx'; 

interface ContentPageProps {
  frontmatter: any;
  mdxSource: any;
}

export const getServerSideProps: GetServerSideProps<ContentPageProps> = async (context) => {
  const { slug } = context.query;
  
  // 1. FETCH DATA: Fetch your content or MDX source here
  // Example: fetch post data from a database/CMS using the 'slug'
  const rawContent = await fetchContentBySlug(slug as string); 
  
  if (!rawContent) {
    return { notFound: true };
  }
  
  // 2. PARSE AND SERIALIZE: Separate frontmatter and content
  const { data: frontmatter, content } = matter(rawContent);
  
  // 3. SERIALIZE MDX: Prepare content for the <MDXRemote> component
  const mdxSource = await serialize(content, { scope: frontmatter });

  return {
    props: {
      frontmatter,
      mdxSource,
    },
  };
};

export default function ContentPage({ frontmatter, mdxSource }: ContentPageProps) {
  if (!mdxSource) {
    return <h1>Error: Content not loaded.</h1>;
  }
  
  return (
    <article className="max-w-3xl mx-auto py-10 px-4">
      {/* Render frontmatter data */}
      <h1 className="text-3xl font-bold mb-2">{frontmatter.title}</h1>
      
      <div className="prose">
        {/* Render the serialized MDX content, passing the custom components */}
        <MDXRemote 
          {...mdxSource} 
          components={MDXComponents} 
        />
      </div>
    </article>
  );
}