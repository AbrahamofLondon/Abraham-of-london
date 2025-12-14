import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import { getCanonDocBySlug } from "@/lib/canon";

type Props = { doc: any; canonicalPath: string; label?: string };

const CanonSlugPage: NextPage<Props> = ({ doc, canonicalPath }) => {
  return (
    <ContentlayerDocPage
      doc={doc}
      canonicalPath={canonicalPath}
      backHref="/canon"
      label="Canon"
    />
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Import here to avoid any edge bundling weirdness
  const { allCanons } = await import("contentlayer/generated");

  const paths = (allCanons || [])
    .filter((c: any) => c && c.draft !== true && c.draft !== "true")
    .map((c: any) => ({ params: { slug: String(c.slug) } }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = String(params?.slug ?? "");
    if (!slug) return { notFound: true };

    const doc = getCanonDocBySlug(slug);
    if (!doc) return { notFound: true };

    return {
      props: {
        doc, // ✅ full doc including body.code
        canonicalPath: `/canon/${slug}`,
        label: "Canon",
      },
      revalidate: 3600,
    };
  } catch (e) {
    // This prevents Netlify's "Failed to collect page data"
    console.error("Canon slug getStaticProps error:", e);
    return { notFound: true };
  }
};

export default CanonSlugPage;