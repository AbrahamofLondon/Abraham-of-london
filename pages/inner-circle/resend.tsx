// pages/inner-circle/resend.tsx — ACCESS RECOVERY (ROUTER-SAFE)

import * as React from "react";
import type { NextPage, GetServerSideProps } from "next";
import Link from "next/link";
import {
  Mail,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

import Layout from "@/components/Layout";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";
import {
  useClientRouter,
  useClientQuery,
} from "@/lib/router/useClientRouter";
import { readAccessCookie } from "@/lib/server/auth/cookies";

type ApiResponse = {
  ok: boolean;
  message?: string;
  error?: string;
};

interface ResendProps {
  initialReturnTo?: string;
  hasActiveSession?: boolean;
}

const InnerCircleResendPage: NextPage<ResendProps> = ({
  initialReturnTo = "/inner-circle/dashboard",
  hasActiveSession = false,
}) => {
  const router = useClientRouter();
  const query = useClientQuery();

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">(
    "idle"
  );
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const returnTo = React.useMemo(() => {
    const value = query?.returnTo;
    return typeof value === "string" && value.trim()
      ? value
      : initialReturnTo;
  }, [query, initialReturnTo]);

  React.useEffect(() => {
    if (mounted && router && hasActiveSession) {
      router.push(returnTo);
    }
  }, [mounted, router, hasActiveSession, returnTo]);

  if (!mounted || !router) {
    return (
      <Layout title="Access Recovery | Inner Circle">
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      const recaptchaToken = await getRecaptchaTokenSafe(
        "inner_circle_resend"
      );

      if (!recaptchaToken) {
        setStatus("error");
        setFeedback(
          "Security verification failed. Please ensure JavaScript is enabled."
        );
        return;
      }

      const res = await fetch("/api/inner-circle/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        setFeedback(
          data.error ||
            "We could not locate an active session for this email."
        );
        return;
      }

      setStatus("success");
      setFeedback(
        data.message ||
          "A fresh Inner Circle access email has been dispatched. Please check your inbox."
      );
    } catch (error) {
      console.error("[RESEND_FAILURE]", error);
      setStatus("error");
      setFeedback(
        "A system error occurred. Please attempt recovery again shortly."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Access Recovery | Inner Circle">
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-20">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/2 translate-y-1/2 rounded-full bg-amber-900/[0.02] blur-[100px]" />

        <section className="relative z-10 w-full max-w-xl">
          <header className="mb-12 text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-gold">
              <Mail size={12} />
              Access Recovery
            </div>

            <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight text-white md:text-5xl">
              Request <span className="italic text-gold">Fresh Link</span>
            </h1>

            <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-500 md:text-base">
              Lost your entry point? Enter your registered email to synchronize
              your session and receive a new secure access key.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="space-y-8 rounded-[2rem] border border-white/10 bg-zinc-950/50 p-10 shadow-2xl backdrop-blur-xl"
          >
            <div className="space-y-3">
              <label
                htmlFor="email"
                className="ml-1 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600"
              >
                Registered Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-black px-5 py-4 font-mono text-sm text-white outline-none transition-all placeholder:text-zinc-800 focus:border-gold/40"
                placeholder="identity@institution.com"
              />
            </div>

            <div className="space-y-3">
              <label
                htmlFor="name"
                className="ml-1 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600"
              >
                Verify Name <span className="text-zinc-800">(Optional)</span>
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/5 bg-black px-5 py-4 font-mono text-sm text-white outline-none transition-all placeholder:text-zinc-800 focus:border-gold/40"
                placeholder="Institutional Name"
              />
            </div>

            <button
              type="submit"
              disabled={loading || status === "success"}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-gold to-amber-600 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black shadow-xl shadow-gold/5 transition-all hover:from-white hover:to-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Sending…
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle size={18} />
                  Dispatched
                </>
              ) : (
                "Dispatch Recovery Key"
              )}
            </button>

            {feedback ? (
              <div
                className={`animate-in fade-in slide-in-from-top-2 flex items-start gap-4 rounded-2xl border p-5 text-xs font-medium leading-relaxed duration-500 ${
                  status === "success"
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                    : "border-red-500/30 bg-red-500/5 text-red-400"
                }`}
              >
                {status === "error" ? (
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle size={18} className="mt-0.5 shrink-0" />
                )}
                <p>{feedback}</p>
              </div>
            ) : null}
          </form>

          <footer className="mt-12 flex flex-col items-center gap-6">
            <Link
              href="/inner-circle"
              className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 transition-colors hover:text-white"
            >
              <ArrowLeft
                size={14}
                className="transition-transform group-hover:-translate-x-1"
              />
              Return to Gate
            </Link>

            <p className="max-w-sm text-center text-[10px] uppercase tracking-widest text-zinc-700">
              Automated institutional verification may take up to 600 seconds.
            </p>
          </footer>
        </section>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<ResendProps> = async (
  context
) => {
  try {
    const sessionId = readAccessCookie(context.req as any);
    const hasActiveSession = Boolean(sessionId);

    const queryValue = context.query.returnTo;
    const initialReturnTo =
      typeof queryValue === "string" && queryValue.trim()
        ? queryValue
        : "/inner-circle/dashboard";

    return {
      props: {
        initialReturnTo,
        hasActiveSession,
      },
    };
  } catch (error) {
    console.error("[RESEND_SSR_ERROR]", error);
    return {
      props: {
        initialReturnTo: "/inner-circle/dashboard",
        hasActiveSession: false,
      },
    };
  }
};

export default InnerCircleResendPage;