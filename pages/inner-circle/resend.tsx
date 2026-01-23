/* pages/inner-circle/resend.tsx — ACCESS RECOVERY (INTEGRITY MODE) */
import * as React from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { Mail, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";

type ApiResponse = {
  ok: boolean;
  message?: string;
  error?: string;
};

const InnerCircleResendPage: NextPage = () => {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [feedback, setFeedback] = React.useState<string | null>(null);

  // Redirection target after recovery
  const returnTo = typeof router.query.returnTo === "string" ? router.query.returnTo : "/inner-circle/dashboard";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
      setStatus("error");
      setFeedback("Please enter a valid institutional email address.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setFeedback(null);

    try {
      // 1. Security Check: Recaptcha verification
      const recaptchaToken = await getRecaptchaTokenSafe("inner_circle_resend");

      if (!recaptchaToken) {
        setStatus("error");
        setFeedback("Security verification failed. Please ensure JavaScript is enabled.");
        setLoading(false);
        return;
      }

      // 2. Postgres Synchronization: Request fresh key from database
      const res = await fetch("/api/inner-circle/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          returnTo,
          recaptchaToken,
        }),
      });

      const data = (await res.json()) as ApiResponse;

      if (!data.ok) {
        setStatus("error");
        setFeedback(data.error || "We couldn't locate an active session for this email.");
        return;
      }

      // 3. Success State
      setStatus("success");
      setFeedback(data.message || "A fresh Inner Circle access email has been dispatched. Please check your inbox.");
    } catch (error) {
      console.error("[RESEND_FAILURE]", error);
      setStatus("error");
      setFeedback("A system error occurred. Please attempt recovery again shortly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Resend Access">
      <main className="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-black">
        <section className="w-full max-w-xl">
          <header className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-gold text-[10px] font-bold uppercase tracking-widest mb-6">
              <Mail size={12} />
              Access Recovery
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-4">
              Resend Access Email
            </h1>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              If you have already registered but cannot locate your access key, 
              provide your registered email to receive a fresh entry link.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-3xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-xl shadow-2xl"
          >
            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                Registered Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-white outline-none focus:border-gold/50 transition-all font-medium"
                placeholder="you@institutional-firm.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                Name <span className="text-gray-700">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-white outline-none focus:border-gold/50 transition-all"
                placeholder="Institutional ID or Name"
              />
            </div>

            <button
              type="submit"
              disabled={loading || status === "success"}
              className="w-full bg-gold text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-gold/80 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-gold/10"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : status === "success" ? (
                <CheckCircle size={18} />
              ) : (
                "Dispatch Recovery Email"
              )}
            </button>

            {feedback && (
              <div
                className={`flex items-start gap-3 p-4 rounded-xl text-sm font-medium border ${
                  status === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : status === "error"
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : "border-white/10 bg-white/5 text-gray-400"
                }`}
              >
                {status === "error" ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle size={18} className="shrink-0" />}
                <p>{feedback}</p>
              </div>
            )}
          </form>

          <footer className="mt-10 flex flex-col items-center gap-4">
            <Link 
              href="/inner-circle" 
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-white transition-colors group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Return to Access Gate
            </Link>
            <p className="text-[11px] text-gray-600 text-center max-w-sm">
              Note: If you do not receive the email within 10 minutes, please check your spam folder or contact support for manual institutional verification.
            </p>
          </footer>
        </section>
      </main>
    </Layout>
  );
};

export default InnerCircleResendPage;