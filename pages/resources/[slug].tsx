import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { allResources } from "contentlayer/generated";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import { getDocHref } from "@/lib/contentlayer-helper";

type Props = { doc: any; canonicalPath: string };

const ResourceSlugPage: NextPage<Props> = ({ doc, canonicalPath }) => {
  return (
    <ContentlayerDocPage
      doc={doc}
      canonicalPath={canonicalPath}
      backHref="/resources"
      label="Resource"
    />
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = (allResources ?? [])
    .filter((r) => !r.draft)
    .map((r) => ({ params: { slug: String(r.slug) } }))
    .filter((p) => p.params.slug && p.params.slug !== "index");

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "");
  const doc =
    (allResources ?? []).find((r) => !r.draft && String(r.slug) === slug) ?? null;

  if (!doc) return { notFound: true };

  return {
    props: { doc, canonicalPath: getDocHref(doc) },
    revalidate: 60,
  };
};

export default ResourceSlugPage;