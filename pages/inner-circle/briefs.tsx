/* pages/inner-circle/briefs.tsx — INTEGRATED INTELLIGENCE PORTAL (75 ASSETS) */
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { 
  Search, 
  Filter, 
  ShieldAlert, 
  Download, 
  Lock, 
  FileText,
  Activity
} from "lucide-react";

import Layout from "@/components/Layout";
import { useToast } from "@/hooks/useToast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// Leveraging the central registry for production consistency
import { BRIEF_REGISTRY, BriefEntry } from "@/lib/briefs/registry";

const IntelligenceBriefsPage: NextPage = () => {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  // State Management
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string>("All");
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  // Categories derived from the 75 entries for dynamic filtering
  const categories = ["All", ...Array.from(new Set(BRIEF_REGISTRY.map(b => b.series)))];

  /**
   * PRODUCTION SECURE RETRIEVAL
   * Authorizes the user via API and triggers a signed-URL download
   */
  const handleDownload = async (briefId: string, title: string) => {
    setDownloadingId(briefId);
    toast.info("Authorizing Access", `Generating encrypted token for Vol. ${briefId}`);

    try {
      const response = await fetch("/api/inner-circle/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId }),
      });

      const data = await response.json();

      if (data.downloadUrl) {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.setAttribute("download", `${title.replace(/\s+/g, '_')}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Transmission Started", "Asset retrieved successfully.");
      } else {
        throw new Error("Unauthorized");
      }
    } catch (error) {
      toast.error("Encryption Error", "Verification failed. Check clearance levels.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Systematic Filtering Logic
  const filteredBriefs = BRIEF_REGISTRY.filter((brief) => {
    const matchesSearch = brief.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          brief.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === "All" || brief.series === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (status === "loading") return <LoadingSpinner size="lg" message="Decrypting Portal..." />;

  return (
    <ErrorBoundary>
      <Layout title="Briefing Room">
        <Head>
          <title>Intelligence Portfolio | 75 Assets</title>
        </Head>

        <main className="min-h-screen bg-[#050505] text-zinc-400 pb-32">
          {/* 1. Dashboard Header */}
          <div className="relative border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl px-8 py-16">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Activity size={12} className="text-emerald-500" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-500">
                    Connection: Secured // {session?.user?.email}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                <div>
                  <h1 className="text-5xl md:text-6xl font-serif text-white italic tracking-tight mb-4">
                    Intelligence Portfolio
                  </h1>
                  <p className="text-zinc-500 max-w-xl text-lg font-light leading-relaxed">
                    Accessing <span className="text-white font-medium">{BRIEF_REGISTRY.length} verified dispatches</span>. 
                    Strategically watermarked for institutional integrity.
                  </p>
                </div>

                <div className="w-full lg:w-auto space-y-4">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Filter 75 assets..." 
                      className="w-full lg:w-96 bg-black border border-white/10 rounded-xl pl-12 pr-6 py-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Dynamic Filtering Tabs */}
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar border-b border-white/5">
              <Filter size={14} className="text-zinc-600 flex-shrink-0" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeCategory === cat 
                    ? "bg-white text-black" 
                    : "bg-white/5 text-zinc-500 hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3. The Briefing Grid */}
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBriefs.map((brief) => (
                <div 
                  key={brief.id} 
                  className="group relative flex flex-col bg-zinc-900/20 border border-white/5 rounded-2xl p-8 hover:bg-zinc-900/40 hover:border-amber-500/20 transition-all duration-500"
                >
                  <div className="flex justify-between items-start mb-8">
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest border-b border-zinc-800 pb-1">
                      VOL. {brief.volume.toString().padStart(2, '0')}
                    </span>
                    {brief.classification === "Restricted" ? (
                      <ShieldAlert size={16} className="text-rose-500" />
                    ) : (
                      <Lock size={16} className="text-amber-500/50" />
                    )}
                  </div>

                  <h3 className="text-xl font-serif text-white italic mb-4 group-hover:text-amber-500 transition-colors leading-snug">
                    {brief.title}
                  </h3>
                  
                  <p className="text-sm text-zinc-500 font-light leading-relaxed mb-10 line-clamp-3">
                    {brief.abstract}
                  </p>

                  <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase tracking-widest text-zinc-700 font-bold">Latency</span>
                      <span className="text-[11px] font-mono text-zinc-400">{brief.readingTime}</span>
                    </div>
                    
                    <button 
                      onClick={() => handleDownload(brief.id, brief.title)}
                      disabled={!!downloadingId}
                      className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:text-amber-500 transition-all disabled:opacity-30"
                    >
                      {downloadingId === brief.id ? "Authorizing..." : "Retrieve"}
                      <Download size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredBriefs.length === 0 && (
              <div className="py-40 text-center">
                <p className="text-zinc-600 font-serif italic text-lg">No intelligence assets found matching these parameters.</p>
              </div>
            )}
          </div>
        </main>
      </Layout>
    </ErrorBoundary>
  );
};

export default IntelligenceBriefsPage;