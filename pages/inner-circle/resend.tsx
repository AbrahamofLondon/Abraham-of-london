/* pages/inner-circle/resend.tsx — ACCESS RECOVERY (INTEGRITY MODE, ROUTER-SAFE) */
'use client';

import * as React from "react";
import type { NextPage, GetServerSideProps } from "next";
import Link from "next/link";
import { Mail, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";
import { useClientRouter, useClientQuery, useClientIsReady } from "@/lib/router/useClientRouter";
import { readAccessCookie } from "@/lib/server/auth/cookies";

type ApiResponse = {
  ok: boolean;
  message?: string;
  error?: string;
};

interface ResendProps {
  initialReturnTo?: string;
  hasActiveSession?: boolean;
}

const InnerCircleResendPage: NextPage<ResendProps> = ({ initialReturnTo = "/inner-circle/dashboard", hasActiveSession = false }) => {
  // ✅ Router-safe hooks
  const router = useClientRouter();
  const query = useClientQuery();
  const isReady = useClientIsReady();
  
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Redirection target after recovery for UX continuity
  const returnTo = React.useMemo(() => {
    if (!mounted || !router) return initialReturnTo;
    const queryReturnTo = typeof query.returnTo === "string" ? query.returnTo : null;
    return queryReturnTo || initialReturnTo;
  }, [mounted, router, query.returnTo, initialReturnTo]);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (mounted && router && hasActiveSession) {
      router.push(returnTo);
    }
  }, [mounted, router, hasActiveSession, returnTo]);

  // ✅ Early return during SSR/prerender
  if (!router) {
    return (
      <Layout title="Access Recovery | Inner Circle">
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
      setStatus("error");
      setFeedback("Please enter a valid institutional email address.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setFeedback(null);

    try {
      // 1. Security Check: Recaptcha verification
      const recaptchaToken = await getRecaptchaTokenSafe("inner_circle_resend");

      if (!recaptchaToken) {
        setStatus("error");
        setFeedback("Security verification failed. Please ensure JavaScript is enabled.");
        setLoading(false);
        return;
      }

      // 2. Request fresh key via API
      const res = await fetch("/api/inner-circle/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          returnTo,
          recaptchaToken,
        }),
      });

      const data = (await res.json()) as ApiResponse;

      if (!data.ok) {
        setStatus("error");
        setFeedback(data.error || "We couldn't locate an active session for this email.");
        return;
      }

      // 3. Success State
      setStatus("success");
      setFeedback(data.message || "A fresh Inner Circle access email has been dispatched. Please check your inbox.");
    } catch (error) {
      console.error("[RESEND_FAILURE]", error);
      setStatus("error");
      setFeedback("A system error occurred. Please attempt recovery again shortly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Access Recovery | Inner Circle">
      <main className="min-h-screen flex items-center justify-center px-4 py-20 bg-black relative overflow-hidden">
        {/* Institutional Ambience */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-900/[0.02] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        
        <section className="w-full max-w-xl relative z-10">
          <header className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-gold text-[10px] font-black uppercase tracking-[0.2em] mb-8">
              <Mail size={12} />
              Access Recovery
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Request <span className="italic text-gold">Fresh Link</span>
            </h1>
            <p className="text-zinc-500 text-sm md:text-base leading-relaxed max-w-md mx-auto">
              Lost your entry point? Enter your registered email to synchronize your session and receive a new secure access key.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="space-y-8 rounded-[2rem] border border-white/10 bg-zinc-950/50 p-10 backdrop-blur-xl shadow-2xl"
          >
            <div className="space-y-3">
              <label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-1">
                Registered Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-black px-5 py-4 text-white outline-none focus:border-gold/40 transition-all font-mono text-sm placeholder:text-zinc-800"
                placeholder="identity@institution.com"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-1">
                Verify Name <span className="text-zinc-800">(Optional)</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-black px-5 py-4 text-white outline-none focus:border-gold/40 transition-all font-mono text-sm placeholder:text-zinc-800"
                placeholder="Institutional Name"
              />
            </div>

            <button
              type="submit"
              disabled={loading || status === "success"}
              className="w-full bg-gradient-to-r from-gold to-amber-600 text-black py-5 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] hover:from-white hover:to-white disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-gold/5 group"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : status === "success" ? (
                <CheckCircle size={18} />
              ) : (
                "Dispatch Recovery Key"
              )}
            </button>

            {feedback && (
              <div
                className={`flex items-start gap-4 p-5 rounded-2xl text-xs font-medium border leading-relaxed animate-in fade-in slide-in-from-top-2 duration-500 ${
                  status === "success"
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                    : "border-red-500/30 bg-red-500/5 text-red-400"
                }`}
              >
                {status === "error" ? (
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle size={18} className="shrink-0 mt-0.5" />
                )}
                <p>{feedback}</p>
              </div>
            )}
          </form>

          <footer className="mt-12 flex flex-col items-center gap-6">
            <Link 
              href="/inner-circle" 
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-white transition-colors group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Return to Gate
            </Link>
            <p className="text-[10px] text-zinc-700 text-center max-w-sm leading-loose uppercase tracking-widest">
              Automated institutional verification may take up to 600 seconds.
            </p>
          </footer>
        </section>
      </main>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  SERVER SIDE PROPS
----------------------------------------------------------------------------- */
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const sessionId = readAccessCookie(context.req as any);
    const hasActiveSession = !!sessionId;
    
    const returnTo = context.query.returnTo || "/inner-circle/dashboard";
    
    return {
      props: {
        initialReturnTo: returnTo,
        hasActiveSession,
      },
    };
  } catch (err) {
    console.error("[RESEND_SSR_ERROR]:", err);
    return {
      props: {
        initialReturnTo: "/inner-circle/dashboard",
        hasActiveSession: false,
      },
    };
  }
};

export default InnerCircleResendPage;