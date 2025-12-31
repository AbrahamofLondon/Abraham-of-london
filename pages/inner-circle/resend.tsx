// pages/inner-circle/resend.tsx
import * as React from "react";
import type { NextPage } from "next";
import Layout from "@/components/Layout";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";

type ApiResponse = {
  ok: boolean;
  message?: string;
  error?: string;
};

const InnerCircleResendPage: NextPage = () => {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
      setStatus("error");
      setFeedback("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setFeedback(null);

    try {
      const recaptchaToken = await getRecaptchaTokenSafe("inner_circle_resend");

      if (!recaptchaToken) {
        setStatus("error");
        setFeedback(
          "Security check failed. Please ensure JavaScript is enabled and try again."
        );
        setLoading(false);
        return;
      }

      const res = await fetch("/api/inner-circle/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          returnTo: "/canon",
          recaptchaToken,
        }),
      });

      const data = (await res.json()) as ApiResponse;

      if (!data.ok) {
        setStatus("error");
        setFeedback(
          data.error ||
            "We couldn't resend your access email. Please try again shortly."
        );
        return;
      }

      setStatus("success");
      setFeedback(
        data.message ||
          "A fresh Inner Circle access email has been sent. Please check your inbox."
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Resend failed:", error);
      setStatus("error");
      setFeedback(
        "Something went wrong while resending your access email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Resend Inner Circle Access">
      <main className="mx-auto max-w-xl px-4 py-12 sm:py-16 lg:py-20">
        <section className="space-y-8">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-softGold/70">
              Inner Circle · Access
            </p>
            <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
              Resend Your Inner Circle Access
            </h1>
            <p className="text-sm text-softGold/80">
              If you&apos;ve already registered but can&apos;t find your access email,
              request a fresh one here.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="
              space-y-6 rounded-2xl border border-softGold/40 
              bg-black/70 p-6 shadow-lg backdrop-blur 
              shadow-black/40
            "
          >
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full rounded-xl border border-softGold/40 bg-black/60 
                  px-3 py-2 text-sm text-cream outline-none ring-0
                  transition focus:border-softGold focus:ring-1 focus:ring-softGold/60
                "
                placeholder="you@example.com"
              />
              <p className="text-[11px] text-softGold/70">
                Use the same email you registered with. If the message doesn&apos;t appear,
                check Promotions or Spam.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-xs font-semibold uppercase tracking-[0.21em] text-softGold/80"
              >
                Name <span className="text-softGold/60">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="
                  w-full rounded-xl border border-softGold/30 bg-black/60 
                  px-3 py-2 text-sm text-cream outline-none ring-0
                  transition focus:border-softGold/70 focus:ring-1 focus:ring-softGold/60
                "
                placeholder="How should we address you?"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="
                inline-flex w-full items-center justify-center 
                rounded-full bg-softGold px-6 py-3 text-sm font-semibold 
                text-black shadow-md transition 
                hover:bg-softGold/90 
                disabled:cursor-not-allowed disabled:opacity-60
              "
            >
              {loading ? "Resending..." : "Resend access email"}
            </button>

            {feedback && (
              <div
                className={[
                  "mt-2 rounded-xl border px-3 py-2 text-sm",
                  status === "success"
                    ? "border-emerald-500/60 bg-emerald-900/40 text-emerald-100"
                    : status === "error"
                    ? "border-red-500/60 bg-red-900/40 text-red-100"
                    : "border-softGold/40 bg-black/60 text-softGold/90",
                ].join(" ")}
              >
                {feedback}
              </div>
            )}
          </form>

          <p className="text-xs text-softGold/60">
            If you still don&apos;t receive the email after multiple attempts, reply to any
            Abraham of London newsletter or contact us through the main site — we&apos;ll assist you manually.
          </p>
        </section>
      </main>
    </Layout>
  );
};

export default InnerCircleResendPage;
