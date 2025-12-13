import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import { getAllContentlayerDocs, getDocHref } from "@/lib/contentlayer-helper";

type Props = { doc: any; canonicalPath: string; label?: string };

const ContentReadingRoom: NextPage<Props> = ({ doc, canonicalPath, label }) => {
  return (
    <ContentlayerDocPage
      doc={doc}
      canonicalPath={canonicalPath}
      backHref="/content"
      label={label ?? "Reading Room"}
    />
  );
};

function getDocSlug(doc: any): string {
  // Keep the “full slug” coming from frontmatter/contentlayer when present.
  // Only fallback to flattenedPath last resort.
  return String(doc?.slug ?? doc?._raw?.flattenedPath?.split("/").pop() ?? "");
}

export const getStaticPaths: GetStaticPaths = async () => {
  // This route is the generic “content reading room”.
  // Only generate paths for docs that *actually* belong under /content/*
  const docs = getAllContentlayerDocs()
    .filter((d: any) => !d?.draft)
    .filter((d: any) => String(getDocHref(d) || "").startsWith("/content/"));

  const paths = docs
    .map((d: any) => {
      const slug = getDocSlug(d);
      if (!slug || slug === "index") return null;
      return { params: { slug } };
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "");

  const docs = getAllContentlayerDocs()
    .filter((d: any) => !d?.draft)
    .filter((d: any) => String(getDocHref(d) || "").startsWith("/content/"));

  const doc =
    docs.find((d: any) => getDocSlug(d) === slug) ??
    null;

  if (!doc) return { notFound: true };

  const docType = String(doc.type ?? doc._type ?? "").toLowerCase();
  const label =
    docType === "post"
      ? "Essay"
      : docType === "download"
      ? "Download"
      : docType === "resource"
      ? "Resource"
      : docType === "print"
      ? "Print"
      : docType === "short"
      ? "Short"
      : docType === "strategy"
      ? "Strategy"
      : docType === "canon"
      ? "Canon"
      : docType === "book"
      ? "Book"
      : "Reading Room";

  return {
    props: {
      doc,
      canonicalPath: getDocHref(doc),
      label,
    },
    revalidate: 60,
  };
};

export default ContentReadingRoom;