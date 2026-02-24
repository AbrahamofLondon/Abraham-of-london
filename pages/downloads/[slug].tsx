/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { 
  ArrowLeft, 
  Lock, 
  Download as DownloadIcon, 
  Calendar, 
  FileText, 
  AlertCircle 
} from "lucide-react";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { allDownloads } from "contentlayer/generated";
import { sanitizeData } from "@/lib/content/shared";

interface Props {
  download: any;
  isPublic: boolean;
  initialBodyCode: string | null;
}

const DownloadSlugPage: NextPage<Props> = ({ download, isPublic, initialBodyCode }) => {
  const [unlockedCode, setUnlockedCode] = React.useState<string | null>(initialBodyCode);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // High-performance hydration of the pre-compiled MDX code
  const MDXContent = useMDXComponent(unlockedCode || "");

  const handleUnlock = async () => {
    setLoading(true);
    setError(null);
    try {
      // Using slugSafe for the API request path
      const res = await fetch(`/api/downloads/${download.slugSafe}`);
      const data = await res.json();
      
      if (data.ok && data.bodyCode) {
        setUnlockedCode(data.bodyCode);
      } else {
        setError(data.reason || "Clearance verification failed.");
      }
    } catch (err) {
      setError("System connection interrupted.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={download.titleSafe}>
      <Head>
        <title>{download.titleSafe} | Vault | Abraham of London</title>
        <meta name="robots" content={isPublic ? "index,follow" : "noindex,nofollow"} />
      </Head>

      <div className="min-h-screen bg-zinc-950 text-white selection:bg-amber-500/30">
        {/* INSTITUTIONAL NAV */}
        <div className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link href="/downloads" className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-amber-500 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Return to Vault
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-16">
            
            <main className="lg:col-span-8 space-y-12">
              <header>
                <div className="flex items-center gap-4 mb-6">
                  <span className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-mono uppercase tracking-widest">
                    {download.classification || "Unclassified"}
                  </span>
                  <span className="text-zinc-600 text-[9px] font-mono uppercase tracking-widest">
                    {download.readTimeSafe}
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-serif italic font-bold leading-tight">
                  {download.titleSafe}
                </h1>
                {download.excerptSafe && (
                  <p className="mt-8 text-xl text-zinc-400 font-light leading-relaxed border-l border-amber-500/30 pl-8">
                    {download.excerptSafe}
                  </p>
                )}
              </header>

              <section className="relative min-h-[400px]">
                {unlockedCode ? (
                  <article className="prose prose-invert prose-amber max-w-none animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <MDXContent components={mdxComponents as any} />
                  </article>
                ) : (
                  <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-12 text-center backdrop-blur-sm">
                    <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 mb-6">
                      <Lock className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-serif italic mb-4">Classified Intelligence</h2>
                    <p className="text-zinc-500 max-w-md mx-auto mb-8 text-sm">
                      Access Level: <span className="text-amber-500 uppercase">{download.accessLevelSafe}</span>. 
                      Verify institutional clearance to view the full brief.
                    </p>
                    
                    {error && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm justify-center animate-shake">
                        <AlertCircle className="w-4 h-4" /> {error}
                      </div>
                    )}

                    <button 
                      onClick={handleUnlock}
                      disabled={loading}
                      className="px-8 py-4 bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-amber-400 transition-all disabled:opacity-50 active:scale-95"
                    >
                      {loading ? "Decrypting..." : "Unlock Manuscript"}
                    </button>
                  </div>
                )}
              </section>
            </main>

            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-zinc-900/80 border border-white/5 rounded-3xl p-8 sticky top-32">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-8">Asset Intel</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-2 uppercase tracking-tighter">
                      <Calendar className="w-4 h-4" /> Released
                    </span>
                    <span className="font-medium">{download.date || "2026"}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-2 uppercase tracking-tighter">
                      <FileText className="w-4 h-4" /> Volume
                    </span>
                    <span className="font-medium">{download.volumeNumber || "N/A"}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-2 uppercase tracking-tighter">
                      <Shield className="w-4 h-4" /> Integrity
                    </span>
                    <span className="text-emerald-500 font-mono">VERIFIED</span>
                  </div>
                </div>

                {unlockedCode && (download.downloadUrl || download.file) && (
                  <a 
                    href={download.downloadUrl || download.file} 
                    className="mt-10 flex items-center justify-center gap-3 w-full py-4 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-black transition-all"
                  >
                    <DownloadIcon className="w-4 h-4" /> Obtain PDF Archive
                  </a>
                )}
              </div>
            </aside>

          </div>
        </div>
      </div>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  DATA LAYER (SSR ALIGNED TO ROBUST SCHEMA)
----------------------------------------------------------------------------- */
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = String(params?.slug);
  
  // Lookup using your slugSafe computed field
  const doc = allDownloads.find((d: any) => d.slugSafe === slug);

  if (!doc || doc.draftSafe) return { notFound: true };

  // Alignment with your asAccessLevel helper in contentlayer.config.ts
  const isPublic = doc.accessLevelSafe === "public";

  return {
    props: sanitizeData({
      download: doc,
      isPublic,
      // Only serve the payload immediately if the schema confirms it's public
      initialBodyCode: isPublic ? doc.body.code : null,
    }),
  };
};

export default DownloadSlugPage;