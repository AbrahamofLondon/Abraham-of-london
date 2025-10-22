// pages/strategy/[slug].tsx
import * as React from "react";
import Head from "next/head";
import type { GetStaticPaths, GetStaticProps } from "next";
import { allStrategies, type Strategy } from "contentlayer/generated";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { mdxComponents as components } from "@/components/MdxComponents";

type Props = { doc: Strategy };

export default function StrategyPage({ doc }: Props) {
  const MDX = useMDXComponent(doc.body.code);

  return (
    <>
      <Head>
        <title>{doc.title} — Abraham of London</title>
        {doc.description && <meta name="description" content={doc.description} />}
        {doc.ogDescription && <meta property="og:description" content={doc.ogDescription} />}
      </Head>

      <article className="prose lg:prose-lg mx-auto px-4 py-10">
        <header className="mb-6">
          <h1 className="mt-0">{doc.title}</h1>
          {(doc.author || doc.date) && (
            <p className="m-0 text-sm text-gray-600">
              {doc.author ?? ""}{doc.author && doc.date ? " • " : ""}{doc.date ?? ""}
            </p>
          )}
          {doc.description && <p className="mt-2 text-lg text-gray-700">{doc.description}</p>}
        </header>

        <MDX components={components} />
      </article>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: allStrategies
      .filter((s) => !!s.slug)
      .map((s) => ({ params: { slug: s.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const doc = allStrategies.find((s) => s.slug === slug);
  if (!doc) return { notFound: true };
  return { props: { doc } };
};
