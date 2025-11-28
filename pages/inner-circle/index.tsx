// pages/inner-circle/index.tsx

import * as React from "react";
import { useRouter } from "next/router";
import SiteLayout from "@/components/SiteLayout";

type RegisterResponse =
  | { ok: true; accessKey: string; unlockUrl: string }
  | { ok: false; error: string };

type UnlockResponse =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

export default function InnerCirclePage() {
  const router = useRouter();

  const returnTo =
    typeof router.query.returnTo === "string"
      ? router.query.returnTo
      : "/canon";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [regLoading, setRegLoading] = React.useState(false);
  const [regError, setRegError] = React.useState<string | null>(null);
  const [regSuccess, setRegSuccess] = React.useState<string | null>(null);
  const [issuedKey, setIssuedKey] = React.useState<string | null>(null);

  const [manualKey, setManualKey] = React.useState("");
  const [unlockLoading, setUnlockLoading] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegLoading(true);
    setRegError(null);
    setRegSuccess(null);
    setIssuedKey(null);

    try {
      const res = await fetch("/api/inner-circle/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, returnTo }),
      });

      const data = (await res.json()) as RegisterResponse;

      if (!data.ok) {
        setRegError(data.error || "Something went wrong.");
        return;
      }

      setIssuedKey(data.accessKey);
      setRegSuccess(
        "Access key issued. We’ve also emailed it to you (if email delivery is configured).",
      );
    } catch (err) {
      setRegError("Unable to contact server. Please try again.");
    } finally {
      setRegLoading(false);
    }
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setUnlockLoading(true);
    setUnlockError(null);

    try {
      const res = await fetch("/api/inner-circle/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: manualKey, returnTo }),
      });

      const data = (await res.json()) as UnlockResponse;

      if (!data.ok) {
        setUnlockError(data.error || "Invalid key.");
        return;
      }

      await router.push(data.redirectTo || "/canon");
    } catch (err) {
      setUnlockError("Unable to contact server. Please try again.");
    } finally {
      setUnlockLoading(false);
    }
  }

  async function handleUseIssuedKey() {
    if (!issuedKey) return;
    setManualKey(issuedKey);
    // we could auto-call unlock, but better to keep one explicit action
  }

  return (
    <SiteLayout pageTitle="Inner Circle | The Canon">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        {/* Header */}
        <header className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-softGold/80">
            Inner Circle
          </p>
          <h1 className="mt-3 font-serif text-3xl text-cream sm:text-4xl">
            Access the Canon Inner Circle
          </h1>
          <p className="mt-3 text-sm text-gray-300">
            Inner Circle members receive full access to restricted Canon
            volumes, private reflections, and strategy briefings. Joining is
            free, but access is gated by an Inner Circle key.
          </p>
        </header>

        {/* Two-column layout */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* LEFT: Registration */}
          <section className="rounded-2xl border border-softGold/30 bg-black/40 px-5 py-6 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-softGold">
              Step 1 · Join the Inner Circle
            </h2>
            <p className="mb-4 text-xs text-gray-300">
              Enter your email to receive an access key. We’ll show the key
              on-screen and (optionally) email it to you.
            </p>

            <form onSubmit={handleRegister} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm text-cream outline-none focus:border-softGold"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm text-cream outline-none focus:border-softGold"
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-softGold px-4 py-2 text-xs font-semibold text-black transition hover:bg-softGold/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {regLoading ? "Issuing key..." : "Issue Inner Circle Key"}
              </button>

              {regError && (
                <p className="text-xs text-red-400">{regError}</p>
              )}

              {regSuccess && (
                <div className="space-y-2 rounded-xl border border-softGold/40 bg-softGold/5 p-3 text-xs text-softGold">
                  <p className="font-semibold">{regSuccess}</p>
                  {issuedKey && (
                    <>
                      <p className="text-[0.7rem] text-gray-300">
                        Your access key:
                      </p>
                      <p className="rounded-lg bg-black/60 px-3 py-2 font-mono text-[0.8rem] tracking-wide text-softGold">
                        {issuedKey}
                      </p>
                      <button
                        type="button"
                        onClick={handleUseIssuedKey}
                        className="text-[0.7rem] font-semibold text-softGold underline underline-offset-4"
                      >
                        Use this key below to unlock now
                      </button>
                    </>
                  )}
                </div>
              )}
            </form>
          </section>

          {/* RIGHT: Manual unlock */}
          <section className="rounded-2xl border border-gray-800 bg-black/30 px-5 py-6 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-200">
              Step 2 · Unlock on this device
            </h2>
            <p className="mb-4 text-xs text-gray-400">
              If you already have an Inner Circle key (from email or another
              device), paste it here to unlock access on this browser.
            </p>

            <form onSubmit={handleUnlock} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                  Inner Circle Access Key
                </label>
                <input
                  type="text"
                  required
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm text-cream outline-none focus:border-softGold"
                />
              </div>

              <button
                type="submit"
                disabled={unlockLoading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {unlockLoading ? "Unlocking..." : "Unlock Inner Circle Access"}
              </button>

              {unlockError && (
                <p className="text-xs text-red-400">{unlockError}</p>
              )}

              <p className="mt-4 text-[0.7rem] text-gray-500">
                Once unlocked, you’ll be redirected to:
                <span className="ml-1 font-mono text-softGold">
                  {returnTo}
                </span>
              </p>
            </form>
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}