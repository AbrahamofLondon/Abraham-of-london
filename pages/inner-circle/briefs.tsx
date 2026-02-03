/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { Search, Filter, ShieldAlert, Download, Lock, Activity } from "lucide-react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/useToast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { BRIEF_REGISTRY } from "@/lib/briefs/registry";

const IntelligenceBriefsPage: NextPage = () => {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string>("All");
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const categories = ["All", ...Array.from(new Set(BRIEF_REGISTRY.map(b => b.series)))];

  const handleDownload = async (briefId: string, title: string) => {
    setDownloadingId(briefId);
    toast.info("Authorizing Access", "Verifying institutional clearance...");

    try {
      const response = await fetch("/api/inner-circle/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId }),
      });

      if (!response.ok) throw new Error("Unauthorized");
      const data = await response.json();

      if (data.downloadUrl) {
        window.location.href = data.downloadUrl;
        toast.success("Transmission Started", "Asset retrieved.");
      }
    } catch (error) {
      toast.error("Access Denied", "Insufficient clearance for this asset.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredBriefs = BRIEF_REGISTRY.filter((brief) => {
    const matchesSearch = brief.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || brief.series === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (status === "loading") return <LoadingSpinner size="lg" message="Decrypting Portal..." />;

  return (
    <ErrorBoundary>
      <Layout title="Briefing Room">
        <Head><title>Intelligence Portfolio | 75 Assets</title></Head>
        <main className="min-h-screen bg-[#050505] text-zinc-400 pb-32">
          <div className="relative border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl px-8 py-16">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit mb-4">
                <Activity size={12} className="text-emerald-500" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-500">
                  Secured // {session?.user?.email}
                </span>
              </div>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                <div>
                  <h1 className="text-5xl md:text-6xl font-serif text-white italic tracking-tight mb-4">Intelligence Portfolio</h1>
                  <p className="text-zinc-500 max-w-xl text-lg font-light">Accessing <span className="text-white font-medium">{BRIEF_REGISTRY.length} verified dispatches</span>.</p>
                </div>
                <div className="relative w-full lg:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search 75 assets..." 
                    className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-6 py-4 text-sm text-white outline-none focus:border-amber-500/50"
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
              <Filter size={14} className="text-zinc-600" />
              {categories.map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeCategory === cat ? "bg-white text-black" : "bg-white/5 text-zinc-500 hover:bg-white/10"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBriefs.map((brief) => (
              <div key={brief.id} className="group relative bg-zinc-900/20 border border-white/5 rounded-2xl p-8 hover:border-amber-500/20 transition-all">
                <div className="flex justify-between items-start mb-8">
                  <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">VOL. {brief.volume}</span>
                  {brief.classification === "Restricted" ? <ShieldAlert size={16} className="text-rose-500" /> : <Lock size={16} className="text-amber-500/50" />}
                </div>
                <h3 className="text-xl font-serif text-white italic mb-4 group-hover:text-amber-500 transition-colors">{brief.title}</h3>
                <p className="text-sm text-zinc-500 font-light mb-10 line-clamp-3">{brief.abstract}</p>
                <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">{brief.readingTime}</span>
                  <button 
                    onClick={() => handleDownload(brief.id, brief.title)}
                    disabled={!!downloadingId}
                    className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white hover:text-amber-500 transition-all"
                  >
                    {downloadingId === brief.id ? "Authorizing..." : "Retrieve"} <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </Layout>
    </ErrorBoundary>
  );
};

export default IntelligenceBriefsPage;