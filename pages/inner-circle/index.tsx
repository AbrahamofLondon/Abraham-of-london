// pages/inner-circle/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

type RegisterResponse =
  | { ok: true; message?: string }
  | { ok: false; error: string };

const InnerCirclePage: NextPage = () => {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail) {
      setError("Please enter the email you use for the Inner Circle.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/inner-circle/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          name: trimmedName || undefined,
          // default return target – can be overridden later if needed
          returnTo: "/canon",
        }),
      });

      let data: RegisterResponse;
      try {
        data = (await res.json()) as RegisterResponse;
      } catch {
        data = { ok: false, error: "Unexpected response from the server." };
      }

      if (!res.ok || !data.ok) {
        const message =
          !data.ok && "error" in data && data.error
            ? data.error
            : "Something went wrong while registering. Please try again.";
        setError(message);
        setSuccess(null);
        return;
      }

      setSuccess(
        data.message ??
          "Registration successful. Check your inbox for your access key and unlock link.",
      );
      setError(null);
    } catch (err) {
      // Network / unexpected errors
      // eslint-disable-next-line no-console
      console.error("[InnerCircle] register error:", err);
      setError("Unable to reach the server. Please try again in a moment.");
      setSuccess(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Inner Circle Access">
      <Head>
        <title>Inner Circle Access | Abraham of London</title>
        <meta
          name="description"
          content="Request or recover your Inner Circle access key and unlock link."
        />
      </Head>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-12 sm:pt-16 lg:pt-20">
        <section className="space-y-8">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-softGold/70">
              Inner Circle · Access
            </p>
            <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
              Step 1 · Register
            </h1>
            <p className="text-sm text-softGold/80">
              Enter the email you use for the Inner Circle. We&apos;ll send you
              an access key and unlock link.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-softGold/30 bg-black/60 p-6 shadow-xl shadow-black/40 backdrop-blur"
          >
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-softGold/80"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                placeholder="you@example.com"
              />
              <p className="text-[11px] text-softGold/70">
                Already a subscriber to the main newsletter? Use the same
                email. If you don&apos;t see the email, check your promotions or
                spam folder.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-xs font-semibold uppercase tracking-[0.18em] text-softGold/80"
              >
                Name <span className="text-softGold/60">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-softGold/20 bg-black/50 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                placeholder="What should we call you?"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-700/70 bg-red-900/30 px-3 py-2 text-xs text-red-100">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-emerald-600/70 bg-emerald-900/30 px-3 py-2 text-xs text-emerald-100">
                {success}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-softGold px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-softGold/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Sending access link…" : "Send access link"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </Layout>
  );
};

export default InnerCirclePage;