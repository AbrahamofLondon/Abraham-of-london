import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { allPrints } from "contentlayer/generated";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import { getDocHref } from "@/lib/contentlayer-helper";

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
  const paths = (allPrints ?? [])
    .filter((p) => !p.draft)
    .map((p) => ({ params: { slug: String(p.slug) } }))
    .filter((p) => p.params.slug && p.params.slug !== "index");

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "");
  const doc =
    (allPrints ?? []).find((p) => !p.draft && String(p.slug) === slug) ?? null;

  if (!doc) return { notFound: true };

  return {
    props: { doc, canonicalPath: getDocHref(doc) },
    revalidate: 60,
  };
};

export default PrintSlugPage;