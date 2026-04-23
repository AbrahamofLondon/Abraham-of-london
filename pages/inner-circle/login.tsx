// pages/inner-circle/login.tsx

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import Layout from "@/components/Layout";

type AuthStep = "request" | "credentials" | "success";

function normalizeReturnTo(input: unknown): string {
  let raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return "/inner-circle";

  for (let i = 0; i < 2 && raw.includes("%"); i++) {
    try {
      raw = decodeURIComponent(raw);
    } catch {
      break;
    }
  }

  if (!raw.startsWith("/")) return "/inner-circle";
  if (raw.startsWith("//")) return "/inner-circle";
  return raw;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getInitialStep(input: unknown): AuthStep {
  const raw = typeof input === "string" ? input.trim().toLowerCase() : "";
  return raw === "credentials" ? "credentials" : "request";
}

export default function InnerCircleLoginPage() {
  const router = useRouter();

  const returnTo = React.useMemo(
    () => normalizeReturnTo(router.query.returnTo),
    [router.query.returnTo]
  );

  const initialStep = React.useMemo(
    () => getInitialStep(router.query.step),
    [router.query.step]
  );

  const [step, setStep] = React.useState<AuthStep>(initialStep);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");

  React.useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  async function handleRequestAccess(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address to continue.");
      return;
    }

    setLoading(true);

    try {
      // Primary path: register/provision via the real Inner Circle API.
      // This endpoint upserts the member, generates an IC access key, and
      // emails it to the address. Works for both new and returning members.
      const res = await fetch("/api/inner-circle/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        console.warn("[login:request] register failed:", data?.error);
        setError(
          "Access could not be verified. If you have existing access, sign in below."
        );
        return;
      }

      // Do NOT surface the raw access key here — it is emailed to the user.
      // Generic success prevents user enumeration.
      setNotice(
        "Your secure access key has been sent. Check your inbox and spam folder for instructions."
      );
      setStep("success");
    } catch (err) {
      console.error("[login:request] unexpected error:", err);
      setError(
        "Access request could not be completed. If you already have access, sign in below."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCredentialSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
        callbackUrl: returnTo,
      });

      if (!result || result.error) {
        setError("Invalid credential or access not permitted.");
        return;
      }

      await router.push(returnTo);
    } catch (err) {
      console.error("Inner Circle credential sign-in failed:", err);
      setError("Unexpected authentication error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout
      title="Inner Circle Access | Abraham of London"
      description="Secure access for Inner Circle members."
      canonicalUrl="/inner-circle/login"
      enableVaultSearch={false}
      showFooter={false}
    >
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <section className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
          <div className="mb-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-400/80">
              Secure Access Node
            </div>

            <h1 className="mt-3 font-serif text-4xl italic text-white">
              Inner Circle Access
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-white/65">
              {step === "credentials"
                ? "Enter your issued credential to continue."
                : "Enter your email address to request your login credential or receive your secure access link."}
            </p>
          </div>

          {step === "request" && (
            <form onSubmit={handleRequestAccess} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-amber-500/40"
                  placeholder="you@example.com"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <p>{error}</p>
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setError(""); setStep("credentials"); }}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10"
                    >
                      Continue to sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => { setError(""); setStep("request"); }}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10"
                    >
                      Request access again
                    </button>
                  </div>
                </div>
              ) : null}

              {notice ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {notice}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Requesting Access..." : "Request Access"}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setNotice("");
                    setStep("credentials");
                  }}
                  className="text-xs text-white/45 transition-colors hover:text-white"
                >
                  I already have a credential
                </button>
              </div>
            </form>
          )}

          {step === "credentials" && (
            <form onSubmit={handleCredentialSignIn} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-amber-500/40"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45"
                >
                  Credential
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-amber-500/40"
                  placeholder="Enter issued credential"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <p>{error}</p>
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setError(""); setStep("request"); }}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10"
                    >
                      Request new access
                    </button>
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Authorizing..." : "Enter Inner Circle"}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setPassword("");
                    setError("");
                    setNotice("");
                    setStep("request");
                  }}
                  className="text-xs text-white/45 transition-colors hover:text-white"
                >
                  Back to email-first access
                </button>
              </div>
            </form>
          )}

          {step === "success" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm leading-relaxed text-emerald-100">
                {notice ||
                  "If your email is recognized, a secure access link or login instruction has been sent."}
              </div>

              <div>
                <label
                  htmlFor="email-success"
                  className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45"
                >
                  Email
                </label>
                <input
                  id="email-success"
                  type="email"
                  value={email}
                  readOnly
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/70 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setNotice("");
                  setStep("request");
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/[0.06]"
              >
                Send Again
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setNotice("");
                    setStep("credentials");
                  }}
                  className="text-xs text-white/45 transition-colors hover:text-white"
                >
                  I already have a credential
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-white/45">
            <Link href="/" className="hover:text-white transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}