// pages/downloads.tsx
import { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import DownloadCard from "@/components/DownloadCard"; // Assuming a separate DownloadCard component
import { getAllContent } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

type DownloadsProps = InferGetStaticPropsType<typeof getStaticProps>;

export const getStaticProps: GetStaticProps = async () => {
  const allDownloads = getAllContent('downloads');
  // Sanitize data for serialization
  const downloads = allDownloads.map(dl => JSON.parse(JSON.stringify(dl)));

  return {
    props: { downloads },
    revalidate: 3600,
  };
};

export default function Downloads({ downloads }: DownloadsProps) {
  return (
    <Layout pageTitle="Downloads">
      <Head>
        <title>Downloads | Abraham of London</title>
        <meta name="description" content="All printable and downloadable resources." />
      </Head>
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-serif font-bold text-center mb-10">
          Downloads
        </h1>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {downloads.map((dl) => (
            <DownloadCard
              key={dl.slug}
              slug={dl.slug}
              title={dl.title}
              excerpt={dl.excerpt}
              coverImage={dl.coverImage}
              category={dl.category}
              readTime={dl.readTime}
            />
          ))}
        </div>
      </main>
    </Layout>
  );
}