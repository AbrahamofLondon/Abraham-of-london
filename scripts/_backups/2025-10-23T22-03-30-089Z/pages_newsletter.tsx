import * as React from "react";
import Head from "next/head";
import Layout from "@/components/Layout";
import { subscribe } from "@/lib/subscribe";

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterPage() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>({ state: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!EMAIL_RE.test(trimmed)) {
      setStatus({
        state: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setStatus({ state: "loading" });
    try {
      const res = await subscribe(trimmed);
      if (res.ok) {
        setStatus({
          state: "success",
          message: res.message || "You're subscribed. Welcome!",
        });
        setEmail("");
      } else {
        setStatus({
          state: "error",
          message: res.message || "Something went wrong. Please try again.",
        });
      }
    } catch {
      setStatus({ state: "error", message: "Network error. Please try again." });
    }
  }

  const message =
    status.state === "success" || status.state === "error"
      ? String(status.message)
      : "";

  return (
    <Layout pageTitle="Newsletter" hideCTA>
      <Head>
        <meta
          name="description"
          content="Subscribe to Abraham of London updates and essays."
        />
      </Head>
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <header className="mb-6 text-center">
            <h1 className="font-serif text-4xl font-semibold text-deepCharcoal">
              Join the Newsletter
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-on-secondary)/0.7]">
              Essays, event invitations, and project updates. No spam—ever.
            </p>
          </header>
          <form
            onSubmit={onSubmit}
            className="mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-lightGrey bg-warmWhite p-4 sm:flex-row sm:items-center sm:p-5"
            noValidate
          >
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg border border-lightGrey bg-white px-3 py-2 text-sm text-deepCharcoal placeholder:text-[color:var(--color-on-secondary)/0.5] focus:border-deepCharcoal focus:outline-none"
              aria-describedby="newsletter-status"
            />
            <button
              type="submit"
              disabled={status.state === "loading"}
              className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-cream transition hover:bg-[color:var(--color-primary)/0.9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status.state === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
          {(status.state === "success" || status.state === "error") && (
            <p
              id="newsletter-status"
              role="status"
              aria-live="polite"
              className={
                status.state === "success"
                  ? "mt-3 text-sm text-forest"
                  : "mt-3 text-sm text-red-600"
              }
            >
              {message}
            </p>
          )}
        </div>
      </section>
    </Layout>
  );
}