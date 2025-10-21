// pages/strategy/[slug].tsx
import * as React from "react";
import Head from "next/head";
import type { GetStaticPaths, GetStaticProps } from "next";
import { allStrategies, type Strategy } from "contentlayer/generated";
import MDXRenderer from "@/components/MDXRenderer";

type Props = { strategy: Strategy };

export default function StrategyPage({ strategy }: Props) {
  return (
    <>
      <Head>
        <title>{strategy.title} — Abraham of London</title>
        {strategy.description && <meta name="description" content={strategy.description} />}
        {strategy.ogDescription && <meta property="og:description" content={strategy.ogDescription} />}
      </Head>

      <article className="prose lg:prose-lg mx-auto px-4 py-10">
        <h1>{strategy.title}</h1>

        {(strategy.date || strategy.author) && (
          <p className="text-sm text-gray-600">
            {strategy.author ?? ""}
            {strategy.author && strategy.date ? " • " : ""}
            {strategy.date ?? ""}
          </p>
        )}

        <MDXRenderer code={strategy.body?.code ?? ""} />
      </article>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: allStrategies
    .filter((s) => !!s.slug)
    .map((s) => ({ params: { slug: s.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const strategy = allStrategies.find((s) => s.slug === slug);
  if (!strategy) return { notFound: true };
  return { props: { strategy } };
};
