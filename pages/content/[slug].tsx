import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import {
  getAllContentlayerDocs,
  getDocHref,
  getDocKind,
  isDraft,
  normalizeSlug,
} from "@/lib/contentlayer-helper";

type Props = {
  doc: any;
  canonicalPath: string;
  label: string;
};

const ContentReadingRoom: NextPage<Props> = ({ doc, canonicalPath, label }) => {
  return (
    <ContentlayerDocPage
      doc={doc}
      canonicalPath={canonicalPath}
      backHref="/content"
      label={label}
    />
  );
};

function labelFor(doc: any): string {
  switch (getDocKind(doc)) {
    case "strategy":
      return "Strategy";
    case "resource":
      return "Resource";
    case "print":
      return "Print";
    default:
      return "Reading Room";
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllContentlayerDocs()
    .filter((d) => !isDraft(d))
    .map((d) => getDocHref(d))
    .filter((href) => href.startsWith("/content/"))
    .map((href) => ({
      params: { slug: href.replace("/content/", "") },
    }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const doc = getAllContentlayerDocs()
    .filter((d) => !isDraft(d))
    .find(
      (d) =>
        getDocHref(d) === `/content/${slug}` &&
        normalizeSlug(d) === slug
    );

  if (!doc) return { notFound: true };

  return {
    props: {
      doc,
      canonicalPath: getDocHref(doc),
      label: labelFor(doc),
    },
    revalidate: 3600,
  };
};

export default ContentReadingRoom;