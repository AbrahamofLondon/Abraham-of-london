"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { getRecaptchaToken } from "@/lib/recaptchaClient";

interface TeaserRequestProps {
  className?: string;
  variant?: "default" | "minimal" | "featured";
}

interface TeaserFormData {
  email: string;
  name: string;
  honeypot: string;
  timestamp: string;
  userAgent: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TeaserRequest({ 
  className = "",
  variant = "default"
}: TeaserRequestProps) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");
  const [status, setStatus] = React.useState<"idle"|"success"|"error"|"loading">("idle");
  const [submitAttempts, setSubmitAttempts] = React.useState(0);
  const [lastSubmitTime, setLastSubmitTime] = React.useState<number>(0);

  // Rate limiting: max 3 submissions per minute
  const isRateLimited = React.useMemo(() => {
    const now = Date.now();
    return submitAttempts >= 3 && (now - lastSubmitTime) < 60000;
  }, [submitAttempts, lastSubmitTime]);

  function validateForm(): string | null {
    // Honeypot validation
    if (honeypot.trim() !== "") {
      console.warn("Teaser request honeypot triggered - possible bot");
      return "Thank you! Check your email for the teaser.";
    }

    // Email validation
    if (!email.trim()) {
      return "Please enter your email address";
    }

    if (!EMAIL_RE.test(email.trim().toLowerCase())) {
      return "Please enter a valid email address";
    }

    // Length validation
    if (email.length > 254) {
      return "Email address is too long";
    }

    if (name.length > 100) {
      return "Name is too long";
    }

    // Rate limiting
    if (isRateLimited) {
      return "Too many attempts. Please try again in a minute.";
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (status === "loading") return;

    // Form validation
    const validationError = validateForm();
    if (validationError) {
      if (honeypot.trim() !== "") {
        // Pretend success for bots
        setStatus("success");
        setEmail("");
        setName("");
        setHoneypot("");
        setTimeout(() => setStatus("idle"), 5000);
        return;
      }
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      // reCAPTCHA v3 for teaser requests
      const recaptchaToken = await Promise.race([
        getRecaptchaToken("teaser_request"),
        new Promise<null>((resolve) => 
          setTimeout(() => resolve(null), 5000)
        )
      ]);

      if (!recaptchaToken) {
        setStatus("error");
        return;
      }

      const formData: TeaserFormData = {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        honeypot,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch("/.netlify/functions/send-teaser", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Teaser API error ${res.status}:`, errorText);
        
        if (res.status === 429) {
          throw new Error("Too many requests");
        } else if (res.status >= 500) {
          throw new Error("Server error");
        } else {
          throw new Error("Request failed");
        }
      }

      setStatus("success");
      setEmail("");
      setName("");
      setHoneypot("");
      
      // Update rate limiting
      setSubmitAttempts(prev => prev + 1);
      setLastSubmitTime(Date.now());
      
      // Reset form after success
      setTimeout(() => setStatus("idle"), 5000);
    } catch (error) {
      console.error("Teaser request failed:", error);
      setStatus("error"); 
    }
  }

  // Minimal variant for inline use
  if (variant === "minimal") {
    return (
      <form 
        onSubmit={handleSubmit} 
        className={[
          "flex flex-col gap-3 p-4 rounded-xl border border-gold/30 bg-charcoal/60 backdrop-blur-sm",
          className
        ].join(" ")}
        noValidate
      >
        {/* Honeypot */}
        <div className="sr-only">
          <label htmlFor="teaser-honeypot-minimal" className="sr-only">
            Do not fill this field
          </label>
          <input
            id="teaser-honeypot-minimal"
            type="text"
            name="honeypot"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            autoComplete="off"
            tabIndex={-1}
            className="hidden"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="teaser-email-minimal" className="block text-sm font-semibold text-cream">
            Get the FREE teaser
          </label>
          <input
            id="teaser-email-minimal"
            type="email"
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-gold/20 bg-charcoal/40 px-3 py-2 text-sm text-cream placeholder-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading" || isRateLimited}
            maxLength={254}
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-gold to-amber-200 px-4 py-2 text-sm font-semibold text-charcoal transition-all hover:from-amber-200 hover:to-gold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-charcoal"
          disabled={status === "loading" || isRateLimited}
        >
          {status === "loading" ? "Sending…" : isRateLimited ? "Try Again Later" : "Email me the teaser"}
        </button>
        
        {status === "success" && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-green-400"
          >
            Check your inbox—teaser sent!
          </motion.p>
        )}
        {status === "error" && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400"
          >
            {isRateLimited ? "Too many attempts. Try again later." : "Please check your email and try again."}
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

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Honeypot */}
          <div className="sr-only">
            <label htmlFor="teaser-honeypot-featured" className="sr-only">
              Do not fill this field
            </label>
            <input
              id="teaser-honeypot-featured"
              type="text"
              name="honeypot"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              autoComplete="off"
              tabIndex={-1}
              className="hidden"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="teaser-name-featured" className="sr-only">
                Your Name
              </label>
              <input
                id="teaser-name-featured"
                type="text"
                placeholder="Name (optional)"
                className="w-full rounded-lg border border-gold/20 bg-charcoal/40 px-3 py-2 text-sm text-cream placeholder-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={status === "loading" || isRateLimited}
                maxLength={100}
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
                className="w-full rounded-lg border border-gold/20 bg-charcoal/40 px-3 py-2 text-sm text-cream placeholder-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading" || isRateLimited}
                maxLength={254}
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-gold to-amber-200 px-6 py-3 font-semibold text-charcoal transition-all hover:from-amber-200 hover:to-gold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-charcoal"
            disabled={status === "loading" || isRateLimited}
          >
            {status === "loading" ? "Sending…" : isRateLimited ? "Try Again Later" : "Get Free Teaser"}
          </button>
        </form>

        <div className="mt-4 text-center">
          {status === "success" && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-green-400"
            >
              ✅ Check your inbox for the teaser!
            </motion.p>
          )}
          {status === "error" && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-400"
            >
              ❌ {isRateLimited ? "Too many attempts. Try again later." : "Something went wrong. Please try again."}
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
      onSubmit={handleSubmit} 
      className={[
        "rounded-xl border border-gold/20 bg-charcoal/60 p-4 backdrop-blur-sm",
        className
      ].join(" ")}
      noValidate
    >
      {/* Honeypot */}
      <div className="sr-only">
        <label htmlFor="teaser-honeypot-default" className="sr-only">
          Do not fill this field
        </label>
        <input
          id="teaser-honeypot-default"
          type="text"
          name="honeypot"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          autoComplete="off"
          tabIndex={-1}
          className="hidden"
        />
      </div>

      <div className="mb-3 font-semibold text-cream">
        Get the FREE teaser by email
      </div>
      
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Name (optional)"
          className="flex-1 rounded-lg border border-gold/20 bg-charcoal/40 px-3 py-2 text-sm text-cream placeholder-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === "loading" || isRateLimited}
          maxLength={100}
        />
        <input
          type="email"
          placeholder="you@example.com"
          required
          className="flex-1 rounded-lg border border-gold/20 bg-charcoal/40 px-3 py-2 text-sm text-cream placeholder-gold/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading" || isRateLimited}
          maxLength={254}
        />
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-gold to-amber-200 px-4 py-2 text-sm font-semibold text-charcoal transition-all hover:from-amber-200 hover:to-gold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-charcoal sm:whitespace-nowrap"
          disabled={status === "loading" || isRateLimited}
        >
          {status === "loading" ? "Sending…" : isRateLimited ? "Try Again Later" : "Email me the teaser"}
        </button>
      </div>
      
      {status === "success" && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-xs text-green-400"
        >
          Check your inbox—teaser sent!
        </motion.p>
      )}
      {status === "error" && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-xs text-red-400"
        >
          {isRateLimited ? "Too many attempts. Try again later." : "Sorry—something went wrong. Please try again."}
        </motion.p>
      )}
    </form>
  );
}