"use client";

/* pages/inner-circle/locked.tsx — MEMBER GATEWAY */
import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, ShieldAlert } from "lucide-react";
import { fontConfig } from "@/lib/next-fonts";
import Layout from "@/components/Layout";

function sanitizeLocalPath(input: string | null, fallback: string) {
  if (!input) return fallback;
  let v = input;
  try { v = decodeURIComponent(v); } catch { /* ignore */ }
  if (!v.startsWith("/")) return fallback;
  try {
    const u = new URL(v, "http://local-check.internal");
    u.searchParams.delete("callbackUrl");
    u.searchParams.delete("returnTo");
    return `${u.pathname}${u.search}`;
  } catch { return v; }
}

const LockedPage: React.FC = () => {
  const searchParams = useSearchParams();

  const returnTo = React.useMemo(() => {
    const target = searchParams?.get("returnTo") || searchParams?.get("callbackUrl") || null;
    return sanitizeLocalPath(target, "/inner-circle/dashboard");
  }, [searchParams]);

  const joinHref = React.useMemo(() => {
    const isAdminTarget = returnTo.startsWith("/admin");
    const loginBase = isAdminTarget ? "/admin/login" : "/inner-circle";
    return `${loginBase}?returnTo=${encodeURIComponent(returnTo)}`;
  }, [returnTo]);

  return (
    <Layout title="Access Restricted | Abraham of London">
      <main className={`flex min-h-screen items-center justify-center px-6 py-20 bg-black overflow-hidden relative ${fontConfig?.fontSans?.variable} ${fontConfig?.fontSerif?.variable}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-4xl bg-amber-500/[0.02] rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-xl text-center relative z-10"
        >
          <div className="mb-10 flex justify-center">
            <div className="relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="absolute inset-0 blur-3xl bg-amber-500/20 rounded-full"
              />
              <div className="relative rounded-full border border-amber-500/30 bg-black p-8 backdrop-blur-xl shadow-2xl">
                <Lock className="h-12 w-12 text-amber-500" strokeWidth={1.2} />
              </div>
            </div>
          </div>

          <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/5 text-red-400 text-[10px] font-black uppercase tracking-[0.3em]">
            <ShieldAlert size={14} />
            Restricted Manuscript
          </div>

          <h1 className="mt-4 mb-6 font-serif text-4xl font-bold text-white sm:text-5xl lg:text-6xl tracking-tighter leading-tight italic">
            Clearance <span className="text-amber-500">Required.</span>
          </h1>

          <p className="mb-12 text-zinc-500 text-lg leading-relaxed max-w-md mx-auto font-light italic">
            This specific brief is reserved for verified members of the{" "}
            <span className="text-white font-medium">Inner Circle</span>. Access is granted via invitation or
            verified institutional mandate.
          </p>

          <div className="flex flex-col items-center gap-8">
            <Link
              href={joinHref}
              className="group relative w-full sm:w-auto overflow-hidden rounded-sm bg-amber-500 px-12 py-5 font-black text-black text-[11px] uppercase tracking-[0.2em] transition-all hover:bg-white"
            >
              Unlock with Access Key
            </Link>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              <Link
                href="/inner-circle/dashboard"
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} />
                Return to Registry
              </Link>

              <div className="hidden sm:block w-px h-4 bg-zinc-800" />

              <Link
                href="/contact?intent=invitation-request"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60 hover:text-amber-500 transition-colors"
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

