// pages/private/frameworks/[slug].tsx
// Private preview page (UI) - optional, but clean.
// The API enforces access anyway; this page is just a shell.

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

type Props = { slug: string };

const PrivateFrameworkPreviewPage: NextPage<Props> = ({ slug }) => {
  const src = `/api/private/frameworks/${encodeURIComponent(slug)}`;

  return (
    <Layout title="Private Framework Preview">
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Private • In-House • Preview Only
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-cream">
            Framework Preview
          </h1>
          <p className="mt-2 text-sm text-gold/70">
            Streamed from private storage. Logged. Not downloadable from public paths.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-xl">
          <iframe
            title="Framework PDF Preview"
            src={src}
            className="h-[80vh] w-full"
          />
        </div>
      </main>
    </Layout>
  );
};

export default PrivateFrameworkPreviewPage;

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = String(ctx.params?.slug || "").trim();
  if (!slug) return { notFound: true };

  // Keep SSR conservative: you can choose to *not* block here and rely only on API gating.
  // But for UX, it's better to prevent the shell from rendering for non-internal users.
  // Replace with your real session validation if you can access it server-side.
  const isInternal = false;

  if (!isInternal) {
    return {
      redirect: { destination: "/access-denied", permanent: false },
    };
  }

  return { props: { slug } };
};