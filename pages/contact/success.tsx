/* pages/contact/success.tsx — SECURE SIGNAL TERMINATED */
import * as React from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Home, ChevronRight, Activity } from "lucide-react";
import Layout from "@/components/Layout";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function ContactSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = React.useState(30);

  // Auto-redirect logic: Return to base after 30 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <Layout title="Transmission Received | Abraham of London">
      <main className="min-h-screen bg-black flex items-center justify-center px-6 relative overflow-hidden">
        {/* Deep Field Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03)_0%,transparent_70%)]" />
        
        {/* Scanning Line Animation */}
        <motion.div 
          initial={{ top: "-10%" }}
          animate={{ top: "110%" }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 w-full h-[2px] bg-amber-500/10 z-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
        />

        <div className="max-w-2xl w-full text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Success Icon with Pulse */}
            <div className="mb-10 flex justify-center">
              <div className="h-24 w-24 rounded-full border border-emerald-500/20 flex items-center justify-center bg-emerald-500/5 relative">
                <motion.div
                  className="absolute inset-0 rounded-full border border-emerald-500/40"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <ShieldCheck className="w-10 h-10 text-emerald-500" strokeWidth={1} />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight mb-6 uppercase">
              Signal <span className="italic text-amber-400">Received</span>
            </h1>

            <div className="space-y-4 mb-12">
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-md mx-auto italic">
                Your briefing has been encrypted and successfully routed to the institutional briefing room.
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em]">
                <Activity size={12} className="text-emerald-500 animate-pulse" />
                Status: Transmission Authenticated
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/"
                className="group flex items-center justify-center gap-3 bg-white text-black px-10 py-4 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-400 transition-all w-full sm:w-auto shadow-xl shadow-white/5"
              >
                <Home size={14} />
                Return to Base
              </Link>

              <Link
                href="/inner-circle"
                className="flex items-center justify-center gap-3 bg-zinc-900 text-zinc-400 border border-zinc-800 px-10 py-4 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] hover:text-white hover:border-zinc-700 transition-all w-full sm:w-auto"
              >
                Inner Circle Access
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Countdown Footer */}
            <div className="mt-20 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
              <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.4em]">
                Connection terminating in {countdown}s...
              </div>
              <div className="h-1 w-48 bg-zinc-900 rounded-full overflow-hidden relative">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-amber-500/40"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 30, ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </Layout>
  );
}