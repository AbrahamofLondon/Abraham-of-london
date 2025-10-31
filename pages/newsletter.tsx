// ./pages/newsletter.tsx (or appropriate file path)

import React, { useState, useCallback } from "react";
import Head from "next/head";
import Layout from "@/components/Layout";
// Assuming the return type of subscribe is { ok: boolean, message?: string }
import { subscribe } from "@/lib/subscribe"; 

// --- Type Definitions ---
type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

// Simple regex for basic email validation
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Component: StatusMessage (Modularized Feedback) ---

interface StatusMessageProps {
  status: Status;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ status }) => {
  if (status.state !== "success" && status.state !== "error") {
    return null;
  }

  const isSuccess = status.state === "success";
  const message = status.message;

  const className = isSuccess
    ? "mt-3 text-sm font-medium text-forest dark:text-green-400"
    : "mt-3 text-sm font-medium text-red-600 dark:text-red-400";

  return (
    <p
      id="newsletter-status"
      role="status" // Announces the message change to screen readers
      aria-live="polite"
      className={className}
    >
      {message}
    </p>
  );
};


// --- Main Page Component ---

export default function NewsletterPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    
    // 1. Client-side Validation
    if (!EMAIL_RE.test(trimmedEmail)) {
      setStatus({ state: "error", message: "🚫 Please enter a valid email address." });
      return;
    }

    // 2. Submission
    setStatus({ state: "loading" });
    try {
      const res = await subscribe(trimmedEmail);
      
      // 3. API Feedback Handling
      if (res.ok) {
        setStatus({ state: "success", message: res.message || "🎉 You’re subscribed. Welcome!" });
        setEmail(""); // Clear email on success
      } else {
        // Handle API errors (e.g., already subscribed, rate limit)
        setStatus({ state: "error", message: res.message || "❌ Something went wrong. Please try again." });
      }
    } catch (error) {
      // Handle network errors
      console.error("Subscription network error:", error);
      setStatus({ state: "error", message: "🚨 Network error. Please check your connection and try again." });
    }
  }, [email]);

  return (
    <Layout pageTitle="Newsletter" hideCTA>
      <Head>
        <meta name="description" content="Subscribe to Abraham of London updates, essays, and resources." />
      </Head>

      <section className="bg-white dark:bg-deepCharcoal transition-colors duration-300">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <header className="mb-8 text-center">
            <h1 className="font-serif text-4xl font-extrabold text-deepCharcoal dark:text-cream sm:text-5xl">
              Join the Newsletter
            </h1>
            <p className="mt-3 text-base text-[color:var(--color-on-secondary)/0.8] dark:text-gray-400">
              Essays on principled strategy, event invitations, and new project updates. **No spam** — ever.
            </p>
          </header>

          <form
            onSubmit={onSubmit}
            className="mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-lightGrey bg-warmWhite dark:bg-gray-800 p-4 sm:flex-row sm:items-center sm:p-5 shadow-lg"
            noValidate
          >
            <label htmlFor="email" className="sr-only">Email address</label>
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
              disabled={status.state === "loading"}
              className="flex-1 rounded-lg border border-lightGrey bg-white dark:bg-gray-700 dark:text-cream px-4 py-2.5 text-base text-deepCharcoal placeholder:text-[color:var(--color-on-secondary)/0.5] focus:border-forest focus:ring-1 focus:ring-forest focus:outline-none disabled:bg-gray-100 disabled:opacity-80"
              aria-describedby="newsletter-status"
            />
            <button
              type="submit"
              disabled={status.state === "loading"}
              className="w-full sm:w-auto rounded-full bg-forest px-6 py-2.5 text-base font-semibold text-cream transition hover:bg-forest/90 focus:outline-none focus:ring-2 focus:ring-forest disabled:cursor-wait disabled:bg-forest/70"
            >
              {status.state === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
          </form>

          {/* Status Message Display */}
          <div className="mx-auto max-w-xl text-center">
             <StatusMessage status={status} />
          </div>

          {/* Optional Privacy Disclaimer */}
          <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-500">
            We respect your privacy. Your email will only be used for the newsletter.
          </p>
        </div>
      </section>
    </Layout>
  );
}