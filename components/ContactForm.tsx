/* components/ContactForm.tsx — INSTITUTIONAL ENGAGEMENT INTERFACE */
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { safeString } from "@/lib/utils/safe";
import { getRecaptchaToken } from "@/lib/recaptchaClient";
import { Loader2, Send, ShieldCheck, CheckCircle2, AlertCircle, Twitter, Link as LinkIcon, Activity } from "lucide-react";

interface ContactFormData {
  name: string;
  email: string;
  enquiryType: string;
  message: string;
  botField: string;
  teaserOptIn: boolean;
  newsletterOptIn: boolean;
}

const TransmissionPulse = () => (
  <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
    <svg className="absolute w-0 h-0">
      <filter id="void-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </svg>
    <motion.div
      animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute inset-0 rounded-full bg-amber-500/20 blur-3xl"
    />
    <motion.div
      animate={{ 
        scale: [1, 1.2, 1], 
        borderWidth: ["1px", "2px", "1px"],
        borderColor: ["rgba(245,158,11,0.1)", "rgba(245,158,11,0.4)", "rgba(245,158,11,0.1)"]
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "anticipate" }}
      className="absolute inset-4 rounded-full border border-amber-500/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
    />
    <div className="relative z-10 flex items-center justify-center w-24 h-24 rounded-full bg-zinc-950 border border-white/10 overflow-hidden shadow-2xl">
      <div className="absolute inset-0 opacity-20" style={{ filter: 'url(#void-grain)' }} />
      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
        <CheckCircle2 className="w-10 h-10 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
      </motion.div>
    </div>
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ y: [0, -40, 0], opacity: [0, 0.5, 0], x: i === 1 ? [-20, 20] : [20, -20] }}
        transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
        className="absolute w-1 h-1 bg-amber-400 rounded-full"
      />
    ))}
  </div>
);

export default function ContactForm() {
  const [form, setForm] = React.useState<ContactFormData>({
    name: "",
    email: "",
    enquiryType: "General",
    message: "",
    botField: "",
    teaserOptIn: false,
    newsletterOptIn: false,
  });

  const [status, setStatus] = React.useState<"idle" | "success" | "error" | "loading" | "rate-limited">("idle");
  const [statusMessage, setStatusMessage] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [submitAttempts, setSubmitAttempts] = React.useState(0);
  const [lastSubmitTime, setLastSubmitTime] = React.useState<number>(0);

  // FIXED: Logic moved to component scope for accessibility in JSX
  const isActuallyRateLimited = submitAttempts >= 5 && Date.now() - lastSubmitTime < 60_000;

  const SHARE_URL = "https://abrahamoflondon.com";
  const SHARE_TEXT = "Intelligence briefing requested. Engaging with the Abraham of London protocol.";

  const handleCopy = () => {
    navigator.clipboard.writeText(`${SHARE_TEXT} ${SHARE_URL}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || isActuallyRateLimited) return;

    setStatus("loading");
    setStatusMessage("");

    try {
      if (form.botField) {
        setTimeout(() => setStatus("success"), 1500);
        return;
      }

      const gRecaptchaToken = await getRecaptchaToken("contact_form");
      if (!gRecaptchaToken) throw new Error("Security verification failed.");

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: safeString(form.name).slice(0, 100),
          email: safeString(form.email).slice(0, 255),
          gRecaptchaToken, 
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) { setStatus("rate-limited"); return; }
        throw new Error(data.message || "Transmission interrupted.");
      }

      setStatus("success");
      setSubmitAttempts((prev) => prev + 1);
      setLastSubmitTime(Date.now());
    } catch (err: any) {
      setStatus("error");
      setStatusMessage(err.message || "A connection error occurred.");
    }
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {status !== "success" ? (
          <motion.form 
            key="contact-form"
            onSubmit={handleSubmit} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            className="relative space-y-6 rounded-3xl border border-white/10 bg-gradient-to-br from-black/60 via-zinc-950 to-black/80 p-8 shadow-2xl backdrop-blur-md"
            noValidate
          >
            <input type="text" name="botField" className="hidden" value={form.botField} onChange={handleInputChange} tabIndex={-1} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/80">Principal Name</label>
                <input name="name" type="text" value={form.name} onChange={handleInputChange} required placeholder="John Doe" className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white focus:border-amber-500 outline-none transition-all placeholder:text-zinc-700" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/80">Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handleInputChange} required placeholder="secure@domain.com" className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white focus:border-amber-500 outline-none transition-all placeholder:text-zinc-700" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/80">Nature of Engagement</label>
              <div className="relative">
                <select name="enquiryType" value={form.enquiryType} onChange={handleInputChange} className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white focus:border-amber-500 outline-none appearance-none cursor-pointer transition-all">
                  <option value="General">General Inquiry</option>
                  <option value="Briefing">Intelligence Briefing</option>
                  <option value="Inner Circle">Inner Circle Access</option>
                  <option value="Fathering">Fathering Without Fear</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-amber-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/80">Intelligence Briefing</label>
              <textarea name="message" value={form.message} onChange={handleInputChange} required rows={5} placeholder="Provide context..." className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white focus:border-amber-500 outline-none resize-none transition-all placeholder:text-zinc-700" />
            </div>
            <div className="space-y-4 pt-2">
              <label className="flex cursor-pointer items-center gap-3 text-[11px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-white">
                <input type="checkbox" name="teaserOptIn" checked={form.teaserOptIn} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-white/20 bg-white/5 text-amber-500" />
                <span>Request <span className="text-amber-400 font-bold">Fathering Without Fear</span> Teaser</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-[11px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-white">
                <input type="checkbox" name="newsletterOptIn" checked={form.newsletterOptIn} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-white/20 bg-white/5 text-amber-500" />
                <span>Register for <span className="text-amber-400 font-bold">Institutional Updates</span></span>
              </label>
            </div>
            <button type="submit" disabled={status === "loading" || isActuallyRateLimited} className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-amber-600 to-amber-400 px-6 py-4 font-black text-black text-[11px] uppercase tracking-[0.3em] transition-all hover:from-amber-500 hover:to-amber-300 disabled:opacity-50 flex items-center justify-center gap-2">
              {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /> <span>Transmit Signal</span></>}
            </button>
            {status === "error" && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-[10px] uppercase tracking-widest text-red-400"><AlertCircle size={16} /><p>{statusMessage}</p></div>
            )}
            <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-mono">
              <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-zinc-700" /> Encrypted Channel</span>
              <span>Ref: AOFL-{new Date().getFullYear()}</span>
            </div>
          </motion.form>
        ) : (
          <motion.div key="success-screen" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 rounded-3xl border border-white/10 bg-black p-12 shadow-2xl">
            <TransmissionPulse />
            <div className="space-y-2">
              <h2 className="text-3xl font-serif italic text-white">Signal Authenticated</h2>
              <div className="flex items-center justify-center gap-2 text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-mono">
                <Activity size={10} className="text-amber-500 animate-pulse" />
                AOFL-PROTOCOL-{new Date().getUTCFullYear()}-ACK
              </div>
            </div>
            <div className="pt-8 border-t border-white/5 space-y-6">
              <p className="text-[10px] uppercase tracking-[0.4em] text-amber-500 font-black">Advocate the Mission</p>
              <div className="flex gap-4">
                <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`, '_blank')} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-4 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">
                  <Twitter className="w-4 h-4 text-sky-400" /> Share Access
                </button>
                <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-4 text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4 text-amber-500" />}
                  {copied ? "Link Copied" : "Copy Protocol"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}