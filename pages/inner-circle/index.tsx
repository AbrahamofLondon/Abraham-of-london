/* pages/inner-circle/index.tsx - HARDENED ACCESS CONTROL */
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
    const unlocked = hasInnerCircleCookie();
    setAlreadyUnlocked(unlocked);
    
    if (unlocked) {
      // Auto-redirect if already unlocked and trying to access
      const redirectTimer = setTimeout(() => {
        if (returnTo && returnTo !== window.location.pathname) {
          router.push(returnTo);
        }
      }, 1000);
      return () => clearTimeout(redirectTimer);
    }
  }, [router, returnTo]);

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
      const payload = sanitizeData({ 
        email: email.trim(), 
        name: name.trim(), 
        returnTo, 
        recaptchaToken: token 
      });
      
      const res = await fetch("/api/inner-circle/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Registration failed");

      setRegisterStatus("success");
      setFeedback({ 
        type: "register", 
        msg: "Access key dispatched. Check your inbox within 5 minutes." 
      });
      trackEvent("inner_circle_register_success", { domain: email.split("@")[1] });
      
      // Clear form on success
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
   * VAULT DEPLOYMENT HANDLER
   */
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockStatus("submitting");
    setFeedback(null);

    try {
      const payload = sanitizeData({ 
        key: accessKey.trim(), 
        returnTo 
      });
      
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
      setTimeout(() => {
        router.push(data.redirectTo || returnTo || "/inner-circle/dashboard");
      }, 1200);
    } catch (err: any) {
      setUnlockStatus("error");
      setFeedback({ 
        type: "unlock", 
        msg: err.message || "Invalid key. Please check and try again." 
      });
    }
  };

  const handleViewContent = () => {
    router.push('/inner-circle/dashboard');
  };

  const handleLearnMore = () => {
    router.push('/about/inner-circle');
  };

  return (
    <Layout 
      title="Inner Circle | Abraham of London" 
      description="Private access to exclusive strategic volumes, early manuscripts, and architectural notes."
      noIndex={false}
    >
      <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-gray-300 pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 mb-6"
            >
              <ShieldCheck size={16} className="text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
                Members Only
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            >
              The Inner Circle
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mx-auto max-w-3xl text-lg text-gray-400 mb-10"
            >
              Access exclusive strategic volumes, early manuscripts, and architectural notes. 
              Entry is reserved for those who carry the weight of real responsibility.
            </motion.p>
          </div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
          >
            {[
              { label: "Volumes", value: "50+", icon: BookOpen },
              { label: "Members", value: "250+", icon: Users },
              { label: "Frameworks", value: "30+", icon: ShieldCheck },
              { label: "Access", value: "24/7", icon: Lock }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
                <stat.icon className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            
            {/* REQUEST ENTRY CARD */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/50 to-black/50 p-8 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <Mail className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-white">Request Access</h2>
                  <p className="text-sm text-gray-400">Apply for Inner Circle membership</p>
                </div>
              </div>
              
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <User className="h-4 w-4" />
                    Your Name
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    placeholder="Legal or common name"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    placeholder="advisory@firm.com"
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={registerStatus === "submitting" || registerStatus === "success"}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black py-4 rounded-xl font-bold hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-900/30"
                >
                  {registerStatus === "submitting" ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : registerStatus === "success" ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Request Sent
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      Request Access Key
                    </>
                  )}
                </button>
                
                {feedback?.type === "register" && (
                  <div className={`p-4 rounded-xl text-sm font-medium ${
                    registerStatus === "error" 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {feedback.msg}
                  </div>
                )}
              </form>
              
              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="text-sm text-gray-400">
                  <p className="mb-3">What happens next:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Access key will be emailed within 24 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>One-time verification required</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Full access to all Inner Circle resources</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* UNLOCK VAULT CARD */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-8 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-gradient-to-br from-amber-900 to-amber-800 rounded-xl flex items-center justify-center">
                  <Key className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-white">Unlock Vault</h2>
                  <p className="text-sm text-amber-400">Already have an access key?</p>
                </div>
              </div>
              
              {alreadyUnlocked ? (
                <div className="text-center py-8">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 mb-6">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Already Unlocked</h3>
                  <p className="text-gray-400 mb-8">
                    You already have access to the Inner Circle vault.
                  </p>
                  <button
                    onClick={handleViewContent}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-xl font-bold hover:from-emerald-400 hover:to-emerald-500 transition-all flex items-center justify-center gap-3"
                  >
                    View Content
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleUnlock} className="space-y-6">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-amber-300">
                        <Key className="h-4 w-4" />
                        Security Key
                      </label>
                      <input 
                        type="password" 
                        required 
                        value={accessKey} 
                        onChange={e => setAccessKey(e.target.value)}
                        className="w-full bg-black/40 border border-amber-500/30 rounded-xl px-4 py-3.5 font-mono text-amber-400 placeholder:text-amber-900/40 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                        placeholder="ic_••••••••••••"
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={unlockStatus === "submitting" || unlockStatus === "success"}
                      className="w-full border-2 border-amber-500 text-amber-500 py-4 rounded-xl font-bold hover:bg-amber-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                    >
                      {unlockStatus === "submitting" ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          Verifying...
                        </>
                      ) : unlockStatus === "success" ? (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          Access Granted
                        </>
                      ) : (
                        <>
                          <Unlock className="h-5 w-5" />
                          Unlock Vault
                        </>
                      )}
                    </button>
                    
                    {feedback?.type === "unlock" && (
                      <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium border border-red-500/20">
                        {feedback.msg}
                      </div>
                    )}
                  </form>
                  
                  <div className="mt-8 pt-8 border-t border-amber-500/10">
                    <p className="text-xs text-amber-500/60 uppercase tracking-widest mb-2">
                      Access Information
                    </p>
                    <p className="text-sm text-amber-400/80">
                      Access persists on this device. Clear browser data to revoke.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </div>

          {/* Bottom CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleLearnMore}
                className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
              >
                <ShieldCheck className="h-5 w-5" />
                Learn More About Inner Circle
              </button>
              <button
                onClick={() => router.push('/contact')}
                className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
              >
                <Mail className="h-5 w-5" />
                Contact Support
              </button>
            </div>
          </motion.div>
        </section>
      </main>
    </Layout>
  );
};

export default InnerCirclePage;