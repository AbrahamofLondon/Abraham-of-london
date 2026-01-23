/* pages/inner-circle/index.tsx — HARDENED ACCESS CONTROL (INTEGRITY MODE) */
import * as React from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Key, 
  Mail, 
  User, 
  RefreshCw, 
  CheckCircle,
  Lock,
  Unlock,
  ArrowRight,
  BookOpen,
  Users
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
  const [feedback, setFeedback] = React.useState<{ type: "register" | "unlock"; msg: string } | null>(null);
  const [alreadyUnlocked, setAlreadyUnlocked] = React.useState(false);

  // REDIRECTION LOGIC
  const returnTo = typeof router.query.returnTo === "string" ? router.query.returnTo : "/inner-circle/dashboard";

  React.useEffect(() => {
    const unlocked = hasInnerCircleCookie();
    setAlreadyUnlocked(unlocked);
    
    if (unlocked && router.isReady) {
      const redirectTimer = setTimeout(() => {
        // Only redirect if we aren't already where we want to be
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

  return (
    <Layout 
      title="Inner Circle" 
      description="Private access to exclusive strategic volumes and architectural notes."
    >
      <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-gray-300 pt-24 pb-20">
        <section className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 mb-6 text-amber-500">
              <ShieldCheck size={16} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Institutional Access</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">The Inner Circle</h1>
            <p className="mx-auto max-w-3xl text-lg text-gray-400">Entry is reserved for those who carry the weight of real responsibility.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* REQUEST ENTRY */}
            <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center text-black">
                  <Mail className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-white">Request Access</h2>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Name</label>
                  <input 
                    type="text" required value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-amber-500/50 outline-none transition-all"
                    placeholder="Full Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Email</label>
                  <input 
                    type="email" required value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-amber-500/50 outline-none transition-all"
                    placeholder="advisory@firm.com"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={registerStatus === "submitting" || registerStatus === "success"}
                  className="w-full bg-amber-500 text-black py-4 rounded-xl font-bold hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {registerStatus === "submitting" ? <RefreshCw className="animate-spin" /> : <ShieldCheck />}
                  Request Access Key
                </button>
                {feedback?.type === "register" && (
                  <div className={`p-4 rounded-xl text-sm ${registerStatus === "error" ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                    {feedback.msg}
                  </div>
                )}
              </form>
            </div>

            {/* UNLOCK VAULT */}
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 bg-amber-900/50 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-500">
                  <Key className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-white">Unlock Vault</h2>
              </div>

              {alreadyUnlocked ? (
                <div className="text-center py-10">
                  <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-white mb-6">Vault Unlocked</h3>
                  <button onClick={() => router.push(returnTo)} className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                    Enter Dashboard <ArrowRight />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUnlock} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-amber-500/60 ml-1">Security Key</label>
                    <input 
                      type="password" required value={accessKey} 
                      onChange={e => setAccessKey(e.target.value)}
                      className="w-full bg-black/40 border border-amber-500/30 rounded-xl px-4 py-3.5 font-mono text-amber-400 focus:border-amber-500 outline-none transition-all"
                      placeholder="ic_••••••••••••"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={unlockStatus === "submitting"}
                    className="w-full border-2 border-amber-500 text-amber-500 py-4 rounded-xl font-bold hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {unlockStatus === "submitting" ? <RefreshCw className="animate-spin" /> : <Unlock />}
                    Unlock Vault
                  </button>
                  {feedback?.type === "unlock" && (
                    <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/20">
                      {feedback.msg}
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default InnerCirclePage;