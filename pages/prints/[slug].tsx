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

const PrintSlugPage: NextPage<Props> = ({ doc, canonicalPath }) => {
  return (
    <ContentlayerDocPage
      doc={doc}
      canonicalPath={canonicalPath}
      backHref="/prints"
      label="Print"
    />
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllContentlayerDocs()
    .filter((d) => !isDraft(d))
    .filter((d) => getDocKind(d) === "print")
    .map((d) => getDocHref(d))
    .filter((href) => href.startsWith("/prints/"))
    .map((href) => ({ params: { slug: href.replace("/prints/", "") } }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const doc =
    getAllContentlayerDocs()
      .filter((d) => !isDraft(d))
      .find((d) => getDocKind(d) === "print" && normalizeSlug(d) === slug) ?? null;

  if (!doc) return { notFound: true };

  return {
    props: { doc, canonicalPath: getDocHref(doc) },
    revalidate: 3600,
  };
};

export default PrintSlugPage;