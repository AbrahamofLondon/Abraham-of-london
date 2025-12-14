// pages/shorts/[slug].tsx
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import {
  getAllContentlayerDocs,
  getDocHref,
  getDocKind,
  isDraft,
} from "@/lib/contentlayer-helper";

type Props = { doc: any; canonicalPath: string; label?: string };

const ShortReadingPage: NextPage<Props> = ({ doc, canonicalPath }) => {
  return (
    <ContentlayerDocPage
      doc={doc}
      canonicalPath={canonicalPath}
      backHref="/shorts"
      label="Shorts"
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
      .filter((d: any) => getDocKind(d) === "short");

    const paths = docs
      .map((d: any) => {
        const slug = slugOf(d);
        return slug ? { params: { slug } } : null;
      })
      .filter(Boolean) as { params: { slug: string } }[];

    return { paths, fallback: false };
  } catch (e) {
    console.error("[shorts/[slug]] getStaticPaths failed:", e);
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

    const doc = docs.find((d: any) => slugOf(d) === slug) ?? null;
    if (!doc) return { notFound: true };

    return {
      props: {
        doc,
        canonicalPath: getDocHref(doc), // /shorts/<slug>
        label: "Shorts",
      },
      revalidate: 3600,
    };
  } catch (e) {
    console.error("[shorts/[slug]] getStaticProps failed:", e);
    return { notFound: true };
  }
};

export default ShortReadingPage;