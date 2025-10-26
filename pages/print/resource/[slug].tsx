// pages/print/resource/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { allResources } from "contentlayer/generated";
import BrandFrame from "@/components/print/BrandFrame";

type Props = {
  title: string;
  subtitle?: string | null;
  author?: string | null;
  date?: string | null;
  bodyCode: string;
};

export default function PrintResourcePage({
  title,
  subtitle,
  author,
  date,
  bodyCode,
}: Props) {
  const MDX = useMDXComponent(
    bodyCode || "export default function X(){return null}"
  );

  return (
    <>
      <Head>
        <title>{title} â€” Print</title>
        <meta name="robots" content="noindex" />
      </Head>
      <BrandFrame
        title={title}
        subtitle={subtitle ?? ""}
        author={author ?? ""}
        date={date ?? ""}
        pageSize="A4"
      >
        <article className="prose max-w-none">
          <MDX />
        </article>
      </BrandFrame>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = allResources
    .filter((r) => !!r.slug)
    .map((r) => ({ params: { slug: r.slug! } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const doc = allResources.find((r) => r.slug === slug);
  if (!doc) return { notFound: true };

  return {
    props: {
      title: doc.title,
      subtitle: (doc as any).excerpt ?? (doc as any).description ?? null,
      author: (doc as any).author ?? null,
      date: (doc as any).date ?? null,
      bodyCode: (doc as any).body?.code ?? "",
    },
    revalidate: 60,
  };
};

