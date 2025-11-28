// pages/inner-circle/index.tsx
import * as React from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import SiteLayout from "@/components/SiteLayout";

type RegisterResponse = {
  ok: boolean;
  accessKey?: string;
  unlockUrl?: string;
  error?: string;
};

type UnlockResponse = {
  ok: boolean;
  unlocked?: boolean;
  error?: string;
};

const InnerCirclePage: React.FC = () => {
  // Registration state
  const [regEmail, setRegEmail] = React.useState("");
  const [regLoading, setRegLoading] = React.useState(false);
  const [regError, setRegError] = React.useState<string | null>(null);
  const [regSuccess, setRegSuccess] = React.useState<string | null>(null);

  // Unlock state
  const [accessKey, setAccessKey] = React.useState("");
  const [unlockLoading, setUnlockLoading] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] = React.useState<string | null>(null);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);
    setRegLoading(true);

    try {
      const res = await fetch("/api/inner-circle/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail }),
      });

      const data = (await res.json()) as RegisterResponse;

      if (!data.ok) {
        setRegError(data.error ?? "Something went wrong.");
        return;
      }

      setRegSuccess(
        "Access key sent to your email. You can also paste it below to unlock this device.",
      );
    } catch {
      setRegError("Unexpected error. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  const handleUnlock = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUnlockError(null);
    setUnlockSuccess(null);
    setUnlockLoading(true);

    try {
      const res = await fetch("/api/inner-circle/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey }),
      });

      const data = (await res.json()) as UnlockResponse;

      if (!data.ok) {
        setUnlockError(data.error ?? "Invalid or expired access key.");
        return;
      }

      setUnlockSuccess(
        "Device unlocked for Inner Circle Canon access. You can now open restricted volumes.",
      );
    } catch {
      setUnlockError("Unexpected error. Please try again.");
    } finally {
      setUnlockLoading(false);
    }
  };

  return (
    <SiteLayout pageTitle="Inner Circle">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-10 text-center">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-softGold">
            Inner Circle
          </p>
          <h1 className="mt-3 font-serif text-3xl text-gray-900 dark:text-gray-100 sm:text-4xl">
            Access the Canon Inner Circle
          </h1>
          <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
            Register your email to receive a personal access key, then unlock
            this device for full access to restricted Canon volumes.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Registration panel */}
          <section className="rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-softGold">
              Step 1 · Register
            </h2>
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
              Enter the email you use for the Inner Circle. We&apos;ll send you
              an access key and unlock link.
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-left">
                <label
                  htmlFor="inner-circle-email"
                  className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-600 dark:text-gray-300"
                >
                  Email address
                </label>
                <input
                  id="inner-circle-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={regEmail}
                  onChange={(event) => setRegEmail(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
              </div>

              {regError && (
                <p className="text-xs font-semibold text-red-500">
                  {regError}
                </p>
              )}

              {regSuccess && (
                <p className="text-xs font-semibold text-emerald-500">
                  {regSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={regLoading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-softGold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-softGold/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {regLoading ? "Sending..." : "Send Access Key"}
              </button>
            </form>

            <p className="mt-4 text-[0.7rem] text-gray-500 dark:text-gray-400">
              Already a subscriber to the main newsletter? Use the same email.
              If you don&apos;t see the email, check your promotions or spam
              folder.
            </p>
          </section>

          {/* Unlock panel */}
          <section className="rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-softGold">
              Step 2 · Unlock this device
            </h2>
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
              Paste the access key from your email. This will set a secure cookie
              on this browser to unlock Inner Circle Canon volumes.
            </p>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="text-left">
                <label
                  htmlFor="inner-circle-access-key"
                  className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-600 dark:text-gray-300"
                >
                  Access key
                </label>
                <input
                  id="inner-circle-access-key"
                  type="text"
                  required
                  value={accessKey}
                  onChange={(event) => setAccessKey(event.target.value.trim())}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                />
              </div>

              {unlockError && (
                <p className="text-xs font-semibold text-red-500">
                  {unlockError}
                </p>
              )}

              {unlockSuccess && (
                <p className="text-xs font-semibold text-emerald-500">
                  {unlockSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={unlockLoading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 dark:bg-gray-100 dark:text-black dark:hover:bg-white"
              >
                {unlockLoading ? "Unlocking..." : "Unlock Canon Access"}
              </button>
            </form>

            <p className="mt-4 text-[0.7rem] text-gray-500 dark:text-gray-400">
              Once unlocked, you can open restricted Canon volumes directly.
              Your access is stored only on this device/browser.
            </p>

            <p className="mt-3 text-[0.7rem] text-gray-500 dark:text-gray-400">
              Need help?{" "}
              <Link
                href="/contact"
                className="font-semibold text-softGold underline-offset-2 hover:underline"
              >
                Contact support
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </SiteLayout>
  );
};

export default InnerCirclePage;