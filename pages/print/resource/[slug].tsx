// pages/print/resource/[slug].tsx
import * as React from 'react';
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import BrandFrame from "@/components/print/BrandFrame";
import mdxComponents from "@/components/mdx-components";
import { getAllContent, getContentBySlug } from "@/lib/mdx"; 
import type { PostMeta } from "@/types/post";

const CONTENT_TYPE = "resources"; // Target Content/resources folder

type Props = { 
  source: Awaited<ReturnType<typeof serialize>>; 
  frontmatter: PostMeta;
};

// ----------------------------------------------------
// CRITICAL FIX: Ensures paths are built for all resource files
// ----------------------------------------------------
export const getStaticPaths: GetStaticPaths = async () => {
  // Rely on the robustness built into lib/mdx.ts to find only valid content slugs
  const allContent = getAllContent(CONTENT_TYPE);
  const paths = allContent.map(item => ({ 
      params: { slug: item.slug.toLowerCase() } 
  }));
  return { paths: paths, fallback: false };
};

// ----------------------------------------------------
// ✅ CRITICAL FIX: Ensures safe fetching and serialization
// ----------------------------------------------------
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params!.slug as string;
  const { content, ...rawFrontmatter } = getContentBySlug(CONTENT_TYPE, slug, { withContent: true });

  if (!content) {
    return { notFound: true };
  }

  // CRITICAL: Ensure ALL string properties used in the page (like title/excerpt) are explicitly
  // strings, as required by the renderer/components.
  const frontmatter = {
    ...rawFrontmatter,
    title: rawFrontmatter.title ?? 'Untitled Resource',
    excerpt: rawFrontmatter.excerpt ?? '', 
    subtitle: rawFrontmatter.subtitle ?? '', // Ensure subtitle is safe for concatenation

    // Final JSON-safe operation. This uses the null-coalesced raw data.
    ...JSON.parse(JSON.stringify(rawFrontmatter)),
  };


  const mdxSource = await serialize(content, { scope: frontmatter });

  return { props: { source: mdxSource, frontmatter: frontmatter }, revalidate: 3600 };
};


export default function PrintResourcePage({ source, frontmatter }: InferGetStaticPropsType<typeof getStaticProps>) {
  // CRITICAL FIX: Ensure subtitle and excerpt are strings for concatenation 
  const subtitleText = frontmatter.subtitle || frontmatter.excerpt || ''; 
  
  return (
    <BrandFrame
      title={frontmatter.title}
      subtitle={subtitleText} // Use the guaranteed string for subtitle
      pageSize="A4" 
    >
      <div className="prose max-w-none">
        <MDXRemote {...source} components={mdxComponents} />
      </div>
    </BrandFrame>
  );
}import { allResources, type Resource } from "contentlayer/generated";
import BrandFrame from "@/components/print/BrandFrame";
import { useMDXComponent } from "next-contentlayer2/hooks";
import MDXComponents from '@/components/MDXComponents';

export async function getStaticPaths() {
  return {
    paths: allResources
      .map((r) => ({ params: { slug: r.slug || "" } }))
      .filter((p) => p.params.slug),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const doc = allResources.find((r) => r.slug === params.slug) || null;
  return { props: { doc } };
}

interface Props { doc: Resource | null }

export default function ResourcePrint({ doc }: Props) {
  const code = doc?.body?.code ?? "";
  const MDXContent = useMDXComponent(code);

  if (!doc) return <p>Loading…</p>;

  return (
    <BrandFrame
      title={doc.title}
      subtitle={doc.excerpt || ""}
      author={doc.author || "Abraham of London"}
      date={doc.date}
      pageSize="A4"
      marginsMm={18}
    >
      <article className="prose mx-auto max-w-none">
        <h1 className="font-serif">{doc.title}</h1>
        {doc.excerpt && <p className="text-lg">{doc.excerpt}</p>}
        <MDXContent components={components as any} />
      </article>
    </BrandFrame>
  );
}
