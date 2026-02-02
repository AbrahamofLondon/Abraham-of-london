/* pages/dashboard/index.tsx — THE SOVEREIGN ARCHIVE (FULLY INTEGRATED) */
import * as React from "react";
import type { NextPage, GetServerSideProps } from "next";
import Layout from "@/components/Layout";
import { getSession } from "next-auth/react";
import { prisma } from "@/lib/db"; 
import { motion } from "framer-motion";

interface Brief {
  id: string;
  slug: string;
  title: string;
  contentType: string;
  createdAt: string;
  metadata: string; // Used for Category/Classification
}

interface DashboardProps {
  user: {
    name: string;
    role: string;
    email: string;
  };
  latestBriefs: Brief[];
  totalBriefs: number;
}

const MemberDashboard: NextPage<DashboardProps> = ({ user, latestBriefs, totalBriefs }) => {
  const [isRetrieving, setIsRetrieving] = React.useState<string | null>(null);

  const fadeIn = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] }
  };

  /**
   * THE RETRIEVAL HANDLER
   * Communicates with /api/assets/retrieve to log and fetch secure assets.
   */
  const handleRetrieveAsset = async (slug: string) => {
    setIsRetrieving(slug);
    try {
      const response = await fetch('/api/assets/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Log locally to console in dev mode
        if (process.env.NODE_ENV === 'development') console.log(`Access Granted: ${data.title}`);
        
        // Open the secure link in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error(data.error || "Clearance Denied");
      }
    } catch (err) {
      alert(`Security Protocol: ${err instanceof Error ? err.message : 'Access Error'}`);
    } finally {
      setIsRetrieving(null);
    }
  };

  return (
    <Layout title="The Sovereign Archive">
      <main className="min-h-screen bg-[#050505] text-[#E4E4E7] selection:bg-[#D4AF37]/30">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-8 pt-32 pb-20">
          
          <motion.header {...fadeIn} className="border-b border-white/5 pb-16 mb-20">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-[#D4AF37]" />
                  <span className="text-[10px] uppercase tracking-[0.5em] text-[#D4AF37] font-medium">
                    Verified Inner Circle Member
                  </span>
                </div>
                <h1 className="text-5xl md:text-7xl font-light tracking-tighter text-white leading-none">
                  Welcome, <span className="italic font-serif">{user.name?.split(' ')[0] || 'Member'}</span>.
                </h1>
                <p className="text-zinc-500 text-lg max-w-xl font-light leading-relaxed">
                  The Archive is current. You hold active clearance for {totalBriefs} Intelligence Briefs.
                </p>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">System Status</div>
                <div className="px-4 py-2 border border-[#D4AF37]/20 bg-[#D4AF37]/5 rounded-full">
                  <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-tighter">Level 3 Clearance Active</span>
                </div>
              </div>
            </div>
          </motion.header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-32">
            <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="lg:col-span-12">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-8 flex items-center gap-4">
                Active Portfolio <span className="h-px flex-1 bg-white/5" />
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {latestBriefs.map((brief) => {
                  const meta = JSON.parse(brief.metadata || '{}');
                  return (
                    <div 
                      key={brief.id} 
                      className="group relative p-8 border border-white/5 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all duration-500 rounded-sm"
                    >
                      <div className="mb-12">
                        <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest block mb-2">
                          {meta.category || 'Intelligence'} // {meta.classification || 'UNCLASSIFIED'}
                        </span>
                        <h2 className="text-xl font-medium text-white group-hover:text-[#D4AF37] transition-colors duration-300">
                          {brief.title}
                        </h2>
                      </div>

                      <button 
                        onClick={() => handleRetrieveAsset(brief.slug)}
                        disabled={isRetrieving === brief.slug}
                        className="w-full py-4 border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50"
                      >
                        {isRetrieving === brief.slug ? 'Authenticating...' : 'Retrieve Asset'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return { redirect: { destination: "/auth/login", permanent: false } };
  }

  // Fetch the 75 briefs (limit 9 for the main dash display, adjust as needed)
  const briefs = await prisma.contentMetadata.findMany({
    take: 9,
    orderBy: { createdAt: 'desc' },
  });

  const totalBriefs = await prisma.contentMetadata.count();

  return {
    props: {
      user: session.user,
      latestBriefs: JSON.parse(JSON.stringify(briefs)),
      totalBriefs: totalBriefs,
    },
  };
};

export default MemberDashboard;