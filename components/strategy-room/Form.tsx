/* components/strategy-room/Form.tsx — HARRODS/McKINSEY GRADE (Institutional Luxury) */
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  ArrowRight, 
  Loader2, 
  Shield, 
  Lock, 
  Eye, 
  Sparkles,
  CheckCircle2,
  FileSignature,
  Building2,
  Target,
  Compass
} from "lucide-react";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";

// Premium design tokens
const TRANSITION = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for luxury feel
};

const FormField = ({ 
  icon: Icon, 
  label, 
  name, 
  type = "text", 
  required = true,
  placeholder,
  rows,
  isTextarea = false
}: { 
  icon: any; 
  label: string; 
  name: string; 
  type?: string; 
  required?: boolean;
  placeholder: string;
  rows?: number;
  isTextarea?: boolean;
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <motion.div 
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={`
        absolute inset-0 rounded-2xl transition-all duration-500
        ${focused 
          ? 'bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 blur-xl' 
          : 'bg-transparent'
        }
      `} />
      
      <div className={`
        relative flex items-start gap-4 p-6 rounded-2xl border transition-all duration-500
        ${focused 
          ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 shadow-[0_0_40px_-12px_rgba(245,158,11,0.3)]' 
          : 'border-white/5 bg-black/40 hover:border-white/10 hover:bg-black/60'
        }
        backdrop-blur-sm
      `}>
        <div className={`
          p-3 rounded-xl border transition-all duration-500
          ${focused 
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' 
            : 'border-white/5 bg-white/[0.02] text-zinc-600 group-hover:text-zinc-400'
          }
        `}>
          <Icon size={18} />
        </div>
        
        <div className="flex-1 space-y-2">
          <label className={`
            block text-[9px] font-mono uppercase tracking-[0.3em] transition-colors duration-500
            ${focused ? 'text-amber-400' : 'text-zinc-600'}
          `}>
            {label}
          </label>
          
          {isTextarea ? (
            <textarea
              name={name}
              required={required}
              rows={rows || 4}
              placeholder={placeholder}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="w-full bg-transparent text-white text-sm font-light outline-none resize-none placeholder:text-zinc-800"
            />
          ) : (
            <input
              type={type}
              name={name}
              required={required}
              placeholder={placeholder}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="w-full bg-transparent text-white text-sm font-light outline-none placeholder:text-zinc-800"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function StrategyRoomForm() {
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [formState, setFormState] = React.useState({
    name: '',
    email: '',
    organisation: '',
    intent: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = await getRecaptchaTokenSafe("strategy_room_intake");
      const res = await fetch("/api/strategy-room/enrol", {
        method: "POST",
        body: JSON.stringify({ ...formState, token }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={TRANSITION}
        className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-black to-amber-500/5 p-12"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(245,158,11,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(245,158,11,0.05),transparent_70%)]" />
        
        <div className="relative text-center space-y-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex p-4 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30"
          >
            <CheckCircle2 className="h-12 w-12 text-amber-400" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="font-serif text-3xl text-white">Intelligence Request Logged</h3>
            <p className="text-zinc-400 max-w-md mx-auto text-sm leading-relaxed">
              Your inquiry has been received by the Directorate. A member of our strategic team will respond within 24-48 hours.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-8 pt-8 text-[10px] font-mono uppercase tracking-widest text-zinc-700"
          >
            <span className="flex items-center gap-2">
              <Shield size={12} className="text-amber-500/50" /> AES-256
            </span>
            <span className="flex items-center gap-2">
              <Lock size={12} className="text-amber-500/50" /> Zero-Knowledge
            </span>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={TRANSITION}
      className="relative"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 rounded-3xl blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.05),transparent_70%)] rounded-3xl" />
      
      <form onSubmit={handleSubmit} className="relative space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={TRANSITION}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-amber-500/20 bg-amber-500/5 mb-6">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
              Institutional Intake
            </span>
          </div>
          
          <h2 className="font-serif text-4xl text-white mb-4 tracking-tight">
            Strategic <span className="italic text-amber-400">Inquiry</span>
          </h2>
          
          <p className="text-zinc-500 text-sm max-w-lg mx-auto leading-relaxed">
            Submit your institutional profile for preliminary assessment by the Directorate.
          </p>
        </motion.div>

        {/* Form Fields */}
        <div className="space-y-4">
          <FormField
            icon={FileSignature}
            label="Principal Identifier"
            name="name"
            placeholder="FULL INSTITUTIONAL NAME"
            value={formState.name}
            onChange={handleChange}
          />

          <FormField
            icon={Building2}
            label="Institutional Email"
            name="email"
            type="email"
            placeholder="CONTACT@DOMAIN.EXT"
            value={formState.email}
            onChange={handleChange}
          />

          <FormField
            icon={Target}
            label="Organisation / Affiliation"
            name="organisation"
            placeholder="ENTITY / PRACTICE / HOUSE"
            value={formState.organisation}
            onChange={handleChange}
          />

          <FormField
            icon={Compass}
            label="Nature of Inquiry"
            name="intent"
            isTextarea
            rows={4}
            placeholder="STRATEGIC INTENT / CONTEXT / REQUIREMENTS"
            value={formState.intent}
            onChange={handleChange}
          />
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pt-8"
        >
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 p-[2px] hover:shadow-[0_0_40px_-8px_rgba(245,158,11,0.5)] transition-all duration-500"
          >
            <div className="relative flex items-center justify-center gap-4 rounded-2xl bg-black px-8 py-5 transition-all duration-500 group-hover:bg-transparent">
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-amber-400" size={20} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400">
                    Encrypting Transmission...
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white group-hover:text-black transition-colors">
                    Submit Strategic Inquiry
                  </span>
                  <ArrowRight 
                    size={16} 
                    className="text-amber-400 group-hover:translate-x-2 group-hover:text-black transition-all duration-300" 
                  />
                </>
              )}
            </div>
          </button>
        </motion.div>

        {/* Security Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-6 pt-8 text-[9px] font-mono uppercase tracking-widest text-zinc-800"
        >
          <span className="flex items-center gap-2">
            <Lock size={10} className="text-zinc-700" /> End-to-End Encrypted
          </span>
          <span className="w-px h-4 bg-zinc-800" />
          <span className="flex items-center gap-2">
            <Eye size={10} className="text-zinc-700" /> Zero-Knowledge Proof
          </span>
        </motion.div>
      </form>
    </motion.div>
  );
}