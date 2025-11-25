"use client";

import * as React from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface NewsletterFormProps {
  variant?: "default" | "premium";
  placeholder?: string;
  buttonText?: string;
}

type NewsletterResponse = {
  message?: string;
};

export default function NewsletterForm({
  variant = "default",
  placeholder = "you@example.com",
  buttonText = "Subscribe",
}: NewsletterFormProps) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = React.useState("");
  const [hp, setHp] = React.useState(""); // honeypot
  const abortRef = React.useRef<AbortController | null>(null);
  const statusRef = React.useRef<HTMLParagraphElement | null>(null);

  React.useEffect(() => {
    if (status !== "idle" && statusRef.current) statusRef.current.focus();
  }, [status, msg]);

  async function onSubmit(e: React.FormEvent) {
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

      let data: NewsletterResponse = {};
      try {
        data = (await r.json()) as NewsletterResponse;
      } catch {
        data = {};
      }

      const message =
        typeof data.message === "string"
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
    } catch (err) {
      const error = err as { name?: string };
      if (error?.name === "AbortError") return;
      setStatus("err");
      setMsg("Network error. Please try again.");
    }
  }

  const isLoading = status === "loading";
  const isError = status === "err";

  const wrapperClasses =
    variant === "premium"
      ? "mx-auto flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-softGold/40 bg-black/40 p-4 sm:flex-row sm:items-center sm:p-5"
      : "mx-auto flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-lightGrey bg-warmWhite p-4 sm:flex-row sm:items-center sm:p-5";

  const buttonClasses =
    variant === "premium"
      ? "rounded-full bg-softGold px-5 py-2 text-sm font-semibold text-black transition hover:bg-softGold/90 disabled:cursor-not-allowed disabled:opacity-60"
      : "rounded-full bg-forest px-5 py-2 text-sm font-semibold text-cream transition hover:bg-[color:var(--color-primary)/0.9] disabled:cursor-not-allowed disabled:opacity-60";

  const inputClasses =
    variant === "premium"
      ? "flex-1 rounded-lg border border-white/25 bg-black/40 px-3 py-2 text-sm text-cream placeholder:text-gray-400 focus:border-softGold focus:outline-none"
      : "flex-1 rounded-lg border border-lightGrey bg-white px-3 py-2 text-sm text-deepCharcoal placeholder:text-[color:var(--color-on-secondary)/0.5] focus:border-deepCharcoal focus:outline-none";

  return (
    <form onSubmit={onSubmit} className={wrapperClasses} noValidate>
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
        className={inputClasses}
        aria-describedby="newsletter-status"
        aria-invalid={isError || undefined}
        disabled={isLoading}
      />

      <button type="submit" disabled={isLoading} className={buttonClasses}>
        {isLoading ? "Subscribing…" : buttonText}
      </button>

      <p
        id="newsletter-status"
        role="status"
        aria-live="polite"
        tabIndex={-1}
        ref={statusRef}
        className={`sm:ml-2 text-sm ${
          status === "ok"
            ? "text-forest"
            : status === "err"
            ? "text-red-500"
            : "text-transparent"
        }`}
      >
        {msg || " "}
      </p>
    </form>
  );
}