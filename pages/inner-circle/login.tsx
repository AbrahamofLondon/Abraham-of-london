// pages/inner-circle/login.tsx

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import Layout from "@/components/Layout";

function normalizeReturnTo(input: unknown): string {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return "/inner-circle";
  if (!raw.startsWith("/")) return "/inner-circle";
  if (raw.startsWith("//")) return "/inner-circle";
  return raw;
}

export default function InnerCircleLoginPage() {
  const router = useRouter();
  const returnTo = React.useMemo(
    () => normalizeReturnTo(router.query.returnTo),
    [router.query.returnTo]
  );

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: returnTo,
      });

      if (!result || result.error) {
        setError("Invalid credentials or access not permitted.");
        return;
      }

      await router.push(returnTo);
    } catch (err) {
      console.error("Inner Circle login failed:", err);
      setError("Unexpected authentication error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout
      title="Inner Circle Login | Abraham of London"
      description="Secure access for Inner Circle members."
      canonicalUrl="/inner-circle/login"
      minimalHeader
      enableVaultSearch={false}
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
              Inner Circle Login
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-amber-500/40"
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Authorizing..." : "Enter Inner Circle"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-white/45">
            <Link href="/" className="hover:text-white">
              Back to Home
            </Link>
            <span>Return target: {returnTo}</span>
          </div>
        </div>
      </section>
    </Layout>
  );
}