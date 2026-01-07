/* pages/inner-circle/index.tsx - HARDENED ACCESS CONTROL */
import * as React from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ShieldCheck, Key, Mail, User, RefreshCw, CheckCircle } from "lucide-react";

import Layout from "@/components/Layout";
import useAnalytics from "@/hooks/useAnalytics";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";
import { sanitizeData } from "@/lib/server/md-utils";

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";

/**
 * CLIENT-SIDE ACCESS VERIFICATION
 */
function hasInnerCircleCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .some((c) => c.startsWith(`${INNER_CIRCLE_COOKIE_NAME}=true`));
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
  const returnTo = typeof router.query.returnTo === "string" ? router.query.returnTo : "/canon";

  React.useEffect(() => {
    setAlreadyUnlocked(hasInnerCircleCookie());
  }, []);

  /**
   * MEMBERSHIP REQUEST HANDLER
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
      // PAYLOAD SANITIZATION: Prevents injection of undefined values into API
      const payload = sanitizeData({ email, name, returnTo, recaptchaToken: token });
      
      const res = await fetch("/api/inner-circle/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Registration failed");

      setRegisterStatus("success");
      setFeedback({ type: "register", msg: "Access key dispatched. Check your inbox." });
      trackEvent("inner_circle_register_success", { domain: email.split("@")[1] });
    } catch (err: any) {
      setRegisterStatus("error");
      setFeedback({ type: "register", msg: err.message });
    }
  };

  /**
   * VAULT DEPLOYMENT HANDLER
   */
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockStatus("submitting");
    setFeedback(null);

    try {
      const payload = sanitizeData({ key: accessKey, returnTo });
      
      const res = await fetch("/api/inner-circle/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Invalid security key");

      setUnlockStatus("success");
      setAlreadyUnlocked(true);
      
      // Delay for visual confirmation of the "CheckCircle" state
      setTimeout(() => void router.push(data.redirectTo || returnTo), 1200);
    } catch (err: any) {
      setUnlockStatus("error");
      setFeedback({ type: "unlock", msg: err.message });
    }
  };

  return (
    <Layout title="Inner Circle" description="Private access to the Abraham of London transmission archives.">
      <main className="min-h-screen bg-[#050505] text-zinc-300 pt-32 pb-20 selection:bg-amber-500 selection:text-black">
        <section className="mx-auto max-w-5xl px-6">
          
          <header className="mb-20 text-center">
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/5 px-4 py-1.5"
            >
              <ShieldCheck size={14} className="text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Membership Authority</span>
            </motion.div>
            <h1 className="font-serif text-5xl font-bold text-white sm:text-7xl">Inner Circle</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
              Access exclusive strategic volumes, early manuscripts, and architectural notes. 
              Entry is reserved for those who carry the weight of real responsibility.
            </p>
          </header>

          <div className="grid gap-12 lg:grid-cols-2">
            
            {/* REQUEST ENTRY CARD */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-[2.5rem] border border-white/5 bg-zinc-900/30 p-10 backdrop-blur-xl shadow-2xl"
            >
              <h2 className="font-serif text-2xl font-bold text-white mb-8">Request Entry</h2>
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500/60"><User size={12}/> Identity</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-600" placeholder="Legal or common name" />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500/60"><Mail size={12}/> Transmission Endpoint</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-600" placeholder="advisory@firm.com" />
                </div>
                <button disabled={registerStatus === "submitting"} className="w-full bg-amber-500 text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white transition-all flex justify-center items-center gap-2 shadow-lg shadow-amber-900/20">
                  {registerStatus === "submitting" ? <RefreshCw className="animate-spin" size={16}/> : "Dispatch Access Key"}
                </button>
                {feedback?.type === "register" && (
                  <p className={`text-xs font-bold text-center ${registerStatus === "error" ? "text-rose-400" : "text-emerald-400"}`}>{feedback.msg}</p>
                )}
              </form>
            </motion.div>

            {/* UNLOCK VAULT CARD */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-[2.5rem] border border-amber-500/20 bg-amber-500/5 p-10 backdrop-blur-xl shadow-2xl"
            >
              <h2 className="font-serif text-2xl font-bold text-white mb-8">Unlock Vault</h2>
              <form onSubmit={handleUnlock} className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500/60"><Key size={12}/> Security Key</label>
                  <input type="password" required value={accessKey} onChange={e => setAccessKey(e.target.value)} className="w-full bg-black/40 border border-amber-500/20 rounded-xl px-4 py-3 font-mono text-amber-500 outline-none focus:border-amber-500 transition-all placeholder:text-amber-900/40" placeholder="ic_••••••••••••" />
                </div>
                <button disabled={unlockStatus === "submitting" || alreadyUnlocked} className="w-full border border-amber-500 text-amber-500 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 hover:text-black transition-all flex justify-center items-center gap-2">
                  {alreadyUnlocked ? <CheckCircle size={16}/> : unlockStatus === "submitting" ? <RefreshCw className="animate-spin" size={16}/> : "Apply Security Key"}
                </button>
                {feedback?.type === "unlock" && (
                  <p className="text-xs font-bold text-center text-rose-400">{feedback.msg}</p>
                )}
              </form>
              <div className="mt-8 pt-8 border-t border-amber-500/10 text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Access persists on this device until clear_cache</p>
              </div>
            </motion.div>
          </div>

        </section>
      </main>
    </Layout>
  );
};

export default InnerCirclePage;
