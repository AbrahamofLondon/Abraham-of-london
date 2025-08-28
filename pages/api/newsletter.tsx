import * as React from "react";
import Head from "next/head";
import Layout from "@/components/Layout";
import Link from "next/link";

type State =
  | { status: "idle"; message: "" }
  | { status: "loading"; message: "Subscribing…" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function NewsletterPage() {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<State>({ status: "idle", message: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setState({ status: "error", message: "Please enter a valid email address." });
      return;
    }

    setState({ status: "loading", message: "Subscribing…" });

    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = (await r.json()) as { ok?: boolean; message?: string };
      if (r.ok && data?.ok) {
        setState({ status: "success", message: data.message || "You’re subscribed. Welcome!" });
        setEmail("");
      } else {
        setState({
          status: "error",
          message: data?.message || "Sorry, something went wrong. Please try again.",
        });
      }
    } catch {
      setState({
        status: "error",
        message: "Network error. Please check your connection and try again.",
      });
    }
  }

  const disabled = state.status === "loading";

  return (
    <Layout pageTitle="Newsletter">
      <Head>
        <meta
          name="description"
          content="Join the Abraham of London newsletter — clarity, standards, and strategy that endure."
        />
      </Head>

      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-16">
          <header className="mb-6 text-center">
            <h1 className="font-serif text-4xl font-semibold text-deepCharcoal">Newsletter</h1>
            <p className="mt-2 text-sm text-deepCharcoal/70">
              Practical signal. No noise. Occasional notes on standards, stewardship, and strategy.
            </p>
          </header>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-lightGrey bg-warmWhite/40 p-4 sm:p-6"
            noValidate
          >
            <label htmlFor="email" className="block text-sm font-medium text-deepCharcoal/80">
              Email address
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-lightGrey px-3 py-2 text-sm text-deepCharcoal focus:border-deepCharcoal focus:outline-none"
                placeholder="you@example.com"
                aria-describedby="form-message"
              />
              <button
                type="submit"
                disabled={disabled}
                className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-cream transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state.status === "loading" ? "Subscribing…" : "Subscribe"}
              </button>
            </div>

            {state.message && (
              <p
                id="form-message"
                className={
                  state.status === "error"
                    ? "mt-3 text-sm text-red-600"
                    : state.status === "success"
                    ? "mt-3 text-sm text-forest"
                    : "sr-only"
                }
                role={state.status === "error" ? "alert" : undefined}
              >
                {state.message}
              </p>
            )}

            <p className="mt-4 text-xs text-deepCharcoal/60">
              By subscribing, you consent to receive emails from Abraham of London. You can
              unsubscribe anytime. See our{" "}
              <Link href="/privacy" className="underline decoration-softGold/60 underline-offset-4">
                privacy policy
              </Link>
              .
            </p>
          </form>
        </div>
      </section>
    </Layout>
  );
}
