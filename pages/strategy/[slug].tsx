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

const StrategySlugPage: NextPage<Props> = ({ doc, canonicalPath }) => (
  <ContentlayerDocPage doc={doc} canonicalPath={canonicalPath} backHref="/strategy" label="Strategy" />
);

export const getStaticPaths: GetStaticPaths = async () => {
  assertContentlayerHasDocs("pages/strategy/[slug].tsx:getStaticPaths");

  const paths = getAllContentlayerDocs()
    .filter((d) => !isDraft(d) && getDocKind(d) === "strategy")
    .map((d) => getDocHref(d))
    .filter((href) => href.startsWith("/strategy/"))
    .map((href) => ({ params: { slug: href.replace("/strategy/", "") } }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  assertContentlayerHasDocs("pages/strategy/[slug].tsx:getStaticProps");

  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const targetUrl = `/strategy/${slug}`;

  const doc =
    getAllContentlayerDocs()
      .filter((d) => !isDraft(d) && getDocKind(d) === "strategy")
      .find((d) => getDocHref(d) === targetUrl) ?? null;

  if (!doc) return { notFound: true };

  return { props: { doc, canonicalPath: getDocHref(doc) }, revalidate: 3600 };
};

export default StrategySlugPage;