// components/Newsletter.tsx
"use client";
import * as React from "react";

export default function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return;

    setStatus("loading");
    setMsg("");

    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await r.json().catch(() => ({} as any));

      if (r.ok && data?.ok) {
        setStatus("ok");
        setMsg(String(data.message || "You’re subscribed. Welcome!"));
        setEmail("");
      } else {
        setStatus("err");
        setMsg(String(data?.message || `Subscription failed (${r.status}). Please try again.`));
      }
    } catch {
      setStatus("err");
      setMsg("Network error. Please try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row"
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
        autoComplete="email"
        className="flex-1 rounded-lg border border-lightGrey bg-white px-3 py-3 text-sm text-deepCharcoal placeholder:text-deepCharcoal/50 focus:border-deepCharcoal focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full bg-forest px-6 py-3 text-sm font-semibold text-cream transition hover:bg-forest/90 disabled:opacity-60"
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
