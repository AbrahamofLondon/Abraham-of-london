/* components/TeaserRequest.tsx — FULL PRODUCTION VERSION */
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRecaptchaToken } from "@/lib/recaptchaClient";
import { Loader2, CheckCircle2, AlertCircle, ShieldAlert, Share2, Twitter, Link as LinkIcon } from "lucide-react";

interface TeaserRequestProps {
  className?: string;
  variant?: "default" | "minimal" | "featured";
}

type RequestStatus = "idle" | "success" | "error" | "loading" | "rate-limited";

export default function TeaserRequest({ className = "", variant = "default" }: TeaserRequestProps) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");
  const [status, setStatus] = React.useState<RequestStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  
  const [submitAttempts, setSubmitAttempts] = React.useState(0);
  const [lastSubmitTime, setLastSubmitTime] = React.useState<number>(0);

  const SHARE_URL = "https://abrahamoflondon.com/memoir";
  const SHARE_TEXT = "Just requested the first intelligence briefing of 'Fathering Without Fear'. Access the teaser here:";

  const handleCopy = () => {
    navigator.clipboard.writeText(`${SHARE_TEXT} ${SHARE_URL}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || (submitAttempts >= 3 && Date.now() - lastSubmitTime < 60000)) {
      setStatus("rate-limited");
      return;
    }

    if (honeypot) {
      setStatus("success");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const recaptchaToken = await getRecaptchaToken("teaser_request");
      if (!recaptchaToken) throw new Error("SECURITY_SHIELD_ACTIVE");

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || "Principal",
          enquiryType: "Fathering Without Fear Teaser",
          message: "Automated Teaser Request via Website Widget",
          teaserOptIn: true,
          newsletterOptIn: true,
          gRecaptchaToken: recaptchaToken,
        }),
      });

      if (res.status === 429) {
        setStatus("rate-limited");
        return;
      }

      if (!res.ok) throw new Error("TRANSMISSION_FAILED");

      setStatus("success");
      setSubmitAttempts(prev => prev + 1);
      setLastSubmitTime(Date.now());
      setEmail("");
      setName("");
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message === "SECURITY_SHIELD_ACTIVE" ? "Security check failed." : "Transmission failed.");
    }
  }

  // Common Share Component to avoid repetition
  const ShareActions = () => (
    <div className="space-y-3 pt-4 border-t border-white/5">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 text-center">Advocate the Mission</p>
      <div className="flex gap-2">
        <button 
          onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`, '_blank')}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white/5 border border-white/10 py-2 text-[10px] text-white hover:bg-white/10 transition-all"
        >
          <Twitter className="w-3 h-3" /> Twitter
        </button>
        <button 
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white/5 border border-white/10 py-2 text-[10px] text-white hover:bg-white/10 transition-all"
        >
          {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <LinkIcon className="w-3 h-3" />}
          {copied ? "Copied" : "Copy Link"}
        </button>
      </div>
    </div>
  );

  // --- RENDER LOGIC ---
  return (
    <motion.div className={className} layout>
      <AnimatePresence mode="wait">
        {status !== "success" ? (
          <motion.form 
            key="form"
            onSubmit={handleSubmit} 
            exit={{ opacity: 0, y: -10 }}
            className={variant === "featured" ? "space-y-4" : "flex flex-col gap-3"}
          >
            {variant === "featured" && (
              <div className="text-center mb-6">
                <h3 className="font-serif text-2xl font-bold text-white italic">
                  Fathering <span className="text-amber-500">Without Fear</span>
                </h3>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Intelligence Briefing</p>
              </div>
            )}

            <input type="text" className="hidden" tabIndex={-1} value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            
            <div className={variant === "featured" ? "grid grid-cols-1 gap-4" : "flex flex-col gap-2"}>
              {variant !== "minimal" && (
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full rounded-xl border border-white/5 bg-white/5 px-5 py-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={status === "loading"}
                />
              )}
              <input
                type="email"
                placeholder="Secure Email Address"
                required
                className="w-full rounded-xl border border-white/5 bg-white/5 px-5 py-4 text-sm text-white focus:border-amber-500 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading"}
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-amber-500 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-black hover:bg-amber-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === "loading" ? <Loader2 className="animate-spin w-4 h-4" /> : "Access The Teaser"}
            </button>
          </motion.form>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 py-4"
          >
            <div className="flex justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-white font-serif text-lg">Transmission Established</h3>
            <p className="text-zinc-400 text-xs">Briefing sent to your inbox.</p>
            <ShareActions />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Alerts */}
      <AnimatePresence>
        {status === "rate-limited" && (
          <p className="mt-4 text-center text-[10px] text-amber-500 uppercase tracking-widest">Wait 60s before retrying.</p>
        )}
        {status === "error" && (
          <p className="mt-4 text-center text-[10px] text-red-500 uppercase tracking-widest">{errorMessage}</p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}