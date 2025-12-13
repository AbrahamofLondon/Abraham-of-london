import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { allDownloads } from "contentlayer/generated";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import { getDocHref } from "@/lib/contentlayer-helper";

type Props = { doc: any; canonicalPath: string };

const DownloadSlugPage: NextPage<Props> = ({ doc, canonicalPath }) => {
  return (
    <ContentlayerDocPage
      doc={doc}
      canonicalPath={canonicalPath}
      backHref="/downloads"
      label="Download"
    />
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = (allDownloads ?? [])
    .filter((d) => !d.draft)
    .map((d) => ({ params: { slug: String(d.slug) } }))
    .filter((p) => p.params.slug && p.params.slug !== "index");

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "");
  const doc =
    (allDownloads ?? []).find((d) => !d.draft && String(d.slug) === slug) ?? null;

  if (!doc) return { notFound: true };

  return {
    props: { doc, canonicalPath: getDocHref(doc) },
    revalidate: 60,
  };
};

export default DownloadSlugPage;