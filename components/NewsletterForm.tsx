"use client";
import * as React from "react";

export default function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;

    setStatus("loading");
    setMsg("");

    try {
      const res =
        typeof subscribeApi === "function"
          ? await subscribeApi(value)
          : await (async () => {
              const r = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ email: value }),
              });
              const json = await r.json().catch(() => null);
              if (!r.ok) throw new Error(json?.message || `HTTP ${r.status}`);
              return { message: json?.message || "You’re subscribed. Welcome!" };
            })();

      setStatus("ok");
      setMsg(res.message || "You’re subscribed. Welcome!");
      setEmail("");
    } catch (err: any) {
      setStatus("err");
      setMsg(err?.message || "Something went wrong.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row" noValidate>
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
      <button type="submit" disabled={status === "loading"} className="aol-btn h-12 shrink-0">
        {status === "loading" ? "Subscribing…" : "Subscribe"}
      </button>

      <p
        role="status"
        aria-live="polite"
        className={`text-sm ${status === "err" ? "text-red-600" : status === "ok" ? "text-emerald-700" : "text-transparent"}`}
      >
        {msg || " "}
      </p>
    </form>
  );
}
