// pages/content/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import {
  getAllContentlayerDocs,
  getDocHref,
  isDraft,
  normalizeSlug,
} from "@/lib/contentlayer-helper";

type Props = { doc: any; canonicalPath: string };

const ContentSlugPage: NextPage<Props> = ({ doc, canonicalPath }) => {
  return (
    <ContentlayerDocPage
      doc={doc}
      canonicalPath={canonicalPath}
      backHref="/content"
      label="Reading Room"
    />
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Only generate /content/* pages (the ones whose computed href is /content/...)
  const paths = getAllContentlayerDocs()
    .filter((d) => !isDraft(d))
    .filter((d) => getDocHref(d).startsWith("/content/"))
    .map((d) => ({
      params: { slug: normalizeSlug(d) },
    }))
    .filter((p) => Boolean(p.params.slug));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  if (!slug) return { notFound: true };

  const doc =
    getAllContentlayerDocs()
      .filter((d) => !isDraft(d))
      .find((d) => getDocHref(d) === `/content/${slug}`) ?? null;

  if (!doc) return { notFound: true };

  return {
    props: { doc, canonicalPath: getDocHref(doc) },
    revalidate: 1800,
  };
};

export default ContentSlugPage;