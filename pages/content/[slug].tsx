// pages/content/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import { getAllContentlayerDocs } from '@/lib/contentlayer';

// Use the institutional MDX pipeline (export-safe)
import { prepareMDX } from "@/lib/server/md-utils";
import { sanitizeData } from "@/lib/server/md-utils";

// Define the return type of toUiDoc based on the helper file
type UiDoc = ReturnType<typeof toUiDoc>;

type Props = {
  doc: UiDoc;
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
  const docs = getAllContentlayerDocs()
    .filter((d) => d && !isDraftContent(d))
    .filter((d) => getDocHref(d).startsWith("/content/"));

  const paths = docs
    .map((d) => {
      // Always derive slug from href (most robust across types)
      const href = getDocHref(d);
      const slug = normalizeSlug(String(href).replace(/^\/content\//, ""));
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as { params: { slug: string } }[];

  console.log(`📄 Content: Generated ${paths.length} paths`);
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = normalizeSlug(String(params?.slug ?? ""));
  if (!slug) return { notFound: true };

  const targetHref = `/content/${slug}`;

  const rawDoc: ContentDoc | undefined = getAllContentlayerDocs()
    .filter((d) => d && !isDraftContent(d))
    .find((d) => getDocHref(d) === targetHref);

  if (!rawDoc) {
    console.warn(`⚠️ Content not found for slug: ${slug}`);
    return { notFound: true };
  }

  const doc = toUiDoc(rawDoc);

  // Central hardened MDX pipeline
  const rawMdx = rawDoc?.body?.raw ?? rawDoc?.body ?? "";
  const source = await prepareMDX(typeof rawMdx === "string" ? rawMdx : "");

  return {
    props: {
      doc: sanitizeData(doc), // JSON-safe
      source, // DO NOT sanitize
      canonicalPath: getDocHref(rawDoc),
    },
    revalidate: 1800,
  };
};

export default ContentSlugPage;
