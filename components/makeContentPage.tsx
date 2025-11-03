// components/makeContentPage.tsx (FINAL CLEANED VERSION)
import * as React from "react";
import Head from "next/head";
import { MDXRenderer } from "./MDXRenderer"; 
import { MDXRemoteProps } from "next-mdx-remote";
import Layout from "@/components/Layout";
import type { PostMeta } from "@/types/post";

export interface ContentDocument {
  title: string;
  description?: string;
  excerpt?: string;
  body?: { code: string };
}
export type MdxComponents = MDXRemoteProps['components'];
export interface MakeContentPageOptions {
  titleSuffix?: string;
  components?: MdxComponents; 
}
export function makeContentPage<T extends ContentDocument>(
  opts: MakeContentPageOptions = {} 
) {
  const { 
    titleSuffix = "Abraham of London", 
    components 
  } = opts;
  const ContentPage = ({ doc }: { doc: T }) => {
    const metaDescription = doc.description || doc.excerpt;
    return (
      <Layout pageTitle={doc.title}>
        <Head>
          <title>{doc.title} — {titleSuffix}</title>
          {metaDescription && <meta name="description" content={metaDescription} />}
        </Head>
        <article className="prose lg:prose-lg mx-auto px-4 py-10">
          <h1>{doc.title}</h1>
          {doc.body?.code && <MDXRenderer code={doc.body.code} components={components} />}
        </article>
      </Layout>
    );
  };
  ContentPage.displayName = 'ContentPageWrapper';
  return ContentPage;
}
