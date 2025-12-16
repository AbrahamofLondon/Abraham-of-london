import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import {
  assertContentlayerHasDocs,
  getAllContentlayerDocs,
  getDocHref,
  getDocKind,
  type DocKind,
  isDraft,
} from "@/lib/contentlayer-helper";

type Props = { doc: any; canonicalPath: string; label: string };

const ContentReadingRoom: NextPage<Props> = ({ doc, canonicalPath, label }) => (
  <ContentlayerDocPage doc={doc} canonicalPath={canonicalPath} backHref="/content" label={label} />
);

function labelFor(kind: DocKind): string {
  switch (kind) {
    case "strategy":
      return "Strategy";
    case "resource":
      return "Resource";
    case "print":
      return "Print";
    case "post":
      return "Essay";
    case "book":
      return "Book";
    case "download":
      return "Download";
    case "canon":
      return "Canon";
    case "short":
      return "Short";
    default:
      return "Reading Room";
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  assertContentlayerHasDocs("pages/content/[slug].tsx:getStaticPaths");

  const paths = getAllContentlayerDocs()
    .filter((d) => !isDraft(d))
    .map((d) => getDocHref(d))
    .filter((href) => href.startsWith("/content/"))
    .map((href) => ({ params: { slug: href.replace("/content/", "") } }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  assertContentlayerHasDocs("pages/content/[slug].tsx:getStaticProps");

  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const targetUrl = `/content/${slug}`;

  const doc =
    getAllContentlayerDocs()
      .filter((d) => !isDraft(d))
      .find((d) => getDocHref(d) === targetUrl) ?? null;

  if (!doc) return { notFound: true };

  const kind = getDocKind(doc);

  return {
    props: { doc, canonicalPath: getDocHref(doc), label: labelFor(kind) },
    revalidate: 3600,
  };
};

export default ContentReadingRoom;