'use client';

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, ShieldAlert } from "lucide-react";

import Layout from "@/components/Layout";

/**
 * STRATEGIC FIX: INTEGRITY MODE
 * Ensures the 'returnTo' parameter is handled safely for the /inner-circle redirect.
 * This prevents users from losing their place in the portfolio after authenticating.
 */
const LockedPage: React.FC = () => {
  const router = useRouter();

  // Determine the redirection target after successful authorization
  // We sanitize the query to ensure it is a string and defaults to the dashboard
  const returnTo = React.useMemo(() => {
    if (typeof router.query.returnTo === "string") {
      return router.query.returnTo;
    }
    return "/inner-circle/dashboard";
  }, [router.query.returnTo]);

  const joinHref = `/inner-circle?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <Layout title="Access Restricted | Abraham of London">
      <main className="flex min-h-screen items-center justify-center px-6 py-20 bg-black overflow-hidden relative">
        {/* Subtle Background Ambience */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-4xl bg-gold/[0.02] rounded-full blur-[120px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-xl text-center relative z-10"
        >
          {/* ICONOGRAPHY: INSTITUTIONAL LOCK */}
          <div className="mb-10 flex justify-center">
            <div className="relative">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="absolute inset-0 blur-3xl bg-gold/30 rounded-full" 
              />
              <div className="relative rounded-full border border-gold/30 bg-black p-8 backdrop-blur-xl shadow-2xl shadow-gold/20">
                <Lock className="h-12 w-12 text-gold" strokeWidth={1.2} />
              </div>
            </div>
          </div>

          {/* CLASSIFICATION TAG */}
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/5 text-red-400 text-[10px] font-black uppercase tracking-[0.3em]">
            <ShieldAlert size={14} />
            Restricted Manuscript
          </div>

          <h1 className="mt-4 mb-6 font-serif text-4xl font-bold text-white sm:text-5xl lg:text-6xl tracking-tight leading-tight">
            Institutional Access <span className="italic text-gold">Required</span>
          </h1>

          <p className="mb-12 text-zinc-500 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
            This specific brief is reserved for verified members of the <span className="text-white font-medium">Inner Circle</span>. Access is granted via invitation or verified institutional mandate.
          </p>

          {/* ACTIONS: ACCESS RECOVERY */}
          <div className="flex flex-col items-center gap-8">
            <Link
              href={joinHref}
              className="group relative w-full sm:w-auto overflow-hidden rounded-xl bg-gold px-12 py-5 font-black text-black text-[11px] uppercase tracking-[0.2em] transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-gold/10"
            >
              <span className="relative z-10">Unlock with Access Key</span>
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
            
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <Link 
                href="/canon"
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-white transition-colors group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Return to Public Library
              </Link>
              
              <div className="hidden sm:block w-px h-4 bg-zinc-800" />

              <Link 
                href="/contact?intent=invitation-request"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/60 hover:text-gold transition-colors"
              >
                Request Invitation
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </Layout>
  );
};

export default LockedPage;