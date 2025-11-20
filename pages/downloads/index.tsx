// pages/downloads/index.tsx

import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import DownloadCard from "@/components/downloads/DownloadCard";
import { getAllDownloads } from "@/lib/downloads";

type NormalisedDownload = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  fileHref: string | null;
  category: string | null;
  size: string | null;
  tags: string[]; // always an array, never undefined
  date: string | null;
};

type DownloadsIndexProps = {
  downloads: NormalisedDownload[];
};

function normaliseDownload(raw: any): NormalisedDownload {
  const slug = String(raw?.slug ?? "").trim() || "untitled";
  const title = String(raw?.title ?? "Untitled download");

  const excerpt =
    typeof raw?.excerpt === "string" && raw.excerpt.trim().length
      ? raw.excerpt
      : typeof raw?.description === "string" && raw.description.trim().length
      ? raw.description
      : null;

  const coverImage =
    typeof raw?.coverImage === "string" && raw.coverImage.trim().length
      ? raw.coverImage
      : null;

  const fileHrefCandidate =
    typeof raw?.downloadFile === "string" && raw.downloadFile.trim().length
      ? raw.downloadFile
      : typeof raw?.fileUrl === "string" && raw.fileUrl.trim().length
      ? raw.fileUrl
      : null;

  // Normalise to a web path if it's clearly a public download
  const fileHref =
    fileHrefCandidate && fileHrefCandidate.startsWith("/")
      ? fileHrefCandidate
      : fileHrefCandidate;

  const size =
    typeof raw?.fileSize === "string" && raw.fileSize.trim().length
      ? raw.fileSize
      : null;

  const category =
    typeof raw?.category === "string" && raw.category.trim().length
      ? raw.category
      : typeof raw?.type === "string" && raw.type.trim().length
      ? raw.type
      : null;

  const tags = Array.isArray(raw?.tags)
    ? raw.tags.filter((t: unknown) => typeof t === "string" && t.trim().length)
    : [];

  const date =
    typeof raw?.date === "string" && raw.date.trim().length
      ? raw.date
      : null;

  return {
    slug,
    title,
    excerpt,
    coverImage,
    fileHref,
    category,
    size,
    tags,
    date,
  };
}

/* -------------------------------------------------------------------------- */
/*  getStaticProps                                                            */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<DownloadsIndexProps> = async () => {
  try {
    const all = getAllDownloads();
    const downloads = all.map((d) => normaliseDownload(d));

    return {
      props: {
        downloads,
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Error in getStaticProps for /downloads:", error);
    // Fail soft: render page with empty list
    return {
      props: {
        downloads: [],
      },
      revalidate: 3600,
    };
  }
};

/* -------------------------------------------------------------------------- */
/*  Page component                                                            */
/* -------------------------------------------------------------------------- */

export default function DownloadsIndexPage(
  props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const title = "Downloads";
  const description =
    "Curated tools, cue cards, briefs, and print-ready resources from Abraham of London.";

  return (
    <Layout title={title}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} | Abraham of London`} />
        <meta property="og:description" content={description} />
      </Head>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-serif font-semibold text-deepCharcoal md:text-5xl">
            Downloads
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            A growing library of print-ready assets, cue cards, and strategy
            tools. Access direct links from blog posts and book pages while we
            roll out the full catalogue view.
          </p>
        </header>

        {/* If you want to keep the old "How to access resources" block, keep it here */}
        {props.downloads.length === 0 ? (
          <section className="rounded-2xl border border-lightGrey bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold text-deepCharcoal">
              How to access resources
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>
                Open any blog post or book page and follow the{" "}
                <strong>Related Resources</strong> section.
              </li>
              <li>
                Each card links to a dedicated{" "}
                <span className="font-mono text-sm">/downloads/[slug]</span>{" "}
                page with a primary download button.
              </li>
              <li>
                If you&apos;re looking for something specific, use the contact
                page and we&apos;ll point you to the right asset.
              </li>
            </ul>
          </section>
        ) : (
          <section className="space-y-6">
            <div className="rounded-2xl border border-lightGrey bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-xl font-semibold text-deepCharcoal">
                Strategic Assets
              </h2>
              <p className="text-sm text-gray-700">
                Cue cards, scripture tracks, and court-ready tools, all
                optimised for print and real-world use.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {props.downloads.map((dl) => (
                <DownloadCard
                  key={dl.slug}
                  slug={dl.slug}
                  title={dl.title}
                  excerpt={dl.excerpt}
                  coverImage={dl.coverImage}
                  fileHref={dl.fileHref}
                  category={dl.category}
                  size={dl.size ?? undefined}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}