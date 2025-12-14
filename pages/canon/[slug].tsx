// pages/canon/[slug].tsx
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import {
  getAllContentlayerDocs,
  getDocHref,
  getDocKind,
  isDraft,
} from "@/lib/contentlayer-helper";

type Props = { doc: any; canonicalPath: string; label?: string };

const CanonDocPage: NextPage<Props> = ({ doc, canonicalPath }) => {
  return (
    <ContentlayerDocPage
      doc={doc}
      canonicalPath={canonicalPath}
      backHref="/canon"
      label="Canon"
    />
  );
};

function slugOf(d: any): string {
  const s = typeof d?.slug === "string" ? d.slug.trim() : "";
  if (s) return s;

  const fp = typeof d?._raw?.flattenedPath === "string" ? d._raw.flattenedPath : "";
  if (fp) {
    const parts = fp.split("/");
    const last = parts[parts.length - 1];
    if (last && last !== "index") return last;
    return parts[parts.length - 2] ?? "";
  }
  return "";
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const docs = getAllContentlayerDocs()
      .filter((d: any) => !isDraft(d))
      .filter((d: any) => getDocKind(d) === "canon");

    const paths = docs
      .map((d: any) => {
        const slug = slugOf(d);
        return slug ? { params: { slug } } : null;
      })
      .filter(Boolean) as { params: { slug: string } }[];

    return { paths, fallback: false };
  } catch (e) {
    console.error("[canon/[slug]] getStaticPaths failed:", e);
    return { paths: [], fallback: false };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = String(params?.slug ?? "").trim();
    if (!slug) return { notFound: true };

    const docs = getAllContentlayerDocs()
      .filter((d: any) => !isDraft(d))
      .filter((d: any) => getDocKind(d) === "canon");

    const doc = docs.find((d: any) => slugOf(d) === slug) ?? null;
    if (!doc) return { notFound: true };

    return {
      props: {
        doc,
        canonicalPath: getDocHref(doc), // should be /canon/<slug>
        label: "Canon",
      },
      revalidate: 3600,
    };
  } catch (e) {
    console.error("[canon/[slug]] getStaticProps failed:", e);
    return { notFound: true };
  }
};

export default CanonDocPage;