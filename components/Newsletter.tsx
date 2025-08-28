// components/NewsletterForm.tsx
"use client";

import * as React from "react";

type Status = "idle" | "loading" | "ok" | "err";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
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

      // Parse JSON defensively and coerce message to a string
      const data = await r.json().catch(() => ({} as any));
      const message =
        (typeof (data as any)?.message === "string" && (data as any).message) ||
        (typeof (data as any)?.detail === "string" && (data as any).detail) ||
        (r.ok ? "You’re subscribed. Welcome!" : "Something went wrong. Please try again.");

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
      className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
      noValidate
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>

      <input
        id="newsletter-email"
        type="email"
        name="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="aol-input h-12 flex-1"
        aria-label="Email address"
        autoComplete="email"
      />

      <button
        type="submit"
        disabled={status === "loading"}
        className="aol-btn h-12 shrink-0"
      >
        {status === "loading" ? "Subscribing…" : "Subscribe"}
      </button>

      <p
        role="status"
        aria-live="polite"
        className={`text-sm ${
          status === "err" ? "text-red-600" : status === "ok" ? "text-emerald-700" : "text-transparent"
        }`}
      >
        {msg || " "}
      </p>
    </form>
  );
}
