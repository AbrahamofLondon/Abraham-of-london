"use client";
import * as React from "react";
import { motion } from "framer-motion";

interface TeaserRequestProps {
  className?: string;
  variant?: "default" | "minimal" | "featured";
}

export default function TeaserRequest({ 
  className = "",
  variant = "default"
}: TeaserRequestProps) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [status, setStatus] = React.useState<"idle"|"ok"|"err"|"busy">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    
    // Basic validation
    if (!email || !email.includes('@')) {
      setStatus('err');
      return;
    }

    setStatus("busy");
    try {
      const res = await fetch("/.netlify/functions/send-teaser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      
      if (res.ok) {
        setStatus("ok");
        setEmail("");
        setName("");
        // Reset form after success
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("err");
      }
    } catch (error) { 
      console.error("Teaser request failed:", error);
      setStatus("err"); 
    }
  }

  // Minimal variant for inline use
  if (variant === "minimal") {
    return (
      <form 
        onSubmit={submit} 
        className={[
          "flex flex-col gap-3 p-4 rounded-xl border border-gold/30 bg-charcoal/60 backdrop-blur-sm",
          className
        ].join(" ")}
      >
        <div className="space-y-2">
          <label htmlFor="teaser-email-minimal" className="block text-sm font-semibold text-cream">
            Get the FREE teaser
          </label>
          <input
            id="teaser-email-minimal"
            type="email"
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-gold/20 bg-charcoal/40 px-3 py-2 text-sm text-cream placeholder-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "busy"}
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-gold to-amber-200 px-4 py-2 text-sm font-semibold text-charcoal transition-all hover:from-amber-200 hover:to-gold disabled:opacity-50"
          disabled={status === "busy"}
        >
          {status === "busy" ? "Sending…" : "Email me the teaser"}
        </button>
        
        {status === "ok" && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-green-400"
          >
            Check your inbox—teaser sent!
          </motion.p>
        )}
        {status === "err" && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400"
          >
            Please check your email and try again.
          </motion.p>
        )}
      </form>
    );
  }

  // Featured variant for prominent placement
  if (variant === "featured") {
    return (
      <motion.div 
        className={[
          "rounded-2xl border border-gold/30 bg-gradient-to-br from-charcoal/80 to-charcoal/60 p-6 backdrop-blur-sm",
          className
        ].join(" ")}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-4">
          <h3 className="font-serif text-xl font-semibold text-cream mb-2">
            Fathering Without Fear — Teaser
          </h3>
          <p className="text-gold/70 text-sm">
            Get the first chapter free. No spam, just wisdom.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="teaser-name-featured" className="sr-only">
                Your Name
              </label>
              <input
                id="teaser-name-featured"
                type="text"
                placeholder="Name (optional)"
                className="w-full rounded-lg border border-gold/20 bg-charcoal/40 px-3 py-2 text-sm text-cream placeholder-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={status === "busy"}
              />
            </div>
            <div>
              <label htmlFor="teaser-email-featured" className="sr-only">
                Your Email
              </label>
              <input
                id="teaser-email-featured"
                type="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-gold/20 bg-charcoal/40 px-3 py-2 text-sm text-cream placeholder-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "busy"}
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-gold to-amber-200 px-6 py-3 font-semibold text-charcoal transition-all hover:from-amber-200 hover:to-gold disabled:opacity-50"
            disabled={status === "busy"}
          >
            {status === "busy" ? "Sending…" : "Get Free Teaser"}
          </button>
        </form>

        <div className="mt-4 text-center">
          {status === "ok" && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-green-400"
            >
              ✅ Check your inbox for the teaser!
            </motion.p>
          )}
          {status === "err" && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-400"
            >
              ❌ Something went wrong. Please try again.
            </motion.p>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gold/40">
          Unsubscribe at any time. We respect your privacy.
        </p>
      </motion.div>
    );
  }

  // Default variant
  return (
    <form 
      onSubmit={submit} 
      className={[
        "rounded-xl border border-gold/20 bg-charcoal/60 p-4 backdrop-blur-sm",
        className
      ].join(" ")}
    >
      <div className="mb-3 font-semibold text-cream">
        Get the FREE teaser by email
      </div>
      
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Name (optional)"
          className="flex-1 rounded-lg border border-gold/20 bg-charcoal/40 px-3 py-2 text-sm text-cream placeholder-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === "busy"}
        />
        <input
          type="email"
          placeholder="you@example.com"
          required
          className="flex-1 rounded-lg border border-gold/20 bg-charcoal/40 px-3 py-2 text-sm text-cream placeholder-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "busy"}
        />
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-gold to-amber-200 px-4 py-2 text-sm font-semibold text-charcoal transition-all hover:from-amber-200 hover:to-gold disabled:opacity-50 sm:whitespace-nowrap"
          disabled={status === "busy"}
        >
          {status === "busy" ? "Sending…" : "Email me the teaser"}
        </button>
      </div>
      
      {status === "ok" && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-xs text-green-400"
        >
          Check your inbox—teaser sent!
        </motion.p>
      )}
      {status === "err" && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-xs text-red-400"
        >
          Sorry—something went wrong. Please try again.
        </motion.p>
      )}
    </form>
  );
}