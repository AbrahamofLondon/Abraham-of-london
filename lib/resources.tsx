import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { serialize } from "next-mdx-remote/serialize";
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
  source: any;
};

const ResourceSlugPage: NextPage<Props> = ({ doc, canonicalPath, source }) => {
  return (
    <ContentlayerDocPage
      doc={doc}
      canonicalPath={canonicalPath}
      backHref="/resources"
      label="Resources"
      source={source}
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
      .map((href) => ({ params: { slug: [href.replace("/resources/", "")] } }));

    return { paths, fallback: false };
  } catch (error) {
    console.error("Error generating static paths for resources:", error);
    return { paths: [], fallback: false };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const arr = (params as any)?.slug;
    const slug = Array.isArray(arr) ? String(arr[arr.length - 1] ?? "").trim() : "";
    if (!slug) return { notFound: true };

    const doc =
      getAllContentlayerDocs()
        .filter((d) => !isDraft(d))
        .find((d) => getDocKind(d) === "resource" && normalizeSlug(d) === slug) ?? null;

    if (!doc) return { notFound: true };

    // Extract content from doc
    const content = doc.body?.raw || doc.body?.code || doc.content || "";
    
    // Serialize MDX content
    const source = await serialize(content, {
      mdxOptions: {
        development: process.env.NODE_ENV === "development",
      },
    });

    return {
      props: { 
        doc, 
        canonicalPath: getDocHref(doc),
        source,
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Error in getStaticProps for resource:", params?.slug, error);
    return { notFound: true };
  }
};

export default ResourceSlugPage;