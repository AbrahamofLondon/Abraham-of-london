/* eslint-disable @typescript-eslint/no-explicit-any */
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Layout from "@/components/Layout";
import { prisma } from "@/lib/prisma";

import { useMDXComponent } from "next-contentlayer2/hooks"; 

import { allBriefs } from "contentlayer/generated";

interface BriefPageProps {
  brief: any;
  recommendations: any[];
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = allBriefs.map((b) => ({
    params: { slug: b.slug },
  }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<BriefPageProps> = async ({ params }) => {
  const slug = params?.slug as string;
  const doc = allBriefs.find((b) => b.slug === slug);

  if (!doc) return { notFound: true };

  const vaultData = await prisma.contentMetadata.findUnique({
    where: { slug },
    include: {
      dependencies: { include: { targetBrief: true } },
    },
  });

  let recommendations: any[] = [];
  if (vaultData?.id) {
    // Strategic Semantic Search using pgvector
    recommendations = await prisma.$queryRawUnsafe(`
      SELECT slug, title, "contentType", 1 - (embedding <=> (SELECT embedding FROM "ContentMetadata" WHERE id = $1)) as similarity
      FROM "ContentMetadata"
      WHERE id != $1 AND embedding IS NOT NULL
      ORDER BY similarity DESC LIMIT 3
    `, vaultData.id);
  }

  return {
    props: {
      brief: { ...doc, vault: vaultData },
      recommendations: JSON.parse(JSON.stringify(recommendations)),
    },
    revalidate: 3600,
  };
};

const BriefPage: NextPage<BriefPageProps> = ({ brief, recommendations }) => {
  const MDXContent = useMDXComponent(brief.body.code);

  return (
    <Layout title={brief.title}>
      <main className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12 border-b border-emerald-900/20 pb-8">
            <div className="text-emerald-600 font-mono text-[10px] uppercase tracking-widest mb-4">
              Classification: {brief.vault?.classification || "RESTRICTED"}
            </div>
            <h1 className="text-5xl font-serif italic text-white">{brief.title}</h1>
          </header>

          <article className="prose prose-invert prose-emerald max-w-none mb-20">
            <MDXContent />
          </article>

          {/* Strategic Discovery Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/5 pt-12">
            <div>
              <h3 className="text-emerald-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-6">Strategic Dependencies</h3>
              <div className="space-y-4">
                {brief.vault?.dependencies && brief.vault.dependencies.length > 0 ? (
                  brief.vault.dependencies.map((dep: any) => (
                    <Link key={dep.targetBrief.slug} href={`/vault/${dep.targetBrief.slug}`} className="block p-4 bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all">
                      <span className="text-zinc-200 text-sm">{dep.targetBrief.title}</span>
                    </Link>
                  ))
                ) : (
                  <div className="text-zinc-800 font-mono text-[9px] uppercase tracking-widest">No dependencies recorded.</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-emerald-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-6">Semantic Discovery</h3>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <Link key={rec.slug} href={`/vault/${rec.slug}`} className="block p-4 bg-emerald-950/5 border border-emerald-900/20 hover:border-emerald-500/50 transition-all">
                    <span className="text-zinc-400 text-[9px] uppercase block mb-1">{rec.contentType}</span>
                    <span className="text-zinc-200 text-sm">{rec.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default BriefPage;