// components/NewsletterForm.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "loading" | "ok" | "err";
type Variant = "default" | "premium";

export interface NewsletterFormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  variant?: Variant;
  placeholder?: string;
  buttonText?: string;
}

export default function NewsletterForm({
  variant = "default",
  placeholder = "you@example.com",
  buttonText = "Subscribe",
  className,
  onSubmit,
  ...formProps
}: NewsletterFormProps) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [msg, setMsg] = React.useState("");
  const [hp, setHp] = React.useState(""); // honeypot
  const abortRef = React.useRef<AbortController | null>(null);
  const statusRef = React.useRef<HTMLParagraphElement | null>(null);

  React.useEffect(() => {
    if (status !== "idle" && statusRef.current) statusRef.current.focus();
  }, [status, msg]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    const value = email.trim().toLowerCase();

    if (!EMAIL_RE.test(value)) {
      setStatus("err");
      setMsg("Please enter a valid email address.");
      return;
    }

    // If the honeypot is filled, act like success to mislead bots.
    if (hp) {
      setStatus("ok");
      setMsg("You’re subscribed. Welcome!");
      setEmail("");
      return;
    }

    setStatus("loading");
    setMsg("");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // HOT-FIX: send both shapes so either backend contract is satisfied
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: value,
          payload: { email_address: value, email: value },
        }),
        cache: "no-store",
        signal: controller.signal,
      });

      const data = await r.json().catch(() => ({} as any));
      const message =
        typeof data?.message === "string"
          ? data.message
          : r.ok
          ? "You’re subscribed. Welcome!"
          : "Something went wrong. Please try again.";

      if (r.ok) {
        setStatus("ok");
        setMsg(message);
        setEmail("");
      } else {
        setStatus("err");
        setMsg(message);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setStatus("err");
      setMsg("Network error. Please try again.");
    }

    // Preserve any parent onSubmit handler if someone passes one
    if (onSubmit) {
      onSubmit(e);
    }
  }

  const isLoading = status === "loading";
  const isError = status === "err";
  const isPremium = variant === "premium";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      {...formProps}
      className={cn(
        "mx-auto flex w-full max-w-xl flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:p-5",
        isPremium
          ? "border-white/20 bg-white/5"
          : "border-lightGrey bg-warmWhite",
        className,
      )}
    >
      {/* Honeypot (hidden) */}
      <label className="sr-only" htmlFor="newsletter-company">
        Company
      </label>
      <input
        id="newsletter-company"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="hidden"
      />

      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        name="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder={placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={cn(
          "flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none",
          isPremium
            ? "border-white/30 bg-black/30 text-white placeholder:text-gray-400 focus:border-softGold focus:ring-1 focus:ring-softGold"
            : "border-lightGrey bg-white text-deepCharcoal placeholder:text-[color:var(--color-on-secondary)/0.5] focus:border-deepCharcoal",
        )}
        aria-describedby="newsletter-status"
        aria-invalid={isError || undefined}
        disabled={isLoading}
      />

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "rounded-full px-5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
          isPremium
            ? "bg-softGold text-black hover:bg-softGold/90"
            : "bg-forest text-cream hover:bg-[color:var(--color-primary)/0.9]",
        )}
      >
        {isLoading ? "Subscribing…" : buttonText}
      </button>

      <p
        id="newsletter-status"
        role="status"
        aria-live="polite"
        tabIndex={-1}
        ref={statusRef}
        className={cn(
          "sm:ml-2 text-sm",
          status === "ok"
            ? isPremium
              ? "text-emerald-300"
              : "text-forest"
            : status === "err"
            ? isPremium
              ? "text-red-300"
              : "text-red-600"
            : "text-transparent",
        )}
      >
        {msg || " "}
      </p>
    </form>
  );
}