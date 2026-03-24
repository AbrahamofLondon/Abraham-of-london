import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import {
  getAllContentlayerDocs,
  getDocHref,
  getDocKind,
  isDraft,
  normalizeSlug,
} from "@/lib/content";

type Props = {
  doc: any;
  canonicalPath: string;
  mdxRaw?: string;
};

function getDocSlug(doc: any): string {
  return (
    doc?.slug ||
    doc?._raw?.flattenedPath ||
    doc?.slugComputed ||
    doc?.id ||
    ""
  );
}

const ResourceSlugPage: NextPage<Props> = ({ doc, canonicalPath, mdxRaw }) => {
  return (
    <ContentlayerDocPage
      doc={doc}
      canonicalPath={canonicalPath}
      backHref="/resources"
      label="Resources"
      mdxRaw={mdxRaw}
    />
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const paths = getAllContentlayerDocs()
      .filter((d) => !isDraft(d))
      .filter((d) => getDocKind(d) === "resource")
      .map((d) => getDocHref(d))
      .filter((href) => href.startsWith("/resources/"))
      .map((href) => ({
        params: { slug: [href.replace("/resources/", "")] },
      }));

    return { paths, fallback: false };
  } catch (error) {
    console.error("Error generating static paths for resources:", error);
    return { paths: [], fallback: false };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const arr = (params as any)?.slug;
    const slug =
      Array.isArray(arr) ? String(arr[arr.length - 1] ?? "").trim() : "";

    if (!slug) return { notFound: true };

    const doc =
      getAllContentlayerDocs()
        .filter((d) => !isDraft(d))
        .find((d) => {
          if (getDocKind(d) !== "resource") return false;

          const docSlug = getDocSlug(d);
          const normalizedDocSlug = normalizeSlug(docSlug);

          return normalizedDocSlug === slug;
        }) ?? null;

    if (!doc) return { notFound: true };

    return {
      props: {
        doc,
        canonicalPath: getDocHref(doc),
        mdxRaw: doc?.body?.raw ?? doc?.content ?? "",
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Error in getStaticProps for resource:", params?.slug, error);
    return { notFound: true };
  }
};

export default ResourceSlugPage;