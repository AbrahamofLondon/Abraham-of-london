/* pages/inner-circle/index.tsx — HARDENED ACCESS CONTROL (INTEGRITY MODE) */
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
  Lock
} from "lucide-react";

import Layout from "@/components/Layout";
import useAnalytics from "@/hooks/useAnalytics";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";

// Institutional Standard: matches lib/server/auth/cookies.ts
const INNER_CIRCLE_COOKIE_NAME = "aol_access";

/**
 * CLIENT-SIDE ACCESS VERIFICATION
 */
function hasInnerCircleCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .some((c) => c.startsWith(`${INNER_CIRCLE_COOKIE_NAME}=`));
}

const InnerCirclePage: NextPage = () => {
  const router = useRouter();
  const { trackEvent } = useAnalytics();

  // FORM STATE
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [accessKey, setAccessKey] = React.useState("");
  const [registerStatus, setRegisterStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [unlockStatus, setUnlockStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [newsletterStatus, setNewsletterStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = React.useState<{ type: "register" | "unlock" | "newsletter"; msg: string } | null>(null);
  const [alreadyUnlocked, setAlreadyUnlocked] = React.useState(false);

  // REDIRECTION LOGIC
  const returnTo = typeof router.query.returnTo === "string" ? router.query.returnTo : "/inner-circle/dashboard";

  React.useEffect(() => {
    const unlocked = hasInnerCircleCookie();
    setAlreadyUnlocked(unlocked);
    
    if (unlocked && router.isReady) {
      const redirectTimer = setTimeout(() => {
        if (returnTo && !window.location.pathname.includes(returnTo)) {
          router.push(returnTo);
        }
      }, 1500);
      return () => clearTimeout(redirectTimer);
    }
  }, [router.isReady, returnTo]);

  /**
   * MEMBERSHIP REQUEST HANDLER (POSTGRES-SYNCED)
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterStatus("submitting");
    setFeedback(null);

    const token = await getRecaptchaTokenSafe("inner_circle_register");
    if (!token) {
      setRegisterStatus("error");
      setFeedback({ type: "register", msg: "Security verification failed. Please refresh." });
      return;
    }

    try {
      const res = await fetch("/api/inner-circle/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim(), 
          name: name.trim(), 
          recaptchaToken: token 
        }),
      });
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Registration failed");

      setRegisterStatus("success");
      setFeedback({ 
        type: "register", 
        msg: "Request received. Check your inbox for your access key." 
      });
      trackEvent("inner_circle_register_success", { domain: email.split("@")[1] });
      setEmail("");
      setName("");
    } catch (err: any) {
      setRegisterStatus("error");
      setFeedback({ 
        type: "register", 
        msg: err.message || "Request failed. Please try again." 
      });
    }
  };

  /**
   * VAULT DEPLOYMENT HANDLER (POSTGRES-SYNCED)
   */
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockStatus("submitting");
    setFeedback(null);

    try {
      const res = await fetch("/api/inner-circle/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: accessKey.trim() }),
      });
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Invalid security key");

      setUnlockStatus("success");
      setAlreadyUnlocked(true);
      
      trackEvent("inner_circle_vault_unlocked");
      
      setTimeout(() => {
        router.push(returnTo);
      }, 1200);
    } catch (err: any) {
      setUnlockStatus("error");
      setFeedback({ 
        type: "unlock", 
        msg: err.message || "Invalid key. Please check and try again." 
      });
    }
  };

  /**
   * NEWSLETTER OPT-IN HANDLER
   */
  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterStatus("submitting");
    
    try {
      // Integration with Mailchimp/Resend logic
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();

      setNewsletterStatus("success");
      setFeedback({ type: "newsletter", msg: "Subscription confirmed. Welcome to the mailing list." });
    } catch (err) {
      setNewsletterStatus("error");
      setFeedback({ type: "newsletter", msg: "Signup failed. Please try again." });
    }
  };

  return (
    <Layout 
      title="Inner Circle" 
      description="Private access to exclusive strategic volumes and architectural notes."
    >
      <main className="min-h-screen bg-[#050505] text-zinc-400 pt-32 pb-24">
        {/* Decorative background element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] bg-amber-500/5 blur-[120px] pointer-events-none" />

        <section className="relative mx-auto max-w-6xl px-6">
          <header className="text-center mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 mb-8 text-amber-500/80"
            >
              <ShieldCheck size={14} className="text-amber-500" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em]">Identity Protocol 2.0</span>
            </motion.div>
            <h1 className="font-serif text-5xl md:text-6xl font-medium text-white mb-6 italic tracking-tight">
              The Inner Circle
            </h1>
            <p className="mx-auto max-w-2xl text-sm md:text-base text-zinc-500 font-light leading-relaxed">
              Entry is strictly reserved for stakeholders and collaborators. 
              Authenticating your identity unlocks the complete <span className="text-amber-500/80">Intelligence Portfolio</span>.
            </p>
          </header>

          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            {/* REQUEST ACCESS */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="group rounded-2xl border border-white/5 bg-white/[0.02] p-8 md:p-10 transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="h-10 w-10 bg-zinc-800 rounded-lg flex items-center justify-center text-amber-500 border border-white/10">
                  <Mail size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-serif text-white italic">Request Entry</h2>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600">Verification Required</p>
                </div>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 ml-1">Full Name</label>
                  <input 
                    type="text" required value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3.5 text-sm text-white focus:border-amber-500/40 outline-none transition-all placeholder:text-zinc-700"
                    placeholder="Institutional Identity"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 ml-1">Professional Email</label>
                  <input 
                    type="email" required value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3.5 text-sm text-white focus:border-amber-500/40 outline-none transition-all placeholder:text-zinc-700"
                    placeholder="name@organization.com"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={registerStatus === "submitting" || registerStatus === "success"}
                  className="w-full bg-white text-black py-4 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                >
                  {registerStatus === "submitting" ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                  Issue Access Key
                </button>
                
                <AnimatePresence>
                  {feedback?.type === "register" && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={`p-4 rounded-lg text-xs font-light leading-relaxed border ${registerStatus === "error" ? 'text-red-400 bg-red-500/5 border-red-500/10' : 'text-amber-500 bg-amber-500/5 border-amber-500/10'}`}
                    >
                      {feedback.msg}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>

            {/* UNLOCK VAULT */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] p-8 md:p-10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Lock size={120} strokeWidth={0.5} className="text-amber-500" />
              </div>

              <div className="flex items-center gap-4 mb-10 relative z-10">
                <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <Key size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-serif text-white italic">Unlock Vault</h2>
                  <p className="text-[10px] uppercase tracking-widest text-amber-500/50">Deployment Mode</p>
                </div>
              </div>

              {alreadyUnlocked ? (
                <div className="text-center py-8 relative z-10">
                  <div className="mb-6 inline-block p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <CheckCircle className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-serif text-white italic mb-8">Access Granted</h3>
                  <button 
                    onClick={() => router.push(returnTo)} 
                    className="w-full bg-emerald-600 text-white py-4 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all"
                  >
                    Enter Dashboard <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUnlock} className="space-y-6 relative z-10">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-amber-500/60 ml-1">Cryptographic Key</label>
                    <input 
                      type="password" required value={accessKey} 
                      onChange={e => setAccessKey(e.target.value)}
                      className="w-full bg-black/60 border border-amber-500/20 rounded-lg px-4 py-3.5 font-mono text-sm text-amber-500 focus:border-amber-500/60 outline-none transition-all placeholder:text-amber-900/30"
                      placeholder="ic_••••••••••••"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={unlockStatus === "submitting"}
                    className="w-full border border-amber-500/40 text-amber-500 py-4 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                  >
                    {unlockStatus === "submitting" ? <RefreshCw className="animate-spin" size={16} /> : <Unlock size={16} />}
                    Authenticate
                  </button>
                  <AnimatePresence>
                    {feedback?.type === "unlock" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg bg-red-500/5 text-red-400 text-[11px] border border-red-500/10 font-light"
                      >
                        {feedback.msg}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              )}
            </motion.div>
          </div>
        </section>

        {/* NEWSLETTER / THE BRIEF */}
        <section className="mt-40 border-t border-white/5 pt-32">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="font-serif text-3xl text-white mb-6 italic">The Strategic Brief</h2>
            <p className="text-zinc-500 text-sm font-light leading-relaxed mb-12">
              For those not requiring vault-level access, the Brief offers periodic analysis 
              on institutional design and frontier market strategy.
            </p>
            
            <form onSubmit={handleNewsletterSignup} className="relative group">
              <input 
                type="email" 
                required
                placeholder="Institutional Email"
                className="w-full bg-white/[0.02] border border-white/10 rounded-full px-8 py-5 text-sm text-white focus:border-amber-500/30 outline-none transition-all pr-16"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 bg-amber-500 text-black px-6 rounded-full hover:bg-white transition-colors flex items-center justify-center"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="mt-8 text-[9px] uppercase tracking-[0.4em] text-zinc-700">Signal Only • No Proliferation</p>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default InnerCirclePage;