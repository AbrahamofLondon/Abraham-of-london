// pages/blog/[slug].tsx
import { GetStaticProps, GetStaticPaths } from 'next';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Head from 'next/head';
import Image from 'next/image';
import { getContentSlugs, getContentBySlug } from '@/lib/mdx';
import type { PostMeta } from '@/types/post';
import mdxComponentMap from '@/components/mdx-components'; // ✅ FIX: Import the component map

// ... (interface PostPageProps remains the same)

export default function PostPage({ source, frontmatter }) {
  // ... (your existing component JSX is fine)
  // The important part is passing the components to MDXRemote
  return (
    //...
    <div className="prose prose-lg max-w-none">
      <MDXRemote {...source} components={mdxComponentMap} />
    </div>
    //...
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params!.slug as string;
  const { content, ...frontmatter } = getContentBySlug('blog', slug, { withContent: true });

  // ✅ FIX: Ensure all properties are serializable (null instead of undefined)
  const finalFrontmatter = JSON.parse(JSON.stringify(frontmatter));
  
  const mdxSource = await serialize(content || '');

  return { props: { source: mdxSource, frontmatter: finalFrontmatter } };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getContentSlugs('blog');
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};