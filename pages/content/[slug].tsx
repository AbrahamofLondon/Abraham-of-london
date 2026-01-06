// pages/content/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

import ContentlayerDocPage from "@/components/ContentlayerDocPage";

import {
  getAllContentlayerDocs,
  getDocHref,
  isDraftContent,
  normalizeSlug,
  toUiDoc,
  type ContentDoc,
} from "@/lib/contentlayer";

// Use the institutional MDX pipeline (export-safe)
import { prepareMDX } from "@/lib/server/md-utils";
import { sanitizeData } from "@/lib/server/md-utils";

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
  const docs = (getAllContentlayerDocs() || [])
    .filter((d: any) => d && !isDraftContent(d))
    .filter((d: any) => getDocHref(d).startsWith("/content/"));

  const paths = docs
    .map((d: any) => {
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

  const rawDoc: ContentDoc | undefined = (getAllContentlayerDocs() || [])
    .filter((d: any) => d && !isDraftContent(d))
    .find((d: any) => getDocHref(d) === targetHref);

  if (!rawDoc) {
    console.warn(`⚠️ Content not found for slug: ${slug}`);
    return { notFound: true };
  }

  const doc = toUiDoc(rawDoc);

  const rawMdx = (rawDoc as any)?.body?.raw ?? (rawDoc as any)?.body ?? "";
  const source = await prepareMDX(typeof rawMdx === "string" ? rawMdx : "");

  return {
    props: {
      doc: sanitizeData(doc),
      source,
      canonicalPath: getDocHref(rawDoc),
    },
    revalidate: 1800,
  };
};

export default ContentSlugPage;