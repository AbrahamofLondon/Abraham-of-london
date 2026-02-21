/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { getDocBySlug } from "@/lib/content/unified-router";
import { allPosts, allShorts } from "contentlayer/generated";

// ✅ Import ALL MDX components (safe approach)
import mdxComponents from "@/components/mdx-components";
import RegistryLayout from "@/components/layout/RegistryLayout";

interface UniversalPageProps {
  source: MDXRemoteSerializeResult;
  metadata: {
    title: string;
    subtitle?: string;
    date: string;
    description?: string;
    [key: string]: any;
  };
}

const UniversalDispatchPage: NextPage<UniversalPageProps> = ({ source, metadata }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR/build, show minimal shell
  if (!mounted) {
    return (
      <RegistryLayout>
        <div className="min-h-screen bg-black" />
      </RegistryLayout>
    );
  }

  return (
    <RegistryLayout>
      <Head>
        <title>{metadata.title} | Abraham of London</title>
        <meta name="description" content={metadata.description || ""} />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description || ""} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`https://www.abrahamoflondon.org/registry/${metadata.type}/${metadata.slug}`} />
      </Head>

      <article className="prose prose-invert max-w-none">
        <header className="mb-12 border-b border-white/10 pb-8">
          <h1 className="font-serif text-4xl italic text-white md:text-5xl">
            {metadata.title}
          </h1>
          {metadata.subtitle && (
            <p className="mt-4 font-mono text-lg uppercase tracking-widest text-amber-500/80">
              {metadata.subtitle}
            </p>
          )}
          <div className="mt-6 flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            <span>Date: {new Date(metadata.date).toLocaleDateString('en-GB')}</span>
            <span className="h-1 w-1 rounded-full bg-zinc-800" />
            <span>Status: Verified</span>
          </div>
        </header>
        
        <div className="text-zinc-300">
          {/* ✅ Pass ALL MDX components - safe and recommended */}
          <MDXRemote {...source} components={mdxComponents} />
        </div>
      </article>
    </RegistryLayout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const dispatches = allPosts
    .filter(p => !p.draft)
    .map(p => ({ 
      params: { 
        type: 'dispatches', 
        slug: p.slugAsParams || p._raw.flattenedPath.split('/').pop() 
      } 
    }));
    
  const shorts = allShorts
    .filter(s => !s.draft)
    .map(s => ({ 
      params: { 
        type: 'shorts', 
        slug: s.slugAsParams || s._raw.flattenedPath.split('/').pop() 
      } 
    }));

  return {
    paths: [...dispatches, ...shorts],
    fallback: "blocking"
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const type = params?.type as string;
  const docRaw = getDocBySlug(slug);

  if (!docRaw || (docRaw as any).draft) return { notFound: true };

  const mdxSource = await serialize((docRaw as any).body.raw, {
    parseFrontmatter: true,
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
  });

  return {
    props: {
      source: mdxSource,
      metadata: {
        title: (docRaw as any).title || "Untitled Intelligence",
        subtitle: (docRaw as any).subtitle || null,
        date: (docRaw as any).date || new Date().toISOString(),
        description: (docRaw as any).description || null,
        type,
        slug,
      },
    },
    revalidate: 1800
  };
};

export default UniversalDispatchPage;