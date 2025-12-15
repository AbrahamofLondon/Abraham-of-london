// pages/content/[slug].tsx - FIXED VERSION
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import ContentlayerDocPage from "@/components/ContentlayerDocPage";
import {
  getAllContentlayerDocs,
  getDocHref,
  getDocKind,
  type DocKind,
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
    default:
      return "Reading Room";
  }
}

// ✅ Helper to check draft status
function isDraftDoc(doc: any): boolean {
  const d = doc.draft;
  if (d === false || d === "false" || d === null || d === undefined) return false;
  if (d === true || d === "true") return true;
  return false;
}

// ✅ Helper to normalize slug
function normalizeSlug(doc: any): string {
  if (!doc) return "untitled";

  if (doc.slug && typeof doc.slug === "string" && doc.slug.trim()) {
    return doc.slug.trim().toLowerCase();
  }

  if (doc._raw?.flattenedPath) {
    const path = doc._raw.flattenedPath;
    const parts = path.split("/");
    const lastPart = parts[parts.length - 1];
    return lastPart === "index"
      ? parts[parts.length - 2] || lastPart
      : lastPart;
  }

  if (doc.title) {
    return doc.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 100);
  }

  return "untitled";
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allDocs = getAllContentlayerDocs();
  
  // Filter published docs that should show in /content/
  const paths = allDocs
    .filter((d) => !isDraftDoc(d))
    .map((d) => {
      const href = getDocHref(d);
      const slug = normalizeSlug(d);
      return { href, slug };
    })
    .filter(({ href }) => href.startsWith("/content/"))
    .map(({ slug }) => ({
      params: { slug },
    }));

  console.log(`[content/[slug]] Generated ${paths.length} paths`);

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim().toLowerCase();
  if (!slug) return { notFound: true };

  const allDocs = getAllContentlayerDocs();
  
  const doc = allDocs
    .filter((d) => !isDraftDoc(d))
    .find((d) => {
      const docSlug = normalizeSlug(d);
      const docHref = getDocHref(d);
      return docSlug === slug && docHref === `/content/${slug}`;
    });

  if (!doc) {
    console.log(`[content/[slug]] Not found: ${slug}`);
    return { notFound: true };
  }

  const kind = getDocKind(doc);
  const label = labelFor(kind);

  return {
    props: {
      doc,
      canonicalPath: getDocHref(doc),
      label,
    },
    revalidate: 3600,
  };
};

export default ContentReadingRoom;