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

const ResourceSlugPage: NextPage<Props> = ({ doc, canonicalPath }) => (
  <ContentlayerDocPage doc={doc} canonicalPath={canonicalPath} backHref="/resources" label="Resource" />
);

export const getStaticPaths: GetStaticPaths = async () => {
  assertContentlayerHasDocs("pages/resources/[...slug].tsx:getStaticPaths");

  const paths = getAllContentlayerDocs()
    .filter((d) => !isDraft(d) && getDocKind(d) === "resource")
    .map((d) => getDocHref(d))
    .filter((href) => href.startsWith("/resources/"))
    .map((href) => {
      const rest = href.replace("/resources/", "");
      const parts = rest.split("/").filter(Boolean);
      return { params: { slug: parts } };
    });

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  assertContentlayerHasDocs("pages/resources/[...slug].tsx:getStaticProps");

  const slugParam = params?.slug;
  const parts = Array.isArray(slugParam)
    ? slugParam.map(String)
    : [String(slugParam ?? "")];

  const rest = parts.filter(Boolean).join("/").trim();
  if (!rest) return { notFound: true };

  const targetUrl = `/resources/${rest}`;

  const doc =
    getAllContentlayerDocs()
      .filter((d) => !isDraft(d) && getDocKind(d) === "resource")
      .find((d) => getDocHref(d) === targetUrl) ?? null;

  if (!doc) return { notFound: true };

  return { props: { doc, canonicalPath: getDocHref(doc) }, revalidate: 3600 };
};

export default ResourceSlugPage;