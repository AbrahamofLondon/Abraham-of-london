// pages/shorts/[slug].tsx
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import {
  getAllContentlayerDocs,
  getDocHref,
  getDocKind,
  isDraft,
} from "@/lib/contentlayer-helper";

type Props = {
  doc: any;
  canonicalPath: string;
  label?: string;
};

const ShortReadingPage: NextPage<Props> = ({ doc, canonicalPath, label }) => {
  return (
    <ContentlayerDocPage
      doc={doc}
      canonicalPath={canonicalPath}
      backHref="/shorts"
      label={label ?? "Shorts"}
    />
  );
};

function normalizeSlugFromDoc(d: any): string {
  const fromField = typeof d?.slug === "string" ? d.slug.trim() : "";
  if (fromField) return fromField;

  const fp =
    typeof d?._raw?.flattenedPath === "string" ? d._raw.flattenedPath : "";
  if (fp) {
    const parts = fp.split("/");
    const last = parts[parts.length - 1];
    if (last && last !== "index") return last;
    const prev = parts[parts.length - 2];
    if (prev) return prev;
  }

  return "";
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const docs = getAllContentlayerDocs()
      .filter((d: any) => !isDraft(d))
      .filter((d: any) => getDocKind(d) === "short");

    const paths = docs
      .map((d: any) => {
        const slug = normalizeSlugFromDoc(d);
        if (!slug) return null;
        return { params: { slug } };
      })
      .filter(Boolean) as { params: { slug: string } }[];

    return { paths, fallback: false };
  } catch (err) {
    console.error("[shorts/[slug]] getStaticPaths failed:", err);
    return { paths: [], fallback: false };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = String(params?.slug ?? "").trim();
    if (!slug) return { notFound: true };

    const docs = getAllContentlayerDocs()
      .filter((d: any) => !isDraft(d))
      .filter((d: any) => getDocKind(d) === "short");

    const doc =
      docs.find((d: any) => normalizeSlugFromDoc(d) === slug) ?? null;

    if (!doc) return { notFound: true };

    return {
      props: {
        doc,
        canonicalPath: getDocHref(doc), // should be /shorts/<slug> from your helper
        label: "Shorts",
      },
      revalidate: 3600,
    };
  } catch (err) {
    console.error("[shorts/[slug]] getStaticProps failed:", err);
    return { notFound: true };
  }
};

export default ShortReadingPage;