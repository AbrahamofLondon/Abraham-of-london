import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import { getAllContentlayerDocs, getDocHref } from "@/lib/contentlayer-helper";

type Props = { doc: any; canonicalPath: string; label?: string };

function joinSlugParam(slug: string | string[] | undefined) {
  if (!slug) return "";
  return Array.isArray(slug) ? slug.join("/") : slug;
}

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

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllContentlayerDocs()
    .filter((d: any) => !d?.draft)
    .filter((d: any) => String(getDocHref(d) || "").startsWith("/canon/"));

  const paths = docs.map((d: any) => {
    const href = String(getDocHref(d));
    const parts = href.replace(/^\/canon\//, "").split("/").filter(Boolean);
    return { params: { slug: parts } };
  });

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slugPath = joinSlugParam((params as any)?.slug);
  if (!slugPath) return { notFound: true };

  const docs = getAllContentlayerDocs()
    .filter((d: any) => !d?.draft)
    .filter((d: any) => String(getDocHref(d) || "").startsWith("/canon/"));

  const canonicalPath = `/canon/${slugPath}`;
  const doc = docs.find((d: any) => String(getDocHref(d)) === canonicalPath) ?? null;

  if (!doc) return { notFound: true };

  return {
    props: { doc, canonicalPath, label: "Canon" },
    revalidate: 60,
  };
};

export default CanonDocPage;