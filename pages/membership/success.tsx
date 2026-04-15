// ./pages/membership/success.tsx — SECURE ACCESS SUCCESS
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, ChevronRight, LayoutDashboard, Lock } from "lucide-react";
import Layout from "@/components/Layout";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

export const getServerSideProps: GetServerSideProps = async (context) => {
  console.log("[PAGE_DATA] pages/membership/success.tsx getServerSideProps START");
  try {
  const session = await getServerSession(context.req, context.res, authOptions);
  
  // Guard: If no session, redirect to prevent direct URL access
  if (!session) {
    return {
      redirect: {
        destination: "/membership",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };

  } finally {
    console.log("[PAGE_DATA] pages/membership/success.tsx getServerSideProps END");
  }
};

interface MembershipSuccessProps {
  session: any;
}

const MembershipSuccessPage: NextPage<MembershipSuccessProps> = ({ session }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Layout title="Verifying Clearance">
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Lock className="text-zinc-800 animate-pulse" size={24} />
            <div className="text-zinc-600 font-mono text-[10px] uppercase tracking-[0.3em]">
              Synchronizing Credentials...
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Clearance Granted | Inner Circle">
      <main className="min-h-screen bg-black flex items-center justify-center px-6 relative overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)]" />
        
        <div className="max-w-2xl w-full text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Identity Verification UI */}
            <div className="mb-10 relative flex justify-center">
              <div className="h-24 w-24 rounded-full border border-amber-500/20 flex items-center justify-center bg-amber-500/5 relative">
                <motion.div 
                  className="absolute inset-0 rounded-full border border-amber-500/40"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <ShieldCheck className="w-10 h-10 text-amber-500" strokeWidth={1.5} />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight mb-6">
              Access <span className="italic text-amber-400">Granted</span>
            </h1>
            
            <p className="text-zinc-400 text-sm md:text-base mb-12 leading-relaxed max-w-md mx-auto italic">
              Principal identity confirmed. Your account has been elevated to <span className="text-white font-medium not-italic">Inner Circle</span> status. Clearance level allows full access to the portfolio of intelligence briefs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/inner-circle/briefs" 
                className="group flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-sm text-[11px] font-black uppercase tracking-[0.2em] hover:bg-amber-400 transition-all w-full sm:w-auto"
              >
                The Briefing Room
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/dashboard" 
                className="flex items-center justify-center gap-3 bg-zinc-900 text-zinc-400 border border-zinc-800 px-8 py-4 rounded-sm text-[11px] font-black uppercase tracking-[0.2em] hover:text-white hover:border-zinc-700 transition-all w-full sm:w-auto"
              >
                <LayoutDashboard size={14} />
                Private Dossier
              </Link>
            </div>

            <div className="mt-20 pt-8 border-t border-white/5 flex flex-col items-center gap-2">
              <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.4em]">
                Transmission Encrypted • Session ID: {session?.user?.id?.slice(0, 8) || "REF-NULL"}
              </div>
              <div className="h-1 w-32 bg-zinc-900 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-amber-500/50"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </Layout>
  );
};

export default MembershipSuccessPage;