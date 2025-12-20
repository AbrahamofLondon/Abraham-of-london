// pages/content/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { serialize } from "next-mdx-remote/serialize";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import {
  getAllContentlayerDocs,
  getDocHref,
  isDraft,
  normalizeSlug,
} from "@/lib/contentlayer-helper";

type Props = { 
  doc: {
    title: string;
    excerpt: string | null;
    description: string | null;
    coverImage: string | null;
    category: string | null;
    date: string | null;
    readTime: string | null;
    tags: string[] | null;
    slug: string;
  };
  source: MDXRemoteSerializeResult;
  canonicalPath: string;
};

const ContentSlugPage: NextPage<Props> = ({ doc, source, canonicalPath }) => {
  return (
    <ContentlayerDocPage
      doc={doc}
      source={source}
      canonicalPath={canonicalPath}
      backHref="/content"
      label="Kingdom Vault"
    />
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllContentlayerDocs()
    .filter((d) => !isDraft(d))
    .filter((d) => getDocHref(d).startsWith("/content/"))
    .map((d) => ({
      params: { slug: normalizeSlug(d) },
    }))
    .filter((p) => Boolean(p.params.slug));

  console.log(`📄 Content: Generated ${paths.length} paths`);
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  
  if (!slug) {
    return { notFound: true };
  }

  const rawDoc = getAllContentlayerDocs()
    .filter((d) => !isDraft(d))
    .find((d) => getDocHref(d) === `/content/${slug}`);

  if (!rawDoc) {
    console.warn(`⚠️ Content not found for slug: ${slug}`);
    return { notFound: true };
  }

  console.log(`✅ Found content: ${rawDoc.title} (slug: ${slug})`);

  // Create serializable props
  const doc = {
    title: rawDoc.title || "Untitled",
    excerpt: rawDoc.excerpt || null,
    description: rawDoc.description || null,
    coverImage: rawDoc.coverImage || null,
    category: rawDoc.category || null,
    date: rawDoc.date || null,
    readTime: rawDoc.readTime || null,
    tags: rawDoc.tags || null,
    slug: slug,
  };

  // Serialize MDX
  const raw = String(rawDoc?.body?.raw ?? "");
  let source: MDXRemoteSerializeResult;

  try {
    source = await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ],
      },
    });
  } catch (err) {
    console.error(`❌ Failed to serialize MDX for: ${doc.title}`, err);
    source = await serialize("Content is being prepared for the Vault.");
  }

  return {
    props: {
      doc,
      source,
      canonicalPath: getDocHref(rawDoc),
    },
    revalidate: 1800,
  };
};

export default ContentSlugPage;