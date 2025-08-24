// components/NewsletterForm.tsx
"use client";
import * as React from "react";
import { subscribe } from "@/lib/subscribe";

export default function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle"|"loading"|"ok"|"err">("idle");
  const [msg, setMsg] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setMsg("");
    try {
      const res = await subscribe(email);
      setStatus("ok");
      setMsg(res.message || "You’re subscribed. Welcome!");
      setEmail("");
    } catch (err: any) {
      setStatus("err");
      setMsg(err?.message || "Something went wrong.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="email"
        name="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-md border px-3 py-2"
        aria-label="Email address"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-md bg-forest px-4 py-2 text-cream disabled:opacity-60"
      >
        {status === "loading" ? "Subscribing…" : "Subscribe"}
      </button>
      {status !== "idle" && (
        <p role="status" className={`ml-3 text-sm ${status === "err" ? "text-red-600" : "text-emerald-700"}`}>
          {msg}
        </p>
      )}
    </form>
  );
}
