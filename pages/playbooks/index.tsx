/* pages/playbooks/index.tsx — PLAYBOOKS INDEX (Institutional Grade) */

import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  Workflow,
  ArrowRight,
  ShieldCheck,
  Layers,
  Clock3,
  Wrench,
  Target,
} from "lucide-react";

import Layout from "@/components/Layout";

type PlaybookItem = {
  slug: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  playbookType: string | null;
  estimatedTime: string | null;
};

function safeStr(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export const getStaticProps: GetStaticProps<{
  items: PlaybookItem[];
}> = async () => {
  try {
    const generated: any = await import("contentlayer/generated");
    const raw = Array.isArray(generated?.allPlaybooks) ? generated.allPlaybooks : [];

    const items: PlaybookItem[] = raw
      .filter((p: any) => !p?.draft)
      .map((p: any) => ({
        slug: safeStr(p?.slug),
        title: safeStr(p?.title, "Untitled Playbook"),
        description: safeStr(p?.description) || null,
        difficulty: safeStr(p?.difficulty) || null,
        playbookType: safeStr(p?.playbookType) || null,
        estimatedTime: safeStr(p?.estimatedTime) || null,
      }))
      .filter((p: PlaybookItem) => !!p.slug)
      .sort((a, b) => a.title.localeCompare(b.title));

    return {
      props: { items },
      revalidate: 1800,
    };
  } catch {
    return {
      props: { items: [] },
      revalidate: 1800,
    };
  }
};

const PlaybooksPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ items }) => {
  return (
    <Layout
      title="Playbooks | Abraham of London"
      description="Execution-grade systems for diagnosing drift, restoring integrity, and correcting organisational failure modes."
      canonicalUrl="/playbooks"
      fullWidth
      className="bg-black text-white"
    >
      <Head>
        <title>Playbooks | Abraham of London</title>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen bg-[#050505] text-white">
        <section className="relative overflow-hidden border-b border-white/5 px-6 pb-20 pt-28 md:pt-36">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.08),transparent_45%)]" />
          <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />

          <div className="relative mx-auto max-w-7xl">
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.36em] text-amber-300/90">
              <Workflow className="h-4 w-4" />
              Execution Systems
            </div>

            <h1 className="mt-6 max-w-5xl font-serif text-5xl leading-[0.95] text-white md:text-7xl lg:text-8xl">
              Institutional
              <span className="ml-3 italic text-amber-200/90">Playbooks.</span>
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-white/65">
              These are not guides. They are structured operating systems for diagnosing drift,
              correcting failure modes, restoring alignment, and enforcing execution discipline.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.28em] text-white/70">
                <Layers className="h-4 w-4 text-amber-300" />
                System-first
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.28em] text-white/70">
                <ShieldCheck className="h-4 w-4 text-amber-300" />
                Operator-grade
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.28em] text-white/70">
                <Target className="h-4 w-4 text-amber-300" />
                Built for consequence
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          {items.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-12 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/35">
                No playbooks indexed
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.slug}
                  className="group rounded-[2rem] border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-amber-500/30 hover:bg-white/[0.05]"
                >
                  <div className="p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/85">
                        <Wrench className="h-3.5 w-3.5" />
                        {item.playbookType || "Playbook"}
                      </div>

                      {item.difficulty ? (
                        <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/40">
                          {item.difficulty}
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-6 font-serif text-2xl leading-tight text-white transition-colors group-hover:text-amber-100">
                      {item.title}
                    </h2>

                    {item.description ? (
                      <p className="mt-4 text-sm leading-relaxed text-white/65">
                        {item.description}
                      </p>
                    ) : null}

                    <div className="mt-6 flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-3.5 w-3.5 text-amber-300/75" />
                        {item.estimatedTime || "Execution asset"}
                      </span>
                    </div>

                    <div className="mt-8">
                      <Link
                        href={`/playbooks/${encodeURIComponent(item.slug)}`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[10px] font-mono uppercase tracking-[0.28em] text-white/85 transition-all hover:bg-white/[0.10]"
                      >
                        Open Playbook
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default PlaybooksPage;