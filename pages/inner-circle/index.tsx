/* pages/inner-circle/index.tsx — UNIFIED AUTHENTICATION GATE */
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
  Zap
} from "lucide-react";

import Layout from "@/components/Layout"; // Updated to use our new layout
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";

const INNER_CIRCLE_COOKIE_NAME = "aol_access";

function hasInnerCircleCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .some((c) => c.startsWith(`${INNER_CIRCLE_COOKIE_NAME}=`));
}

/**
 * Ensures redirections stay within the application domain
 */
function safeReturnTo(input: unknown, fallback = "/inner-circle/dashboard"): string {
  try {
    const raw = typeof input === "string" ? input.trim() : "";
    if (!raw) return fallback;
    // Prevent open redirect vulnerabilities
    if (/^(https?:)?\/\//i.test(raw)) return fallback;
    if (/^javascript:/i.test(raw)) return fallback;
    if (!raw.startsWith("/")) return fallback;
    return raw;
  } catch {
    return fallback;
  }
}

const InnerCirclePage: NextPage = () => {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [accessKey, setAccessKey] = React.useState("");

  const [registerStatus, setRegisterStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [unlockStatus, setUnlockStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = React.useState<{ type: "register" | "unlock"; msg: string } | null>(null);
  const [alreadyUnlocked, setAlreadyUnlocked] = React.useState(false);

  // Default to the dashboard instead of generic /vault
  const returnTo = React.useMemo(() => {
    const q = router.query.returnTo ?? router.query.callbackUrl;
    return safeReturnTo(q, "/inner-circle/dashboard");
  }, [router.query.returnTo, router.query.callbackUrl]);

  React.useEffect(() => {
    if (!router.isReady) return;
    const unlocked = hasInnerCircleCookie();
    setAlreadyUnlocked(unlocked);
    if (unlocked) {
      const timer = window.setTimeout(() => router.replace(returnTo), 800);
      return () => window.clearTimeout(timer);
    }
  }, [router.isReady, returnTo, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerStatus === "submitting") return;
    setRegisterStatus("submitting");
    setFeedback(null);

    const recaptchaToken = await getRecaptchaTokenSafe("inner_circle_register");

    try {
      const res = await fetch("/api/inner-circle/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim(), recaptchaToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Registration failed");

      setRegisterStatus("success");
      setFeedback({ type: "register", msg: "Protocol Initialized. Key dispatched via encrypted mail." });
      setEmail("");
      setName("");
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Invalid Security Key");

      setUnlockStatus("success");
      setAlreadyUnlocked(true);
      window.setTimeout(() => router.replace(returnTo), 600);
    } catch (err: any) {
      setUnlockStatus("error");
      setFeedback({ type: "unlock", msg: err?.message || "Access Denied." });
    }
  };

  return (
    <Layout 
      title="Identity Verification | Inner Circle" 
      description="Authentication required for sovereign intelligence access."
      // Hide sidebar on the login gate
      className="p-0"
    >
      <main className="min-h-screen bg-[#050505] pt-32 pb-32 relative overflow-hidden">
        {/* INSTITUTIONAL TEXTURE */}
        <div className="absolute inset-0 bg-[url('/assets/textures/grain.png')] opacity-[0.02] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-amber-900/5 blur-[160px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6">
          <header className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-4 border border-amber-500/20 bg-amber-500/5 px-6 py-2 mb-12 rounded-full"
            >
              <Zap size={12} className="text-amber-500" fill="currentColor" />
              <span className="text-[9px] font-mono uppercase tracking-[0.5em] text-amber-200/80">
                Identity Verification Protocol
              </span>
            </motion.div>

            <h1 className="text-6xl md:text-8xl font-serif text-white mb-8 italic tracking-tighter leading-none">
              The Inner <span className="font-light text-zinc-600">Circle.</span>
            </h1>

            <p className="mx-auto max-w-xl text-zinc-500 font-light text-lg italic leading-relaxed">
              Entry to the Sovereign Intelligence Portfolio is restricted. Authorized stakeholders must authenticate via cryptographic key.
            </p>
          </header>

          <div className="grid gap-px bg-white/5 border border-white/5 lg:grid-cols-2 shadow-2xl rounded-sm overflow-hidden">
            {/* REGISTER SECTION */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#050505] p-12 md:p-16"
            >
              <div className="flex items-center gap-6 mb-16">
                <div className="h-14 w-14 border border-white/10 flex items-center justify-center text-zinc-500">
                  <Mail size={24} strokeWidth={1} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-white italic">Clearance</h2>
                  <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-700 font-mono mt-1">Formal Registration</p>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-mono uppercase tracking-[0.4em] text-zinc-600">Identity Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/10 px-6 py-4 text-white focus:border-amber-500/30 outline-none transition-all placeholder:text-zinc-800"
                    placeholder="Institutional Name"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-mono uppercase tracking-[0.4em] text-zinc-600">Professional Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/10 px-6 py-4 text-white focus:border-amber-500/30 outline-none transition-all placeholder:text-zinc-800"
                    placeholder="name@institution.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={registerStatus === "submitting"}
                  className="w-full bg-white text-black py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-amber-100 transition-all flex items-center justify-center gap-4 disabled:opacity-30"
                >
                  {registerStatus === "submitting" ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                  Issue Access Request
                </button>

                {feedback?.type === "register" && (
                  <p className="text-[10px] font-mono text-center uppercase tracking-widest text-amber-500/60 mt-4">{feedback.msg}</p>
                )}
              </form>
            </motion.div>

            {/* UNLOCK SECTION */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#080808] p-12 md:p-16 border-l border-white/5"
            >
              <div className="flex items-center gap-6 mb-16">
                <div className="h-14 w-14 border border-amber-500/20 bg-amber-500/5 flex items-center justify-center text-amber-500/60">
                  <Key size={24} strokeWidth={1} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-white italic">Secure Entry</h2>
                  <p className="text-[9px] uppercase tracking-[0.4em] text-amber-500/40 font-mono mt-1">Authentication Required</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {alreadyUnlocked ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10 space-y-12"
                  >
                    <div className="inline-block p-8 bg-amber-500/5 border border-amber-500/20 rounded-full animate-pulse">
                      <CheckCircle className="h-12 w-12 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-serif text-white italic">Clearance Verified</h3>
                    <button
                      onClick={() => router.replace(returnTo)}
                      className="w-full bg-amber-500 text-black py-5 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4"
                    >
                      Enter Registry <ArrowRight size={16} />
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleUnlock} className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[9px] font-mono uppercase tracking-[0.4em] text-amber-500/30">Cryptographic Key</label>
                      <input
                        type="password"
                        required
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        className="w-full bg-black border border-amber-500/10 px-6 py-4 font-mono text-amber-500 focus:border-amber-500/40 outline-none transition-all placeholder:text-amber-900/20"
                        placeholder="ic_••••••••••••"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={unlockStatus === "submitting"}
                      className="w-full border border-amber-500/30 text-amber-500 py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-4"
                    >
                      {unlockStatus === "submitting" ? <RefreshCw className="animate-spin" size={16} /> : <Unlock size={16} />}
                      Authenticate Key
                    </button>

                    {feedback?.type === "unlock" && (
                      <p className="text-[10px] font-mono text-center uppercase tracking-widest text-red-500/60 mt-4">{feedback.msg}</p>
                    )}
                  </form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        <section className="mt-48 py-24 border-t border-white/5">
          <div className="mx-auto max-w-xl px-6 text-center space-y-10">
            <h2 className="text-3xl font-serif text-white italic tracking-tight">The Strategic Dispatch</h2>
            <p className="text-zinc-500 text-lg font-light leading-relaxed italic">
              Public intelligence on institutional design and frontier market strategy.
            </p>
            <form className="relative max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder="Institutional Email"
                className="w-full bg-white/[0.03] border border-white/10 px-8 py-4 text-sm text-white focus:border-amber-500/20 outline-none transition-all"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 hover:text-white transition-colors"
                aria-label="Subscribe"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-zinc-800">
              Direct Signal • Zero Proliferation
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default InnerCirclePage;

