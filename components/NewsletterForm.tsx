// components/NewsletterForm.tsx
"use client";

import * as React from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setStatus("err");
      setMsg("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMsg("");

    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: value }),
      });

      const data = await r.json().catch(() => ({}));
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
    } catch {
      setStatus("err");
      setMsg("Network error. Please try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-lightGrey bg-warmWhite p-4 sm:flex-row sm:items-center sm:p-5"
      noValidate
    >
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
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-lg border border-lightGrey bg-white px-3 py-2 text-sm text-deepCharcoal placeholder:text-deepCharcoal/50 focus:border-deepCharcoal focus:outline-none"
        aria-describedby="newsletter-status"
      />

      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-cream transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Subscribing…" : "Subscribe"}
      </button>

      <p
        id="newsletter-status"
        role="status"
        aria-live="polite"
        className={`sm:ml-2 text-sm ${
          status === "ok" ? "text-forest" : status === "err" ? "text-red-600" : "text-transparent"
        }`}
      >
        {msg || " "}
      </p>
    </form>
  );
}
