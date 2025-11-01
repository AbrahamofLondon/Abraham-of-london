// pages/resources.tsx
import { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import ResourceCard from "@/components/ResourceCard"; // Assuming you have a ResourceCard component
import { getAllContent } from "@/lib/mdx";
import type { PostMeta } from "@/types/post";

type ResourcesProps = InferGetStaticPropsType<typeof getStaticProps>;

export const getStaticProps: GetStaticProps = async () => {
  const allResources = getAllContent('resources');
  // Sanitize data for serialization
  const resources = allResources.map(res => JSON.parse(JSON.stringify(res)));

  return {
    props: { resources },
    revalidate: 3600,
  };
};

export default function Resources({ resources }: ResourcesProps) {
  return (
    <Layout pageTitle="Resources & Downloads">
      <Head>
        <title>Resources & Downloads | Abraham of London</title>
        <meta name="description" content="Downloadable guides and printable resources for family, faith, and business leadership." />
      </Head>
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-serif font-bold text-center mb-10">
          Resources & Downloads
        </h1>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((res) => (
            <ResourceCard
              key={res.slug}
              slug={res.slug}
              title={res.title}
              excerpt={res.excerpt}
              coverImage={res.coverImage}
              category={res.category}
              readTime={res.readTime}
            />
          ))}
        </div>
      </main>
    </Layout>
  );
}