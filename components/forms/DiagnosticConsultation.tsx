"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ShieldCheck, ChevronRight, Loader2 } from "lucide-react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

type Intent = "strategy" | "intelligence" | "invitation-request" | "other";

const DiagnosticConsultation: React.FC = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  
  const [formData, setFormData] = React.useState({
    intent: "strategy" as Intent,
    name: "",
    email: "",
    message: "",
    botField: "", // Honeypot
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure reCAPTCHA is ready
    if (!executeRecaptcha) {
      setStatus("error");
      return;
    }

    setLoading(true);
    setStatus("idle");

    try {
      // Generate token for the specific action
      const gRecaptchaToken = await executeRecaptcha("diagnostic_form");

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          gRecaptchaToken, // Required by the security middleware
        }),
      });

      const data = await res.json();
      
      if (data.ok) {
        setStatus("success");
        setStep(3);
      } else {
        setStatus("error");
      }
    } catch (_err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full max-w-2xl mx-auto bg-zinc-950 border border-zinc-800/50 p-8 rounded-sm shadow-2xl">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <h3 className="font-serif text-2xl text-white mb-2">Define Engagement Intent</h3>
            <p className="text-zinc-500 text-sm mb-8 italic">Select the nature of your inquiry for proper routing.</p>
            
            <div className="grid grid-cols-1 gap-4 mb-8">
              {(["strategy", "intelligence", "invitation-request"] as Intent[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, intent: type });
                    setStep(2);
                  }}
                  className="flex items-center justify-between p-4 border border-zinc-800 hover:border-gold/50 hover:bg-gold/[0.02] transition-all group text-left"
                >
                  <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 group-hover:text-gold transition-colors">
                    {type.replace("-", " ")}
                  </span>
                  <ChevronRight size={14} className="text-zinc-700 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.form
            key="step2"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Honeypot - Hidden from Humans */}
            <input 
              type="text" 
              name="botField" 
              className="hidden" 
              tabIndex={-1}
              autoComplete="off"
              onChange={(e) => setFormData({...formData, botField: e.target.value})} 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Principal Name</label>
                <input
                  required
                  type="text"
                  className="w-full bg-transparent border-b border-zinc-800 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Secure Email</label>
                <input
                  required
                  type="email"
                  className="w-full bg-transparent border-b border-zinc-800 py-2 text-white focus:outline-none focus:border-gold transition-colors"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Brief / Context</label>
              <textarea
                required
                rows={4}
                className="w-full bg-transparent border border-zinc-800 p-4 text-white focus:outline-none focus:border-gold transition-colors resize-none"
                placeholder="Detail the parameters of your request..."
                onChange={(e) => setFormData({...formData, message: e.target.value})}
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
              >
                ← Back
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-3 bg-white text-black px-8 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-gold transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                Transmit Request
              </button>
            </div>
            {status === "error" && (
              <p className="text-red-500 text-[10px] uppercase tracking-tighter text-right">Error: Transmission Failed. Verify security clearance.</p>
            )}
          </motion.form>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-gold/30 bg-gold/5 mb-6 text-gold">
              <ShieldCheck size={32} />
            </div>
            <h3 className="font-serif text-3xl text-white mb-4">Transmission Received</h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto leading-relaxed italic">
              Your brief has been logged within our secure infrastructure. An operative will contact you via the provided secure channel if clearance is granted.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default DiagnosticConsultation;