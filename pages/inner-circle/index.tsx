/* pages/inner-circle/index.tsx — INSTITUTIONAL ALIGNMENT */
import * as React from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Key,
  Mail,
  RefreshCw,
  CheckCircle,
  Unlock,
  ArrowRight,
  Send,
  Lock,
} from "lucide-react";

import Layout from "@/components/Layout";
import useAnalytics from "@/hooks/useAnalytics";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";

const INNER_CIRCLE_COOKIE_NAME = "aol_access";

function hasInnerCircleCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .some((c) => c.startsWith(`${INNER_CIRCLE_COOKIE_NAME}=`));
}

function safeReturnTo(input: unknown, fallback = "/dashboard"): string {
  try {
    const raw = typeof input === "string" ? input.trim() : "";
    if (!raw || /^(https?:)?\/\//i.test(raw) || /^javascript:/i.test(raw)) return fallback;
    if (!raw.startsWith("/")) return fallback;
    return raw;
  } catch {
    return fallback;
  }
}

const InnerCirclePage: NextPage = () => {
  const router = useRouter();
  const { trackEvent } = useAnalytics();

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [accessKey, setAccessKey] = React.useState("");
  const [newsletterEmail, setNewsletterEmail] = React.useState("");

  const [registerStatus, setRegisterStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [unlockStatus, setUnlockStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [newsletterStatus, setNewsletterStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");

  const [feedback, setFeedback] = React.useState<{ type: "register" | "unlock" | "newsletter"; msg: string } | null>(null);
  const [alreadyUnlocked, setAlreadyUnlocked] = React.useState(false);

  const returnTo = React.useMemo(
    () => safeReturnTo(router.query.callbackUrl || router.query.returnTo, "/dashboard"),
    [router.query]
  );

  React.useEffect(() => {
    if (!router.isReady) return;
    const unlocked = hasInnerCircleCookie();
    setAlreadyUnlocked(unlocked);
    if (unlocked && window.location.pathname !== returnTo) {
      const timer = window.setTimeout(() => router.replace(returnTo), 900);
      return () => window.clearTimeout(timer);
    }
  }, [router.isReady, returnTo, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerStatus === "submitting") return;
    setRegisterStatus("submitting");
    setFeedback(null);

    const token = await getRecaptchaTokenSafe("inner_circle_register");
    try {
      const res = await fetch("/api/inner-circle/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim(), recaptchaToken: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Registration failed");

      setRegisterStatus("success");
      setFeedback({ type: "register", msg: "Request dispatched. Verification key will be issued via encrypted mail." });
      setEmail(""); setName("");
    } catch (err: any) {
      setRegisterStatus("error");
      setFeedback({ type: "register", msg: err?.message || "Protocol failure." });
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockStatus === "submitting") return;
    setUnlockStatus("submitting");
    setFeedback(null);

    try {
      const res = await fetch("/api/inner-circle/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: accessKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Invalid Security Key");

      setUnlockStatus("success");
      setAlreadyUnlocked(true);
      window.setTimeout(() => router.replace(returnTo), 650);
    } catch (err: any) {
      setUnlockStatus("error");
      setFeedback({ type: "unlock", msg: err?.message || "Access Denied." });
    }
  };

  return (
    <Layout pageTitle="Inner Circle">
      <main className="min-h-screen bg-background pt-40 pb-24 relative overflow-hidden">
        {/* Institutional Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-primary/5 blur-[140px] pointer-events-none" />

        <section className="relative mx-auto max-w-6xl px-6">
          <header className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 mb-10"
            >
              <ShieldCheck size={14} className="text-primary" />
              <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary">Registry Access Protocol</span>
            </motion.div>

            <h1 className="font-editorial text-6xl md:text-8xl text-white mb-8 italic tracking-tighter leading-none">
              The Inner Circle
            </h1>

            <p className="mx-auto max-w-2xl text-zinc-500 font-light text-lg italic leading-relaxed">
              Access is restricted to authorized stakeholders. Verification of identity grants entry to the 
              <span className="text-primary/80 ml-2">Sovereign Intelligence Portfolio</span>.
            </p>
          </header>

          <div className="grid gap-16 lg:grid-cols-2">
            {/* REGISTER SECTION */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="vault-card p-10 md:p-12 rounded-none border-white/5"
            >
              <div className="flex items-center gap-6 mb-12">
                <div className="h-12 w-12 bg-white/5 flex items-center justify-center text-primary border border-white/10">
                  <Mail size={22} strokeWidth={1} />
                </div>
                <div>
                  <h2 className="text-2xl font-editorial text-white italic">Request Clearance</h2>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-mono">Formal Registration</p>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[9px] font-mono uppercase tracking-[0.4em] text-zinc-700 ml-1">Identity Name</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 px-5 py-4 text-white focus:border-primary/40 outline-none transition-all placeholder:text-zinc-800"
                    placeholder="Full Legal or Institutional Name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-mono uppercase tracking-[0.4em] text-zinc-700 ml-1">Professional Email</label>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 px-5 py-4 text-white focus:border-primary/40 outline-none transition-all placeholder:text-zinc-800"
                    placeholder="name@institution.com"
                  />
                </div>

                <button
                  type="submit" disabled={registerStatus === "submitting"}
                  className="w-full bg-white text-black py-5 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-primary transition-all flex items-center justify-center gap-4 disabled:opacity-20"
                >
                  {registerStatus === "submitting" ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                  Issue Access Request
                </button>
              </form>
            </motion.div>

            {/* UNLOCK SECTION */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="vault-card p-10 md:p-12 border-primary/20 bg-primary/[0.01]"
            >
              <div className="flex items-center gap-6 mb-12">
                <div className="h-12 w-12 bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-gold-glow">
                  <Key size={22} strokeWidth={1} />
                </div>
                <div>
                  <h2 className="text-2xl font-editorial text-white italic">Secure Entry</h2>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-primary/50 font-mono">Key Authentication</p>
                </div>
              </div>

              {alreadyUnlocked ? (
                <div className="text-center py-10">
                  <div className="mb-8 inline-block p-6 bg-primary/10 rounded-full border border-primary/20 animate-pulse">
                    <CheckCircle className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-editorial text-white italic mb-10">Clearance Verified</h3>
                  <button
                    onClick={() => router.replace(returnTo)}
                    className="w-full bg-primary text-black py-5 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-4"
                  >
                    Enter Registry <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUnlock} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-mono uppercase tracking-[0.4em] text-primary/40 ml-1">Cryptographic Key</label>
                    <input
                      type="password" required value={accessKey} onChange={(e) => setAccessKey(e.target.value)}
                      className="w-full bg-black/60 border border-primary/20 px-5 py-4 font-mono text-primary focus:border-primary/60 outline-none transition-all placeholder:text-primary/10"
                      placeholder="ic_••••••••••••"
                    />
                  </div>

                  <button
                    type="submit" disabled={unlockStatus === "submitting"}
                    className="w-full border border-primary/40 text-primary py-5 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-primary hover:text-black transition-all flex items-center justify-center gap-4"
                  >
                    {unlockStatus === "submitting" ? <RefreshCw className="animate-spin" size={16} /> : <Unlock size={16} />}
                    Authenticate Key
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </section>

        {/* BOTTOM SECTION: THE BRIEF */}
        <section className="mt-48 border-t border-white/5 pt-32 pb-20">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="font-editorial text-4xl text-white mb-8 italic">The Strategic Brief</h2>
            <p className="text-zinc-500 text-lg font-light leading-relaxed mb-12 italic">
              Public dispatches on institutional design and frontier market strategy.
            </p>

            <form className="relative group max-w-md mx-auto">
              <input
                type="email" required placeholder="Institutional Email"
                className="w-full bg-white/[0.03] border border-white/10 rounded-none px-8 py-5 text-sm text-white focus:border-primary/30 outline-none transition-all"
              />
              <button className="absolute right-0 top-0 bottom-0 px-8 text-primary hover:text-white transition-colors">
                <Send size={18} />
              </button>
            </form>
            <p className="mt-12 text-[8px] font-mono uppercase tracking-[0.5em] text-zinc-800">Direct Signal • No Proliferation</p>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default InnerCirclePage;