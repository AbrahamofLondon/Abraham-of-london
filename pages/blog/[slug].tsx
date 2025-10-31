// Example: pages/blog/[slug].tsx
import { GetStaticProps, GetStaticPaths } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Head from 'next/head';
import Image from 'next/image';
import { getContentSlugs, getContentBySlug } from '@/lib/mdx';
import type { PostMeta } from '@/types/post';

// ✅ FIX: Use a NAMED IMPORT { mdxComponents }
import { mdxComponents } from '@/components/mdx-components';
import Layout from '@/components/Layout'; // Or your specific layout

// -----------------------------------------------------------------
// ⬇️⬇️ CHANGE THIS LINE FOR EACH TEMPLATE ⬇️⬇️
// -----------------------------------------------------------------
const CONTENT_TYPE = 'blog'; // Use 'downloads', 'events', 'print', etc.
// -----------------------------------------------------------------

interface PostPageProps {
  source: MDXRemoteSerializeResult;
  frontmatter: PostMeta;
}

export default function PostPage({ source, frontmatter }: PostPageProps) {
  return (
    <Layout>
      <Head>
        <title>{frontmatter.title} | Abraham of London</title>
        <meta name="description" content={frontmatter.excerpt} />
      </Head>
      <article className="container mx-auto px-4 py-12">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-serif font-bold text-deep-forest">{frontmatter.title}</h1>
          {frontmatter.date && (
            <p className="mt-2 text-soft-charcoal">
              {new Date(frontmatter.date).toLocaleDateString('en-GB', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          )}
        </header>

        {frontmatter.coverImage && (
          <div className="mb-8 aspect-w-16 aspect-h-9 relative overflow-hidden rounded-lg shadow-lg">
            <Image
              src={frontmatter.coverImage}
              alt={`Cover image for ${frontmatter.title}`}
              layout="fill"
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none">
          {/* ✅ FIX: Pass the correctly imported components map */}
          <MDXRemote {...source} components={mdxComponents} />
        </div>
      </article>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params!.slug as string;
  const { content, ...frontmatter } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });
  const finalFrontmatter = JSON.parse(JSON.stringify(frontmatter)); // Ensures no 'undefined'
  const mdxSource = await serialize(content || '');
  return { props: { source: mdxSource, frontmatter: finalFrontmatter } };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getContentSlugs(CONTENT_TYPE);
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};