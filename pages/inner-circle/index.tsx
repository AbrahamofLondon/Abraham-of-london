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
      className="p-0 ds-surface-inner-circle"
    >
      <main className="min-h-screen pt-32 pb-32 relative overflow-hidden" style={{ backgroundColor: "var(--ds-background)" }}>
        {/* INSTITUTIONAL TEXTURE */}
        <div className="absolute inset-0 bg-[url('/assets/textures/grain.png')] opacity-[0.02] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] blur-[160px] pointer-events-none" style={{ backgroundColor: "var(--ds-accent-soft)" }} />

        <div className="relative max-w-6xl mx-auto px-6">
          <header className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-4 border px-6 py-2 mb-12 rounded-full"
              style={{ borderColor: "var(--ds-accent-soft)", backgroundColor: "var(--ds-accent-soft)" }}
            >
              <Zap size={12} style={{ color: "var(--ds-accent)" }} fill="currentColor" />
              <span className="text-[9px] font-mono uppercase tracking-[0.5em]" style={{ color: "var(--ds-accent)" }}>
                Identity Verification Protocol
              </span>
            </motion.div>

            <h1 className="text-6xl md:text-8xl font-serif mb-8 italic tracking-tighter leading-none" style={{ color: "var(--ds-text)" }}>
              The Inner <span className="font-light" style={{ color: "var(--ds-text-subtle)" }}>Circle.</span>
            </h1>

            <p className="mx-auto max-w-xl font-light text-lg italic leading-relaxed" style={{ color: "var(--ds-text-muted)" }}>
              Entry to the Sovereign Intelligence Portfolio is restricted. Authorized stakeholders must authenticate via cryptographic key.
            </p>
          </header>

          <div className="grid gap-px border lg:grid-cols-2 shadow-2xl rounded-sm overflow-hidden" style={{ backgroundColor: "var(--ds-panel)", borderColor: "var(--ds-border)" }}>
            {/* REGISTER SECTION */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-12 md:p-16"
              style={{ backgroundColor: "var(--ds-background)" }}
            >
              <div className="flex items-center gap-6 mb-16">
                <div className="h-14 w-14 border flex items-center justify-center" style={{ borderColor: "var(--ds-border)", color: "var(--ds-text-subtle)" }}>
                  <Mail size={24} strokeWidth={1} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif italic" style={{ color: "var(--ds-text)" }}>Clearance</h2>
                  <p className="text-[9px] uppercase tracking-[0.4em] font-mono mt-1" style={{ color: "var(--ds-text-subtle)" }}>Formal Registration</p>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-mono uppercase tracking-[0.4em]" style={{ color: "var(--ds-text-subtle)" }}>Identity Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border px-6 py-4 outline-none transition-all focus:border-[var(--ds-accent-soft)] placeholder:text-[var(--ds-text-subtle)]"
                    style={{
                      borderColor: "var(--ds-border)",
                      backgroundColor: "var(--ds-panel)",
                      color: "var(--ds-text)",
                    }}
                    placeholder="Institutional Name"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-mono uppercase tracking-[0.4em]" style={{ color: "var(--ds-text-subtle)" }}>Professional Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border px-6 py-4 outline-none transition-all focus:border-[var(--ds-accent-soft)] placeholder:text-[var(--ds-text-subtle)]"
                    style={{
                      borderColor: "var(--ds-border)",
                      backgroundColor: "var(--ds-panel)",
                      color: "var(--ds-text)",
                    }}
                    placeholder="name@institution.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={registerStatus === "submitting"}
                  className="w-full py-5 text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 disabled:opacity-30"
                  style={{
                    backgroundColor: "var(--ds-text)",
                    color: "var(--ds-background)",
                  }}
                >
                  {registerStatus === "submitting" ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                  Issue Access Request
                </button>

                {feedback?.type === "register" && (
                  <p className="text-[10px] font-mono text-center uppercase tracking-widest mt-4" style={{ color: "var(--ds-accent)" }}>{feedback.msg}</p>
                )}
              </form>
            </motion.div>

            {/* UNLOCK SECTION */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-12 md:p-16 border-l"
              style={{ backgroundColor: "var(--ds-background-muted)", borderColor: "var(--ds-border)" }}
            >
              <div className="flex items-center gap-6 mb-16">
                <div className="h-14 w-14 border flex items-center justify-center" style={{ borderColor: "var(--ds-accent-soft)", backgroundColor: "var(--ds-accent-soft)", color: "var(--ds-accent)" }}>
                  <Key size={24} strokeWidth={1} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif italic" style={{ color: "var(--ds-text)" }}>Secure Entry</h2>
                  <p className="text-[9px] uppercase tracking-[0.4em] font-mono mt-1" style={{ color: "var(--ds-accent)" }}>Authentication Required</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {alreadyUnlocked ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10 space-y-12"
                  >
                    <div className="inline-block p-8 border rounded-full animate-pulse" style={{ borderColor: "var(--ds-accent-soft)", backgroundColor: "var(--ds-accent-soft)" }}>
                      <CheckCircle className="h-12 w-12" style={{ color: "var(--ds-accent)" }} />
                    </div>
                    <h3 className="text-2xl font-serif italic" style={{ color: "var(--ds-text)" }}>Clearance Verified</h3>
                    <button
                      onClick={() => router.replace(returnTo)}
                      className="w-full py-5 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4"
                      style={{
                        backgroundColor: "var(--ds-accent)",
                        color: "var(--ds-background)",
                      }}
                    >
                      Enter Registry <ArrowRight size={16} />
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleUnlock} className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[9px] font-mono uppercase tracking-[0.4em]" style={{ color: "var(--ds-accent)" }}>Cryptographic Key</label>
                      <input
                        type="password"
                        required
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        className="w-full border px-6 py-4 font-mono outline-none transition-all focus:border-[var(--ds-accent)] placeholder:text-[var(--ds-text-subtle)]"
                        style={{
                          borderColor: "var(--ds-accent-soft)",
                          backgroundColor: "var(--ds-background)",
                          color: "var(--ds-accent)",
                        }}
                        placeholder="ic_••••••••••••"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={unlockStatus === "submitting"}
                      className="w-full border py-5 text-[10px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4"
                      style={{
                        borderColor: "var(--ds-accent-soft)",
                        color: "var(--ds-accent)",
                      }}
                    >
                      {unlockStatus === "submitting" ? <RefreshCw className="animate-spin" size={16} /> : <Unlock size={16} />}
                      Authenticate Key
                    </button>

                    {feedback?.type === "unlock" && (
                      <p className="text-[10px] font-mono text-center uppercase tracking-widest mt-4" style={{ color: "var(--ds-danger)" }}>{feedback.msg}</p>
                    )}
                  </form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        <section className="mt-48 py-24 border-t" style={{ borderColor: "var(--ds-border)" }}>
          <div className="mx-auto max-w-xl px-6 text-center space-y-10">
            <h2 className="text-3xl font-serif italic tracking-tight" style={{ color: "var(--ds-text)" }}>The Strategic Dispatch</h2>
            <p className="text-lg font-light leading-relaxed italic" style={{ color: "var(--ds-text-muted)" }}>
              Public intelligence on institutional design and frontier market strategy.
            </p>
            <form className="relative max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder="Institutional Email"
                className="w-full border px-8 py-4 text-sm outline-none transition-all focus:border-[var(--ds-accent-soft)] placeholder:text-[var(--ds-text-subtle)]"
                style={{
                  borderColor: "var(--ds-border)",
                  backgroundColor: "var(--ds-panel)",
                  color: "var(--ds-text)",
                }}
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "var(--ds-accent)" }}
                aria-label="Subscribe"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-[8px] font-mono uppercase tracking-[0.5em]" style={{ color: "var(--ds-text-subtle)" }}>
              Direct Signal • Zero Proliferation
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default InnerCirclePage;

