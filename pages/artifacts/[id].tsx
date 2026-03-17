import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Layout from "@/components/Layout";
import DownloadButton from "@/components/premium/DownloadButton";
import {
  getPremiumContentById,
  type PremiumContentItem,
} from "@/lib/premium/content-registry";

type Props = {
  item: PremiumContentItem | null;
};

function safeStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const rawId = typeof ctx.params?.id === "string" ? ctx.params.id : "";
  const id = safeStr(rawId);
  const item = id ? getPremiumContentById(id) : null;

  return {
    props: {
      item,
    },
  };
};

function getAssetType(
  item: PremiumContentItem,
): "brief" | "framework" | "report" | "intelligence" | "editorial" | "toolkit" | "deck" {
  const mime = safeStr(item.asset.mimeType).toLowerCase();
  const cat = String(item.categorySlug || item.category || "").toLowerCase();

  if (mime.includes("presentationml")) return "deck";
  if (cat.includes("editorial")) return "editorial";
  if (cat.includes("framework")) return "framework";
  if (cat.includes("report")) return "report";
  if (cat.includes("toolkit")) return "toolkit";
  if (cat.includes("brief")) return "brief";
  return "intelligence";
}

function getFormatLabel(item: PremiumContentItem): string {
  const mime = safeStr(item.asset.mimeType).toLowerCase();
  const filename = safeStr(item.asset.filename).toLowerCase();

  if (mime.includes("presentationml") || filename.endsWith(".pptx")) {
    return "PowerPoint";
  }
  if (mime.includes("pdf") || filename.endsWith(".pdf")) {
    return "PDF";
  }
  if (mime.includes("zip") || filename.endsWith(".zip")) {
    return "ZIP";
  }
  if (mime.includes("wordprocessingml") || filename.endsWith(".docx")) {
    return "DOCX";
  }

  return "Artifact";
}

export default function ArtifactDetailPage({
  item,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  if (!item) {
    return (
      <Layout>
        <Head>
          <title>Artifact Not Found | Abraham of London</title>
        </Head>

        <main className="min-h-screen bg-[#050609] px-6 py-24 text-white">
          <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-white/[0.03] p-10">
            <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-amber-300/70">
              Artifacts
            </div>
            <h1 className="mt-4 font-serif text-3xl text-white/95">
              Asset not found
            </h1>
            <p className="mt-4 max-w-2xl text-white/65">
              The requested artifact does not exist in the current premium
              registry.
            </p>
          </div>
        </main>
      </Layout>
    );
  }

  const coverImage =
    safeStr(item.metadata?.coverImage) ||
    "/assets/images/artifacts/global-market-intelligence-q1-2026-cover.jpg";

  const classification = item.metadata?.classification || "PUBLIC";
  const tierLabel = item.metadata?.watermarkRequired
    ? "Traceable distribution"
    : item.asset.mimeType?.includes("presentationml")
      ? "Controlled distribution"
      : "Open circulation";

  return (
    <Layout>
      <Head>
        <title>{item.title} | Artifacts | Abraham of London</title>
        <meta name="description" content={item.description} />
      </Head>

      <main className="min-h-screen bg-[#050609] text-white">
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.10),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_26%)]" />
          <div className="absolute inset-0 opacity-[0.06] aol-grain" />

          <div className="relative mx-auto max-w-6xl px-6 py-20 md:px-10">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="overflow-hidden rounded-[30px] border border-white/10 bg-black shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
                  <div className="relative h-[280px] md:h-[420px]">
                    <img
                      src={coverImage}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

                    <div className="absolute left-6 top-6 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-amber-300/90">
                        Artifact
                      </span>
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-white/65">
                        {classification}
                      </span>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
                        {item.metadata?.productLine || item.category}
                      </div>

                      <h1 className="font-serif text-3xl leading-tight text-white/95 md:text-5xl">
                        {item.title}
                      </h1>

                      {item.subtitle ? (
                        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/68 md:text-base">
                          {item.subtitle}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-8">
                  <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-amber-300/75">
                    Asset Briefing
                  </div>

                  <p className="mt-5 text-base leading-8 text-white/70">
                    {item.description}
                  </p>

                  {item.tags.length > 0 ? (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/55"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-8">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                        Document ID
                      </div>
                      <div className="mt-2 text-white/82">
                        {item.metadata?.docId || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                        Revision
                      </div>
                      <div className="mt-2 text-white/82">
                        {item.metadata?.version || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                        Classification
                      </div>
                      <div className="mt-2 text-white/82">{classification}</div>
                    </div>

                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                        Format
                      </div>
                      <div className="mt-2 text-white/82">
                        {getFormatLabel(item)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                        File Size
                      </div>
                      <div className="mt-2 text-white/82">
                        {item.fileSize || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                        Pages
                      </div>
                      <div className="mt-2 text-white/82">
                        {item.asset.pageCount || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <DownloadButton
                  contentId={item.id}
                  assetTitle={item.title}
                  assetType={getAssetType(item)}
                  classification={classification}
                  tierLabel={tierLabel}
                  fileName={item.asset.filename || `${item.id}.bin`}
                  maxDownloads={item.metadata?.maxDownloads || 1}
                  usedCount={0}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}