// pages/editorials/[slug].tsx — EDITORIAL DETAIL (Production Grade Publication Record)

import Head from "next/head";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Quote,
  ScrollText,
} from "lucide-react";

import {
  getPublicationBySlug,
  getPublicationCatalogue,
} from "@/lib/editorial/catalogue";
import type { PublicationRecord } from "@/lib/editorial/types";
import Layout from "@/components/Layout";

type Props = {
  item: PublicationRecord;
  previewHref: string | null;
  citationHref: string;
};

function Hairline() {
  return (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[30px] border border-white/12 bg-white/[0.04]",
        "shadow-[0_35px_95px_-60px_rgba(0,0,0,0.95)]",
        className,
      ].join(" ")}
    >
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-md">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
        {children}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
}

function Flag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300">
      {children}
    </div>
  );
}

const EditorialPage: NextPage<Props> = ({ item, previewHref, citationHref }) => {
  return (
    <Layout
      title={`${item.title} | Abraham of London`}
      description={item.description || item.subtitle || item.title}
      canonicalUrl={`/editorials/${item.slug}`}
      fullWidth
      className="bg-black text-white"
    >
      <Head>
        <title>{item.title} | Abraham of London</title>
        <meta
          name="description"
          content={item.description || item.subtitle || item.title}
        />
      </Head>

      <main className="min-h-screen bg-[#050505] text-white">
        <section className="relative overflow-hidden border-b border-white/5 px-6 pb-16 pt-24 md:pt-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.07),transparent_42%)]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-8">
              <Link
                href="/editorials"
                className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.30em] text-white/55 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Editorial Library
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Flag>
                <ScrollText className="h-3.5 w-3.5" />
                {item.category || "Editorial"}
              </Flag>

              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/40">
                {item.tier}
              </div>
            </div>

            <h1 className="mt-6 max-w-5xl font-serif text-5xl leading-[0.95] text-white md:text-7xl">
              {item.title}
            </h1>

            {item.subtitle ? (
              <p className="mt-5 max-w-4xl text-xl leading-relaxed text-amber-100/80">
                {item.subtitle}
              </p>
            ) : null}

            {item.description ? (
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/70">
                {item.description}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">
              <span>{item.author}</span>
              {item.date ? <span>{item.date}</span> : null}
              {item.readingTime ? <span>{item.readingTime}</span> : null}
              {item.version ? <span>v{item.version}</span> : null}
              <span>{item.contentId}</span>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {item.pdfPath ? (
                <a
                  href={item.pdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-6 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300 transition-all hover:bg-amber-500/18"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              ) : null}

              {previewHref ? (
                <a
                  href={previewHref}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/85 transition-all hover:bg-white/[0.10]"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </a>
              ) : null}

              {item.epubEnabled && item.epubPath ? (
                <a
                  href={item.epubPath}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/85 transition-all hover:bg-white/[0.10]"
                >
                  <BookOpen className="h-4 w-4" />
                  EPUB
                </a>
              ) : null}

              <a
                href={citationHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/75 transition-all hover:bg-white/[0.08]"
              >
                <ExternalLink className="h-4 w-4" />
                Citation JSON
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <Panel>
              <div className="p-7 md:p-10">
                <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-white/50">
                  Publication Record
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-amber-300/85">
                      Identity
                    </div>
                    <dl className="mt-4 space-y-3 text-sm text-white/72">
                      <div>
                        <dt className="font-semibold text-white">Author</dt>
                        <dd>{item.author}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-white">Content ID</dt>
                        <dd>{item.contentId}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-white">Tier</dt>
                        <dd>{item.tier}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-white">Category</dt>
                        <dd>{item.category || "—"}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-amber-300/85">
                      Edition
                    </div>
                    <dl className="mt-4 space-y-3 text-sm text-white/72">
                      <div>
                        <dt className="font-semibold text-white">Date</dt>
                        <dd>{item.date || "—"}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-white">Version</dt>
                        <dd>{item.version || "—"}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-white">Status</dt>
                        <dd>{item.status || "—"}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-white">Reading Time</dt>
                        <dd>{item.readingTime || "—"}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mt-8">
                  <Hairline />
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300/85">
                    <FileText className="h-4 w-4" />
                    Publication Summary
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-white/72">
                    {item.description ||
                      item.subtitle ||
                      "Formal editorial record within the Abraham of London publication library."}
                  </p>
                </div>
              </div>
            </Panel>

            <div className="space-y-8">
              <Panel>
                <div className="p-7 md:p-8">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300/85">
                    <Quote className="h-4 w-4" />
                    Citation
                  </div>

                  <p className="mt-5 text-sm leading-7 text-white/72">
                    {item.citation.citationAuthor}.{" "}
                    <em>{item.citation.citationTitle}</em>.{" "}
                    {item.citation.citationPublisher}, {item.citation.citationYear}.
                  </p>

                  <div className="mt-6 space-y-3 text-sm text-white/65">
                    <div>
                      <span className="font-semibold text-white">Canonical URL:</span>{" "}
                      {item.citation.canonicalUrl}
                    </div>
                    {item.citation.doi ? (
                      <div>
                        <span className="font-semibold text-white">DOI:</span>{" "}
                        {item.citation.doi}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6">
                    <a
                      href={citationHref}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.28em] text-white/75 transition-all hover:bg-white/[0.08]"
                    >
                      Citation JSON
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </Panel>

              <Panel>
                <div className="p-7 md:p-8">
                  <div className="text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300/85">
                    Access Surfaces
                  </div>

                  <div className="mt-5 space-y-3">
                    {item.pdfPath ? (
                      <a
                        href={item.pdfPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/78 transition hover:bg-white/[0.06]"
                      >
                        <span>PDF Edition</span>
                        <Download className="h-4 w-4 text-amber-300/80" />
                      </a>
                    ) : null}

                    {previewHref ? (
                      <a
                        href={previewHref}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/78 transition hover:bg-white/[0.06]"
                      >
                        <span>Preview Route</span>
                        <Eye className="h-4 w-4 text-amber-300/80" />
                      </a>
                    ) : null}

                    {item.epubEnabled && item.epubPath ? (
                      <a
                        href={item.epubPath}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/78 transition hover:bg-white/[0.06]"
                      >
                        <span>EPUB Edition</span>
                        <BookOpen className="h-4 w-4 text-amber-300/80" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const items = getPublicationCatalogue();

  return {
    paths: items.map((item) => ({ params: { slug: item.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const slug = typeof ctx.params?.slug === "string" ? ctx.params.slug : "";
  const item = getPublicationBySlug(slug);

  if (!item) {
    return { notFound: true };
  }

  const previewHref =
    item.previewEnabled && item.previewPath
      ? item.previewPath
      : item.previewEnabled
        ? `/api/editorials/preview/${item.slug}`
        : null;

  return {
    props: {
      item,
      previewHref,
      citationHref: `/api/editorials/citation/${item.slug}`,
    },
    revalidate: 1800,
  };
};

export default EditorialPage;