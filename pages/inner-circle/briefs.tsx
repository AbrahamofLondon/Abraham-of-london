/* pages/inner-circle/briefs.tsx — SECURE ACCESS PORTAL FOR INTELLIGENCE ASSETS */
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/useToast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// Types for the intelligence assets
interface Brief {
  id: string;
  codeName: string;
  title: string;
  category: "Geopolitical" | "Economic" | "Technological" | "Special Ops";
  classification: "Level 1" | "Level 2" | "Level 3";
  summary: string;
  fileSize: string;
  publishedAt: string;
}

const IntelligenceBriefsPage: NextPage = () => {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [briefs, setBriefs] = React.useState<Brief[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Simulated internal database of the 75 briefs 
  // (In production, this would be fetched from /api/briefs)
  React.useEffect(() => {
    const fetchBriefs = async () => {
      setLoading(true);
      try {
        // Mock data representing the growing portfolio
        const mockBriefs: Brief[] = Array.from({ length: 75 }).map((_, i) => ({
          id: `brief-${i + 1}`,
          codeName: `PROJECT_${100 + i}`,
          title: `Intelligence Report ${i + 1}: Global Market Analysis`,
          category: i % 4 === 0 ? "Geopolitical" : "Economic",
          classification: i % 10 === 0 ? "Level 3" : "Level 1",
          summary: "Comprehensive strategic analysis regarding emerging trends and systematic risks.",
          fileSize: "4.2 MB",
          publishedAt: new Date(2025, 10, i + 1).toISOString(),
        }));
        setBriefs(mockBriefs);
      } catch (error) {
        toast.error("Retrieval Error", "Failed to sync with intelligence database.");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") fetchBriefs();
  }, [status, toast]);

  const handleDownload = async (briefId: string, codeName: string) => {
    setDownloadingId(briefId);
    toast.info("Authorizing", `Generating secure download token for ${codeName}...`);

    try {
      // Secure API call to generate a signed, one-time URL
      const response = await fetch("/api/inner-circle/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId }),
      });

      const data = await response.json();

      if (data.downloadUrl) {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.setAttribute("download", `${codeName}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Transfer Started", "Asset is being transmitted to your local device.");
      } else {
        throw new Error("Access Denied");
      }
    } catch (error) {
      toast.error("Encryption Error", "Unauthorized access attempt or link expired.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredBriefs = briefs.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.codeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading") return <LoadingSpinner size="lg" message="Decrypting Portal..." />;

  if (status === "unauthenticated") {
    return (
      <Layout title="Restricted Access">
        <div className="flex h-screen items-center justify-center bg-black px-4">
          <div className="text-center max-w-lg">
            <h1 className="text-4xl font-black text-white mb-4 tracking-tighter">RESTRICTED AREA</h1>
            <p className="text-zinc-500 mb-8">Access to the Intelligence Portfolio requires active Inner Circle membership and Tier 2 clearance.</p>
            <button className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-all">
              Initialize Membership
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ErrorBoundary>
      <Layout title="Briefing Room">
        <Head>
          <title>Intelligence Briefs | Inner Circle</title>
        </Head>

        <main className="min-h-screen bg-[#050505] text-zinc-300 pb-20">
          {/* Header Section */}
          <div className="relative border-b border-white/5 bg-zinc-950/80 backdrop-blur-md px-8 py-12">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Secure Uplink Active</span>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter">Portfolio: 75 Briefs</h1>
                <p className="text-zinc-500 max-w-md mt-4">Verified assets available for local retrieval. All downloads are watermarked with your unique identifier: <span className="text-white font-mono">{session?.user?.email}</span></p>
              </div>
              <div className="w-full md:w-96">
                <input 
                  type="text" 
                  placeholder="Filter by Project Name or Keyword..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-blue-500/50 outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Briefs Grid */}
          <div className="max-w-7xl mx-auto px-8 mt-12">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBriefs.map((brief) => (
                  <div 
                    key={brief.id} 
                    className="group relative bg-zinc-900/40 border border-white/5 rounded-3xl p-8 hover:bg-zinc-900/60 hover:border-white/20 transition-all duration-500"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-mono font-bold bg-white/10 text-zinc-400 px-3 py-1 rounded-full uppercase tracking-widest">
                        {brief.codeName}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${brief.classification === 'Level 3' ? 'text-rose-500' : 'text-blue-400'}`}>
                        {brief.classification}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                      {brief.title}
                    </h3>
                    
                    <p className="text-sm text-zinc-500 leading-relaxed mb-8 line-clamp-2">
                      {brief.summary}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                      <div className="text-[10px] font-mono text-zinc-600">
                        SIZE: {brief.fileSize}
                      </div>
                      <button 
                        onClick={() => handleDownload(brief.id, brief.codeName)}
                        disabled={!!downloadingId}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-tighter text-white hover:text-blue-400 transition-all disabled:opacity-50"
                      >
                        {downloadingId === brief.id ? 'Authorizing...' : 'Retrieve Asset'}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </Layout>
    </ErrorBoundary>
  );
};

export default IntelligenceBriefsPage;