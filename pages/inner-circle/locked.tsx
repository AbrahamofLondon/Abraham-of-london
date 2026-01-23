/* pages/locked.tsx — RESTRICTED ACCESS GATE (INTEGRITY MODE) */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, ShieldAlert } from "lucide-react";

/**
 * STRATEGIC FIX: INTEGRITY MODE
 * Ensures the 'returnTo' parameter is handled safely for the /inner-circle redirect.
 */
export default function LockedPage() {
  const router = useRouter();

  // 1. Determine where to send them back after they join/login
  // Default to /inner-circle/dashboard for structural integrity
  const returnTo =
    typeof router.query.returnTo === "string"
      ? router.query.returnTo
      : "/inner-circle/dashboard";

  const joinHref = `/inner-circle?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <Layout title="Access Restricted">
      <main className="flex min-h-[75vh] items-center justify-center px-6 py-20 bg-black">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-xl text-center"
        >
          {/* ICONOGRAPHY: INSTITUTIONAL LOCK */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-gold/20 rounded-full" />
              <div className="relative rounded-full border border-gold/30 bg-gold/5 p-6 backdrop-blur-sm">
                <Lock className="h-10 w-10 text-gold" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* MESSAGING: RESTRICTED CANON */}
          <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest">
            <ShieldAlert size={12} />
            Restricted Volume
          </div>

          <h1 className="mt-4 mb-4 font-serif text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
            Institutional Access <span className="italic">Required</span>
          </h1>

          <p className="mb-10 text-gray-400 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
            This specific document is reserved for members of the <span className="text-gold font-medium">Inner Circle</span>. 
            Access is managed via private invitation and verified mandate-fit.
          </p>

          {/* ACTIONS: ACCESS RECOVERY */}
          <div className="flex flex-col items-center gap-6">
            <Link
              href={joinHref}
              className="w-full sm:w-auto rounded-xl bg-gold px-10 py-4 font-bold text-black transition-all hover:bg-gold/80 hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-gold/10"
            >
              Unlock with Access Key
            </Link>
            
            <div className="flex items-center gap-6">
              <Link 
                href="/canon"
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-white transition-colors group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Public Library
              </Link>
              
              <Link 
                href="/contact?intent=invitation-request"
                className="text-sm font-medium text-gold/60 hover:text-gold transition-colors"
              >
                Request Invitation
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </Layout>
  );
}