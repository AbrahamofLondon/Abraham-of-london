// pages/newsletter.tsx
import Head from "next/head";
import { useState } from "react";
import Layout from "@/components/Layout";

export default function NewsletterPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMsg("");
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await r.json();
      if (r.ok && data?.ok) {
        setStatus("ok");
        setMsg(data.message || "You’re subscribed. Welcome!");
        setEmail("");
      } else {
        setStatus("err");
        setMsg(data?.message || "Subscription failed.");
      }
    } catch {
      setStatus("err");
      setMsg("Network error. Please try again.");
    }
  };

  return (
    <Layout pageTitle="Newsletter">
      <Head>
        <meta name="description" content="Subscribe to Abraham of London’s newsletter." />
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_SITE_URL || ""}/newsletter`}
        />
      </Head>

      <main className="container mx-auto max-w-xl px-4 py-16">
        <h1 className="font-serif text-4xl text-forest mb-4">Newsletter</h1>
        <p className="text-deepCharcoal/80 mb-6">
          Pragmatic notes on legacy, standards, and building things that last.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-lightGrey px-4 py-2"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-full bg-forest px-5 py-2 text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {status === "loading" ? "Subscribing…" : "Subscribe"}
          </button>
        </form>

        {msg && (
          <p
            role="status"
            aria-live="polite"
            className={`mt-4 text-sm ${status === "ok" ? "text-emerald-700" : "text-red-600"}`}
          >
            {msg}
          </p>
        )}
      </main>
    </Layout>
  );
}
