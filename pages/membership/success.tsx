// ./pages/membership/success.tsx — EXPORT-SAFE (SSR with session guard)
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

// 🛡️ SSR-only page — prevents static generation
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  
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
      session, // Pass session to client
    },
  };
};

interface MembershipSuccessProps {
  session: any; // Type properly based on your session type
}

const MembershipSuccessPage: NextPage<MembershipSuccessProps> = ({ session: serverSession }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR/build, show minimal shell
  if (!mounted) {
    return (
      <Layout title="Welcome to the Inner Circle">
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
            Verifying credentials...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Welcome to the Inner Circle">
      <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center">
          {/* Animated Identity Verification UI */}
          <div className="mb-12 relative flex justify-center">
            <div className="h-32 w-32 rounded-full border border-amber-500/30 flex items-center justify-center bg-amber-500/5 animate-pulse">
              <svg className="w-16 h-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight mb-6">
            Access <span className="italic text-amber-400">Granted</span>
          </h1>
          
          <p className="text-zinc-400 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Identity verified. Your account has been elevated to <span className="text-white font-medium">Inner Circle</span> status. You now have full clearance to access the growing portfolio of intelligence briefs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
            <Link 
              href="/inner-circle/briefs" 
              className="bg-amber-400 text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg"
            >
              Enter Briefing Room
            </Link>
            <Link 
              href="/dashboard" 
              className="bg-zinc-900 text-white border border-white/10 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all"
            >
              View My Dossier
            </Link>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5 text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
            Transmission Secure • Session ID: {serverSession?.user?.id?.slice(0, 8) || "****"} • Port 443 Active
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default MembershipSuccessPage;