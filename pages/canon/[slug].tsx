import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import {
  assertContentlayerHasDocs,
  getAllContentlayerDocs,
  getDocHref,
  getDocKind,
  isDraft,
} from "@/lib/contentlayer-helper";

type Props = { doc: any; canonicalPath: string };

const ShortSlugPage: NextPage<Props> = ({ doc, canonicalPath }) => (
  <ContentlayerDocPage doc={doc} canonicalPath={canonicalPath} backHref="/shorts" label="Shorts" />
);

export const getStaticPaths: GetStaticPaths = async () => {
  assertContentlayerHasDocs("pages/shorts/[slug].tsx:getStaticPaths");

  const paths = getAllContentlayerDocs()
    .filter((d) => !isDraft(d) && getDocKind(d) === "short")
    .map((d) => getDocHref(d))
    .filter((href) => href.startsWith("/shorts/"))
    .map((href) => ({ params: { slug: href.replace("/shorts/", "") } }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  assertContentlayerHasDocs("pages/shorts/[slug].tsx:getStaticProps");

  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const targetUrl = `/shorts/${slug}`;

  const doc =
    getAllContentlayerDocs()
      .filter((d) => !isDraft(d) && getDocKind(d) === "short")
      .find((d) => getDocHref(d) === targetUrl) ?? null;

  if (!doc) return { notFound: true };

  return { props: { doc, canonicalPath: getDocHref(doc) }, revalidate: 3600 };
};

export default ShortSlugPage;