/* pages/inner-circle/briefs/index.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  FileText,
  Clock,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { allBriefs } from "contentlayer/generated";

import Layout from "@/components/layout/Layout";
import WorkspaceNav from "@/components/inner-circle/WorkspaceNav";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";

type BriefListItem = {
  id: string;
  slug: string;
  title: string;
  classification: string;
  category: string;
  date: string | null;
  readingTime: string;
};

type Props = {
  briefs: BriefListItem[];
};

const BriefingRoom: NextPage<Props> = ({ briefs }) => {
  const [search, setSearch] = React.useState("");

  const activeBriefs = React.useMemo(() => {
    const q = search.toLowerCase();
    return briefs.filter((b) => b.title.toLowerCase().includes(q));
  }, [briefs, search]);

  return (
    <Layout title="Briefing Room | Abraham of London">
      <main className="min-h-screen bg-black px-6 py-24 text-zinc-300">
        <div className="mx-auto max-w-7xl">
          <WorkspaceNav />
          <header className="mb-16 border-b border-zinc-900 pb-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  Live Intelligence Feed
                </div>

                <h1 className="mb-4 text-5xl font-serif font-bold italic text-white md:text-6xl">
                  The Briefing Room
                </h1>

                <p className="max-w-2xl font-serif italic text-zinc-500">
                  Accessing a portfolio of {briefs.length} intelligence briefs. All data is encrypted and subject to institutional oversight.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="group relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-amber-500"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search Dossiers..."
                    className="w-full rounded-sm border border-zinc-800 bg-zinc-950 py-3 pl-12 pr-6 text-xs uppercase tracking-widest focus:border-amber-500/50 focus:outline-none md:w-64"
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button className="border border-zinc-800 bg-zinc-950 p-3 transition-colors hover:border-zinc-600">
                  <Filter size={16} />
                </button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeBriefs.map((brief, idx) => (
              <Link key={brief.id} href={`/inner-circle/briefs/${brief.slug}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                  className="group relative h-full cursor-pointer overflow-hidden border border-zinc-900 bg-zinc-950 p-6 transition-all hover:border-amber-500/30"
                >
                  <div className="mb-6 flex items-start justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-tighter text-zinc-600">
                      Ref: {brief.id.slice(-8).toUpperCase()}
                    </span>
                    <span className="border border-zinc-800 px-2 py-0.5 text-[8px] font-bold text-zinc-500">
                      {brief.classification}
                    </span>
                  </div>

                  <h3 className="mb-4 text-lg font-serif italic leading-snug text-white transition-colors group-hover:text-amber-400">
                    {brief.title}
                  </h3>

                  <div className="mt-auto flex items-center gap-4 border-t border-zinc-900/50 pt-6">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500">
                      <Clock size={12} />
                      {brief.readingTime}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500">
                      <FileText size={12} />
                      {brief.category}
                    </div>
                  </div>

                  <div className="pointer-events-none absolute inset-0 bg-amber-500/[0.02] opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute bottom-6 right-6 translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                    <ChevronRight className="text-amber-500" size={20} />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          <footer className="mt-24 flex flex-col items-center justify-between gap-8 border-t border-zinc-900 pt-12 md:flex-row">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                <ShieldAlert size={14} className="text-amber-900" />
                Protocol: AES-256
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                Node: London-Prime
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-700">
              © 2026 Abraham of London • Unauthorized access is strictly prohibited.
            </div>
          </footer>
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const sessionId = readAccessCookie(context.req as any);

  if (!sessionId) {
    return {
      redirect: {
        destination: `/inner-circle?returnTo=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  const ctx = await getSessionContext(sessionId);

  if (!ctx.ok || !ctx.valid || !tierAtLeast(ctx.tier, "inner-circle")) {
    return {
      redirect: {
        destination: "/inner-circle/locked",
        permanent: false,
      },
    };
  }

  const briefs = allBriefs
    .filter((b: any) => !b?.draft)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((brief: any) => ({
      id: brief._id || crypto.randomUUID(),
      slug: String(brief.slug || brief._raw?.flattenedPath || "").replace(/^\/+/, ""),
      title: brief.title,
      classification: brief.classification || "CONFIDENTIAL",
      category: brief.category || "Strategic",
      date: brief.date || null,
      readingTime: brief.readingTime?.text || "12 MIN",
    }));

  return {
    props: { briefs },
  };
};

export default BriefingRoom;
