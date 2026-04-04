/* pages/playbooks/[slug].tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { allPlaybooks } from "contentlayer/generated";
import type { Playbook } from "contentlayer/generated";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import {
  CalendarDays,
  Clock,
  BookOpen,
  Layers,
  List,
  AlertCircle,
} from "lucide-react";

interface PlaybookPageProps {
  playbook: Playbook;
  renderCode: string;
}

const difficultyColors = {
  beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  intermediate: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  advanced: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  executive: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const typeColors = {
  diagnostic: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  execution: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  correction: "bg-red-500/10 text-red-400 border-red-500/20",
  strategic: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  operational: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function looksLikeLeakedModuleCode(code: string): boolean {
  const s = safeString(code).trim();
  if (!s) return false;

  return (
    /\bObject\.defineProperty\s*\(\s*exports\b/.test(s) ||
    /\bmodule\.exports\b/.test(s) ||
    /\bexports\.[A-Za-z_$]/.test(s) ||
    /\b__esModule\b/.test(s) ||
    /\brequire\s*\(/.test(s) ||
    /\bjsx_runtime\b/.test(s) ||
    /\bvar\s+\w+\s*=\s*Object\.create/.test(s)
  );
}

function pickRenderablePlaybookCode(playbook: Playbook): string {
  const compiled = safeString((playbook as any)?.body?.code);
  const raw = safeString((playbook as any)?.body?.raw);

  if (compiled && !looksLikeLeakedModuleCode(compiled)) {
    return compiled;
  }

  if (raw) {
    return raw;
  }

  return compiled || "";
}

const PlaybookPage: NextPage<PlaybookPageProps> = ({ playbook, renderCode }) => {
  return (
    <Layout
      title={playbook.title}
      description={playbook.description}
      className="bg-black text-white"
      canonicalUrl={`/playbooks/${playbook.slug}`}
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen bg-black text-white">
        <div className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent" />

          <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-32 lg:px-8 lg:pb-20 lg:pt-36">
            <div className="mb-6 flex flex-wrap gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-[8px] font-mono uppercase tracking-wider ${
                  typeColors[
                    playbook.playbookType as keyof typeof typeColors
                  ] || "border-white/10 text-white/40"
                }`}
              >
                {playbook.playbookType || "Playbook"}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-[8px] font-mono uppercase tracking-wider ${
                  difficultyColors[
                    playbook.difficulty as keyof typeof difficultyColors
                  ] || "border-white/10 text-white/40"
                }`}
              >
                {playbook.difficulty || "Advanced"}
              </span>

              {playbook.tier === "premium" && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[8px] font-mono uppercase tracking-wider text-amber-400">
                  Premium
                </span>
              )}
            </div>

            <h1 className="text-5xl font-light tracking-tight text-white md:text-6xl lg:text-7xl">
              {playbook.title}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-relaxed text-white/60">
              {playbook.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-6 border-t border-white/10 pt-6">
              {playbook.estimatedTime && (
                <div className="flex items-center gap-2 text-sm text-white/40">
                  <Clock className="h-4 w-4" />
                  <span>{playbook.estimatedTime}</span>
                </div>
              )}

              {playbook.date && (
                <div className="flex items-center gap-2 text-sm text-white/40">
                  <CalendarDays className="h-4 w-4" />
                  <span>{new Date(playbook.date).toLocaleDateString()}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-white/40">
                <BookOpen className="h-4 w-4" />
                <span>Playbook</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
          {playbook.framework && (
            <div className="mb-12 border-l-2 border-amber-500/50 py-2 pl-6">
              <p className="mb-2 text-sm uppercase tracking-wider text-white/40">
                Core Framework
              </p>
              <p className="text-xl text-white/80">{playbook.framework}</p>
            </div>
          )}

          {playbook.phases?.length > 0 && (
            <div className="mb-12">
              <div className="mb-6 flex items-center gap-2">
                <Layers className="h-5 w-5 text-amber-500" />
                <h2 className="text-2xl font-light text-white">Execution Phases</h2>
              </div>
              <div className="grid gap-4">
                {playbook.phases.map((phase, idx) => (
                  <div key={idx} className="border border-white/10 p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 font-mono text-sm text-amber-400">
                        {idx + 1}
                      </span>
                      <span className="text-white/90">{phase}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {playbook.signals?.length > 0 && (
            <div className="mb-12">
              <div className="mb-6 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <h2 className="text-2xl font-light text-white">Detection Signals</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {playbook.signals.map((signal, idx) => (
                  <div key={idx} className="border-l-2 border-amber-500/30 py-2 pl-4">
                    <span className="text-sm text-white/80">{signal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {playbook.outputs?.length > 0 && (
            <div className="mb-12">
              <div className="mb-6 flex items-center gap-2">
                <List className="h-5 w-5 text-amber-500" />
                <h2 className="text-2xl font-light text-white">Outputs</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {playbook.outputs.map((output, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span className="text-sm text-white/70">{output}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {playbook.prerequisites?.length > 0 && (
            <div className="mb-12 border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-sm font-mono uppercase tracking-wider text-amber-400">
                Prerequisites
              </h3>
              <ul className="space-y-2">
                {playbook.prerequisites.map((req, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-sm text-white/60"
                  >
                    <span className="h-1 w-1 rounded-full bg-amber-500" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {playbook.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-6">
              {playbook.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-white/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-12">
            <SafeMDXRenderer code={renderCode} />
          </div>
        </div>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: allPlaybooks.map((playbook) => ({
      params: { slug: playbook.slug },
    })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PlaybookPageProps> = async ({
  params,
}) => {
  const slug = safeString(params?.slug);
  const playbook = allPlaybooks.find((p) => p.slug === slug);

  if (!playbook) {
    return { notFound: true };
  }

  return {
    props: {
      playbook,
      renderCode: pickRenderablePlaybookCode(playbook),
    },
    revalidate: 3600,
  };
};

export default PlaybookPage;