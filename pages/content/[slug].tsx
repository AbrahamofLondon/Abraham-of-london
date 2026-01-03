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
  isDraftContent,
  normalizeSlug,
  toUiDoc,
  type ContentDoc, // Import the actual type from the helper
} from "@/lib/contentlayer-helper";

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
  const paths = getAllContentlayerDocs()
    .filter((d) => !isDraftContent(d))
    .filter((d) => getDocHref(d).startsWith("/content/"))
    .map((d) => ({ params: { slug: normalizeSlug(d) } }))
    .filter((p) => Boolean(p.params.slug));

  console.log(`📄 Content: Generated ${paths.length} paths`);
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  if (!slug) return { notFound: true };

  const rawDoc: ContentDoc | undefined = getAllContentlayerDocs()
    .filter((d) => !isDraftContent(d))
    .find((d) => getDocHref(d) === `/content/${slug}`);

  if (!rawDoc) {
    console.warn(`⚠️ Content not found for slug: ${slug}`);
    return { notFound: true };
  }

  const doc = toUiDoc(rawDoc);

  // Serialize MDX
  const raw = String(rawDoc?.body?.raw ?? "");
  let source: MDXRemoteSerializeResult;

  try {
    source = await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });
  } catch (_err) {
    console.error(`❌ Failed to serialize MDX for: ${doc.title}`, _err);
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