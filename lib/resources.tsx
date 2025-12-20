import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import {
  getAllContentlayerDocs,
  getDocHref,
  getDocKind,
  isDraft,
  normalizeSlug,
} from "@/lib/contentlayer-helper";

type Props = { doc: any; canonicalPath: string };

const ResourceSlugPage: NextPage<Props> = ({ doc, canonicalPath }) => {
  return (
    <ContentlayerDocPage
      doc={doc}
      canonicalPath={canonicalPath}
      backHref="/resources"
      label="Resources"
    />
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllContentlayerDocs()
    .filter((d) => !isDraft(d))
    .filter((d) => getDocKind(d) === "resource")
    .map((d) => getDocHref(d))
    .filter((href) => href.startsWith("/resources/"))
    .map((href) => ({ params: { slug: [href.replace("/resources/", "")] } }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const arr = (params as any)?.slug;
  const slug = Array.isArray(arr) ? String(arr[arr.length - 1] ?? "").trim() : "";
  if (!slug) return { notFound: true };

  const doc =
    getAllContentlayerDocs()
      .filter((d) => !isDraft(d))
      .find((d) => getDocKind(d) === "resource" && normalizeSlug(d) === slug) ?? null;

  if (!doc) return { notFound: true };

  return {
    props: { doc, canonicalPath: getDocHref(doc) },
    revalidate: 3600,
  };
};

export default ResourceSlugPage;