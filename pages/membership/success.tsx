// ./pages/membership/success.tsx
import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";
import Layout from "@/components/Layout";
import { useSession } from "next-auth/react";

const MembershipSuccessPage: NextPage = () => {
  const { data: session } = useSession();

  return (
    <Layout title="Welcome to the Inner Circle">
      <main className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center">
          {/* Animated Identity Verification UI */}
          <div className="mb-12 relative flex justify-center">
            <div className="h-32 w-32 rounded-full border border-blue-500/30 flex items-center justify-center bg-blue-500/5 animate-pulse">
              <svg className="w-16 h-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 uppercase">
            Access Granted
          </h1>
          
          <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
            Identity verified. Your account has been elevated to <span className="text-white font-bold">Inner Circle</span> status. You now have full clearance to access the growing portfolio of 75 intelligence briefs.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/inner-circle/briefs" className="bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">
              Enter Briefing Room
            </Link>
            <Link href="/dashboard" className="bg-zinc-900 text-white border border-white/10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">
              View My Dossier
            </Link>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
            Transmission Secure • ID: {session?.user?.id?.slice(0, 8)} • Port 443 Active
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default MembershipSuccessPage;