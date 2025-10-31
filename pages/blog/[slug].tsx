// Example: pages/blog/[slug].tsx
import { GetStaticProps, GetStaticPaths } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize'; // This is next-mdx-remote/serialize
import Head from 'next/head';
import Image from 'next/image';
import { getContentSlugs, getContentBySlug } from '@/lib/mdx';
import type { PostMeta } from '@/types/post';
import Layout from '@/components/Layout';
import mdxComponents from '@/components/mdx-components'; // Correct default import

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
  // Use a simple layout wrapper
  const Wrapper = frontmatter.layout === 'print' ? React.Fragment : Layout;
  
  return (
    <Wrapper>
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
          <MDXRemote {...source} components={mdxComponents} />
        </div>
      </article>
    </Wrapper>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params!.slug as string;
  const { content, ...frontmatter } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });
  
  // Ensures no 'undefined' values are passed, which breaks serialization
  const finalFrontmatter = JSON.parse(JSON.stringify(frontmatter)); 

  // ✅ FIX: Pass the frontmatter data into the 'scope'
  // This makes variables like 'title' available inside your MDX files.
  const mdxSource = await serialize(content || '', { 
    scope: finalFrontmatter 
  });

  return { props: { source: mdxSource, frontmatter: finalFrontmatter } };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getContentSlugs(CONTENT_TYPE);
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};