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

const DownloadSlugPage: NextPage<Props> = ({ doc, canonicalPath }) => (
  <ContentlayerDocPage doc={doc} canonicalPath={canonicalPath} backHref="/downloads" label="Download" />
);

export const getStaticPaths: GetStaticPaths = async () => {
  assertContentlayerHasDocs("pages/downloads/[slug].tsx:getStaticPaths");

  const paths = getAllContentlayerDocs()
    .filter((d) => !isDraft(d) && getDocKind(d) === "download")
    .map((d) => getDocHref(d))
    .filter((href) => href.startsWith("/downloads/"))
    .map((href) => ({ params: { slug: href.replace("/downloads/", "") } }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  assertContentlayerHasDocs("pages/downloads/[slug].tsx:getStaticProps");

  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const targetUrl = `/downloads/${slug}`;

  const doc =
    getAllContentlayerDocs()
      .filter((d) => !isDraft(d) && getDocKind(d) === "download")
      .find((d) => getDocHref(d) === targetUrl) ?? null;

  if (!doc) return { notFound: true };

  return { props: { doc, canonicalPath: getDocHref(doc) }, revalidate: 3600 };
};

export default DownloadSlugPage;