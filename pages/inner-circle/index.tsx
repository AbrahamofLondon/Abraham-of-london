import * as React from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ShieldCheck, Key, Mail, User, ArrowRight, RefreshCw, CheckCircle } from "lucide-react";

import Layout from "@/components/Layout";
import useAnalytics from "@/hooks/useAnalytics";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";

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

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [accessKey, setAccessKey] = React.useState("");
  const [registerStatus, setRegisterStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [unlockStatus, setUnlockStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = React.useState<{ type: "register" | "unlock"; msg: string } | null>(null);
  const [alreadyUnlocked, setAlreadyUnlocked] = React.useState(false);

  const returnTo = typeof router.query.returnTo === "string" ? router.query.returnTo : "/canon";

  React.useEffect(() => {
    setAlreadyUnlocked(hasInnerCircleCookie());
  }, []);

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
        body: JSON.stringify({ email, name, returnTo, recaptchaToken: token }),
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

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockStatus("submitting");
    setFeedback(null);

    try {
      const res = await fetch("/api/inner-circle/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: accessKey, returnTo }),
      });
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Invalid key");

      setUnlockStatus("success");
      setAlreadyUnlocked(true);
      setTimeout(() => void router.push(data.redirectTo || returnTo), 1000);
    } catch (err: any) {
      setUnlockStatus("error");
      setFeedback({ type: "unlock", msg: err.message });
    }
  };

  return (
    <Layout title="Inner Circle" description="Private access to the Abraham of London archives.">
      <main className="min-h-screen bg-[#050505] text-cream pt-32 pb-20">
        <section className="mx-auto max-w-5xl px-6">
          
          <header className="mb-20 text-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5">
              <ShieldCheck size={14} className="text-gold" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Membership Authority</span>
            </motion.div>
            <h1 className="font-serif text-5xl font-bold text-white sm:text-7xl">Inner Circle</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
              Access exclusive strategic volumes, early drafts, and architectural notes. 
              Entry is reserved for those who carry the weight of responsibility.
            </p>
          </header>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* REGISTER */}
            <motion.div className="rounded-[2.5rem] border border-white/5 bg-zinc-900/30 p-10 backdrop-blur-xl">
              <h2 className="font-serif text-2xl font-bold text-white mb-8">Request Entry</h2>
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gold/60"><User size={12}/> Name</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold/50 transition-all" placeholder="Legal or common name" />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gold/60"><Mail size={12}/> Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold/50 transition-all" placeholder="advisory@firm.com" />
                </div>
                <button disabled={registerStatus === "submitting"} className="w-full bg-gold text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white transition-all flex justify-center items-center gap-2">
                  {registerStatus === "submitting" ? <RefreshCw className="animate-spin" size={16}/> : "Dispatch Access Key"}
                </button>
                {feedback?.type === "register" && (
                  <p className={`text-xs font-bold text-center ${registerStatus === "error" ? "text-rose-400" : "text-emerald-400"}`}>{feedback.msg}</p>
                )}
              </form>
            </motion.div>

            {/* UNLOCK */}
            <motion.div className="rounded-[2.5rem] border border-gold/20 bg-gold/5 p-10 backdrop-blur-xl">
              <h2 className="font-serif text-2xl font-bold text-white mb-8">Unlock Vault</h2>
              <form onSubmit={handleUnlock} className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gold/60"><Key size={12}/> Access Key</label>
                  <input type="password" required value={accessKey} onChange={e => setAccessKey(e.target.value)} className="w-full bg-black/40 border border-gold/20 rounded-xl px-4 py-3 font-mono text-gold outline-none focus:border-gold transition-all" placeholder="ic_••••••••••••" />
                </div>
                <button disabled={unlockStatus === "submitting" || alreadyUnlocked} className="w-full border border-gold text-gold py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gold hover:text-black transition-all flex justify-center items-center gap-2">
                  {alreadyUnlocked ? <CheckCircle size={16}/> : unlockStatus === "submitting" ? <RefreshCw className="animate-spin" size={16}/> : "Apply Security Key"}
                </button>
                {feedback?.type === "unlock" && (
                  <p className="text-xs font-bold text-center text-rose-400">{feedback.msg}</p>
                )}
              </form>
              <div className="mt-8 pt-8 border-t border-gold/10 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Access persists on this device until cleared</p>
              </div>
            </motion.div>
          </div>

        </section>
      </main>
    </Layout>
  );
};

export default InnerCirclePage;
