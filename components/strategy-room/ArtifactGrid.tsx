/* components/strategy-room/Form.tsx — INSTITUTIONAL INTAKE */
"use client";

import * as React from "react";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";
import { Zap, ArrowRight, Loader2 } from "lucide-react";

export default function StrategyRoomForm() {
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const token = await getRecaptchaTokenSafe("strategy_room_intake");
      const res = await fetch("/api/strategy-room/enrol", {
        method: "POST",
        body: JSON.stringify({ ...data, token }),
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
      <div className="p-12 border border-primary/20 bg-primary/5 text-center space-y-4">
        <Zap className="h-6 w-6 text-primary mx-auto animate-pulse" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Intelligence Request Logged.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-px bg-white/5 border border-white/5">
      <div className="grid md:grid-cols-2 gap-px">
        <input 
          required name="name" 
          placeholder="IDENTIFIER (NAME)" 
          className="bg-black p-6 text-[10px] font-mono uppercase tracking-widest outline-none focus:text-primary transition-colors border-none" 
        />
        <input 
          required name="email" type="email" 
          placeholder="INSTITUTIONAL EMAIL" 
          className="bg-black p-6 text-[10px] font-mono uppercase tracking-widest outline-none focus:text-primary transition-colors border-none" 
        />
      </div>
      <textarea 
        required name="intent" rows={4} 
        placeholder="NATURE OF INQUIRY / STRATEGIC INTENT" 
        className="w-full bg-black p-6 text-[10px] font-mono uppercase tracking-widest outline-none focus:text-primary transition-colors border-none resize-none" 
      />
      <button 
        disabled={loading}
        className="w-full bg-primary text-black p-6 font-mono text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-white transition-colors flex items-center justify-center gap-4 group"
      >
        {loading ? <Loader2 className="animate-spin" size={14} /> : (
          <>Initialize Sequence <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" /></>
        )}
      </button>
    </form>
  );
}