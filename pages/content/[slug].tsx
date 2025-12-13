import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import {
  getAllContentlayerDocs,
  getDocHref,
} from "@/lib/contentlayer-helper";

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

export const getStaticPaths: GetStaticPaths = async () => {
  // IMPORTANT: content/[slug] is a “generic” route.
  // We must generate paths for ALL docs, but avoid conflict with dedicated routes.
  const docs = getAllContentlayerDocs().filter((d: any) => !d.draft);

  const paths = docs
    .map((d: any) => {
      const slug = String(d.slug ?? d._raw?.flattenedPath?.split("/").pop() ?? "");
      if (!slug || slug === "index") return null;
      return { params: { slug } };
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "");
  const docs = getAllContentlayerDocs().filter((d: any) => !d.draft);

  const doc =
    docs.find((d: any) => String(d.slug ?? d._raw?.flattenedPath?.split("/").pop()) === slug) ??
    null;

  if (!doc) return { notFound: true };

  // Optional: label derived from type
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