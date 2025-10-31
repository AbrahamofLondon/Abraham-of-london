import { GetStaticProps, GetStaticPaths } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Head from 'next/head';
import Image from 'next/image';
import { getContentSlugs, getContentBySlug } from '@/lib/mdx';
import type { PostMeta } from '@/types/post';
import mdxComponentMap from '@/components/mdx-components';

interface PostPageProps {
  source: MDXRemoteSerializeResult;
  frontmatter: PostMeta;
}

export default function PostPage({ source, frontmatter }: PostPageProps) {
  return (
    <>
      <Head>
        <title>{frontmatter.title} | Abraham of London</title>
        <meta name="description" content={frontmatter.excerpt} />
      </Head>
      <article className="container mx-auto px-4 py-12">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-serif font-bold text-deep-forest">{frontmatter.title}</h1>
          <p className="mt-2 text-soft-charcoal">
            {new Date(frontmatter.date!).toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>

        {/* ✅ THIS IS THE FIX FOR MISSING IMAGES */}
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
          <MDXRemote {...source} components={mdxComponentMap} />
        </div>
      </article>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params as { slug: string };
  const { content, ...frontmatter } = getContentBySlug('blog', slug, { withContent: true });
  
  const mdxSource = await serialize(content || '', {
    mdxOptions: { /* Add any plugins here if needed */ },
  });

  return {
    props: {
      source: mdxSource,
      frontmatter,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getContentSlugs('blog');
  const paths = slugs.map((slug) => ({
    params: { slug },
  }));

  return {
    paths,
    fallback: false,
  };
};