import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useMDXComponent } from "next-contentlayer/hooks";
import { ArrowLeft, Calendar, Clock, Download } from "lucide-react";

type DocLike = {
  title?: string | null;
  description?: string | null;
  excerpt?: string | null;
  subtitle?: string | null;
  date?: string | null;
  readTime?: string | null;
  coverImage?: string | null;
  image?: string | null;
  tags?: string[] | null;
  category?: string | null;
  author?: string | null;
  downloadUrl?: string | null;
  fileUrl?: string | null;
  body?: { code: string };
};

function fmtDate(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const FALLBACK_IMAGE = "/assets/images/writing-desk.webp";

export default function ContentlayerDocPage({
  doc,
  canonicalPath,
  backHref,
  label,
}: {
  doc: DocLike;
  canonicalPath: string;
  backHref?: string;
  label?: string;
}) {
  const MDX = useMDXComponent(doc.body?.code ?? "");

  const title = doc.title ?? "Untitled";
  const description = doc.description ?? doc.excerpt ?? "";
  const date = fmtDate(doc.date ?? null);

  const cover =
    doc.coverImage?.trim() ||
    doc.image?.trim() ||
    FALLBACK_IMAGE;

  const downloadUrl = doc.downloadUrl ?? doc.fileUrl ?? null;

  return (
    <>
      <Head>
        <link rel="canonical" href={canonicalPath} />
        {description ? <meta name="description" content={description} /> : null}
        <meta property="og:title" content={title} />
        {description ? <meta property="og:description" content={description} /> : null}
        {cover ? <meta property="og:image" content={cover} /> : null}
        <meta property="og:url" content={canonicalPath} />
        <meta property="og:type" content="article" />
      </Head>

      {/* Timeless, “royal invite” without shouting about it */}
      <main className="min-h-screen bg-white">
        {/* Subtle parchment + gilt edge illusion */}
        <div className="relative border-b border-neutral-200">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.10)_0%,transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(212,175,55,0.06),transparent_18%,transparent_82%,rgba(212,175,55,0.06))]" />
          <div className="relative mx-auto max-w-5xl px-6 py-10 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <Link
                href={backHref ?? "/content"}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700 shadow-sm backdrop-blur-sm transition hover:border-neutral-300 hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>

              {label ? (
                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-700 shadow-sm backdrop-blur-sm">
                  {label}
                </span>
              ) : null}
            </div>

            <header className="mt-10">
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
                {title}
              </h1>

              {(doc.subtitle || description) ? (
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-neutral-700">
                  {doc.subtitle ?? description}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-neutral-600">
                {doc.author ? (
                  <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 font-medium">
                    {doc.author}
                  </span>
                ) : null}

                {doc.category ? (
                  <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 font-medium">
                    {doc.category}
                  </span>
                ) : null}

                {date ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 font-medium">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    {date}
                  </span>
                ) : null}

                {doc.readTime ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 font-medium">
                    <Clock className="h-4 w-4 text-neutral-400" />
                    {doc.readTime}
                  </span>
                ) : null}

                {downloadUrl ? (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 font-semibold text-amber-800 transition hover:bg-amber-100"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                ) : null}
              </div>

              {doc.tags && doc.tags.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {doc.tags.slice(0, 8).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </header>
          </div>
        </div>

        {/* “Invitation card” body */}
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
          <article className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_40px_120px_rgba(0,0,0,0.08)]">
            {/* Fine borderwork */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-6 rounded-2xl border border-neutral-100" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(212,175,55,0.10),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(0,0,0,0.04),transparent_40%)]" />
            </div>

            {/* Optional cover */}
            {cover ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-neutral-200 bg-neutral-50">
                <Image
                  src={cover}
                  alt={title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 960px"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.20),transparent_55%)]" />
              </div>
            ) : null}

            <div className="relative px-6 py-10 sm:px-10 sm:py-12">
              <div className="prose prose-neutral max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-headings:scroll-mt-28 prose-a:text-amber-700 prose-a:no-underline hover:prose-a:underline">
                <MDX />
              </div>
            </div>
          </article>
        </div>
      </main>
    </>
  );
}