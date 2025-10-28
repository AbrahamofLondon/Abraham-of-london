// pages/print/post/[slug].tsx (Restored Original Code)
import * as React from "react";
import { allPosts, Post } from "contentlayer/generated";
import { GetStaticPaths, GetStaticProps } from "next";
import { useMDXComponent } from "next-contentlayer/hooks";
import { MDXComponents } from "@/components/mdx"; // Your custom component map

// 1. Fetching Paths (getStaticPaths)
export const getStaticPaths: GetStaticPaths = async () => {
  return {
    // Generate paths for all your posts
    paths: allPosts.map((post) => ({ params: { slug: post.slug } })),
    fallback: false, // Set to 'blocking' or true if you use Incremental Static Regeneration (ISR)
  };
};

// 2. Fetching Data (getStaticProps)
export const getStaticProps: GetStaticProps<{ post: Post }> = async ({ params }) => {
  const post = allPosts.find((post) => post.slug === params?.slug);

  if (!post) {
    // This should ideally not happen if getStaticPaths is correct
    return { notFound: true };
  }

  return { 
    props: { post },
    // If you use ISR, uncomment the revalidate line:
    // revalidate: 60, 
  };
};

// 3. Rendering
export default function PostPage({ post }: { post: Post }) {
  // Post will contain all frontmatter and the compiled MDX code (post.body.code)
  const MDXContent = useMDXComponent(post.body.code);

  return (
    <main>
      <article>
        <h1>{post.title}</h1>
        {/* Render the full content using the component map */}
        <MDXContent components={MDXComponents} />
      </article>
    </main>
  );
}