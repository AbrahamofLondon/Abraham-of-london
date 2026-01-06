import * as React from "react";
import { useEffect, useState } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowRight, BookOpen, Lock, Shield, TrendingUp, Users, Zap, CheckCircle, AlertTriangle, Calendar } from "lucide-react";

import Layout from "@/components/Layout";
import { getFrameworkBySlug, getAllFrameworkSlugs, type Framework, type FrameworkTier } from "@/lib/resources/strategic-frameworks";
import { getInnerCircleAccess, type AccessState } from "@/lib/inner-circle/access";
function normalizeSlugParam(input: unknown): string {
  if (Array.isArray(input)) return input.filter(Boolean).join("/").trim();
  return String(input ?? "").trim();
}


type PageProps = {
  framework: Framework;
  isPreview?: boolean;
};

const tierIcon: Record<FrameworkTier, React.ReactNode> = {
  Board: <Shield className="h-4 w-4" />,
  Founder: <Zap className="h-4 w-4" />,
  Household: <Users className="h-4 w-4" />,
};

const accentBg: Record<Framework["accent"], string> = {
  gold: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  rose: "bg-rose-500/10 border-rose-500/30 text-rose-400",
  indigo: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
};

const FrameworkDetailPage: NextPage<PageProps> = ({ framework, isPreview = false }) => {
  const router = useRouter();
  const [access, setAccess] = useState<AccessState>(() => ({
    hasAccess: false,
    ok: false,
    reason: "missing",
    token: null,
    checkedAt: new Date(),
  }));

  useEffect(() => {
    setAccess(getInnerCircleAccess());
  }, []);

  const canViewFull = access.hasAccess || isPreview;

  const scrollToLocked = (id: string) => {
    if (canViewFull) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/inner-circle/locked?returnTo=${encodeURIComponent(router.asPath)}`);
    }
  };

  return (
    <Layout title={`${framework.title} | Strategic Framework`} description={framework.oneLiner}>
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/resources/strategic-frameworks" className="text-sm text-gray-400 hover:text-white">← Back to frameworks</Link>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${accentBg[framework.accent]}`}>{framework.tag}</span>
              <h1 className="mt-4 font-serif text-5xl font-bold">{framework.title}</h1>
              <p className="mt-4 text-xl text-gray-300">{framework.oneLiner}</p>
            </div>
          </div>
        </section>
        {/* Dossier Content Section */}
        <section id="full-dossier" className="border-t border-white/10 py-16">
           <div className="mx-auto max-w-7xl px-4">
             {!canViewFull && (
               <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center">
                 <Lock className="mx-auto mb-4 h-12 w-12" />
                 <h3 className="text-xl font-bold">Dossier Locked</h3>
                 <button onClick={() => scrollToLocked("full-dossier")} className="mt-6 rounded-full bg-amber-500 px-8 py-3 font-bold text-black">Unlock Inner Circle</button>
               </div>
             )}
           </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const allSlugs = getAllFrameworkSlugs();

  const filtered = allSlugs
    .map((s) => String(s || "").trim().toLowerCase())
    .filter((s) => s && s !== "strategic-frameworks" && s !== "index" && !s.includes("replace"))
    .map((s) => s.split("/").filter(Boolean).pop())
    .filter(Boolean);

  // De-dupe
  const unique = Array.from(new Set(filtered));

  return {
    paths: unique.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const slugParam = (params as any)?.slug;
  const slug = Array.isArray(slugParam) ? slugParam.join("/") : String(slugParam ?? "");
  const normalized = slug.trim().toLowerCase();

  // Prevent internal route collisions / reserved slugs
  if (!normalized || normalized === "strategic-frameworks" || normalized === "index" || normalized.includes("replace")) {
    return { notFound: true };
  }

  const framework = getFrameworkBySlug(normalized);
  if (!framework) return { notFound: true };

  return {
    props: { framework },
    revalidate: 3600,
  };
};

export default FrameworkDetailPage;