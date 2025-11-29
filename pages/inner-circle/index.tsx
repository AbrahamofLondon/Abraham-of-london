// pages/inner-circle/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

type RegisterResponse =
  | { ok: true; message?: string }
  | { ok: false; error: string };

type UnlockResponse =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; error: string };

const InnerCircleAccessPage: NextPage = () => {
  // STEP 1 – register
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [registerError, setRegisterError] = React.useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] =
    React.useState<string | null>(null);
  const [isRegistering, setIsRegistering] = React.useState(false);

  // STEP 2 – unlock
  const [accessKey, setAccessKey] = React.useState("");
  const [unlockError, setUnlockError] = React.useState<string | null>(null);
  const [unlockSuccess, setUnlockSuccess] =
    React.useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = React.useState(false);

  const handleRegister = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    setRegisterError(null);
    setRegisterSuccess(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail) {
      setRegisterError("Please enter the email you use for the Inner Circle.");
      return;
    }

    setIsRegistering(true);

    try {
      const res = await fetch("/api/inner-circle/register", {
        method: "POST", // ⬅ ensure POST (fixes 405)
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          name: trimmedName || undefined,
          returnTo: "/canon", // default return target
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
        setRegisterError(message);
        setRegisterSuccess(null);
        return;
      }

      setRegisterSuccess(
        data.message ??
          "Registration successful. Check your inbox for your access key and unlock link.",
      );
      setRegisterError(null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[InnerCircle] register error:", err);
      setRegisterError(
        "Unable to reach the server. Please check your connection and try again.",
      );
      setRegisterSuccess(null);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnlock = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    setUnlockError(null);
    setUnlockSuccess(null);

    const trimmedKey = accessKey.trim();
    if (!trimmedKey) {
      setUnlockError("Key is required.");
      return;
    }

    setIsUnlocking(true);

    try {
      const res = await fetch("/api/inner-circle/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: trimmedKey,
          returnTo: "/canon",
        }),
      });

      let data: UnlockResponse;
      try {
        data = (await res.json()) as UnlockResponse;
      } catch {
        data = { ok: false, error: "Unexpected response from the server." };
      }

      if (!res.ok || !data.ok) {
        const message =
          !data.ok && "error" in data && data.error
            ? data.error
            : "Unable to unlock this device. Please check your key and try again.";
        setUnlockError(message);
        setUnlockSuccess(null);
        return;
      }

      setUnlockSuccess(
        data.message ??
          "Device unlocked. You now have access to restricted Canon volumes on this browser.",
      );
      setUnlockError(null);

      if (data.redirectTo) {
        // soft navigation – no full reload
        window.location.href = data.redirectTo;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[InnerCircle] unlock error:", err);
      setUnlockError(
        "Unable to reach the server. Please check your connection and try again.",
      );
      setUnlockSuccess(null);
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <Layout title="Inner Circle Access">
      <Head>
        <title>Access the Canon Inner Circle | Abraham of London</title>
        <meta
          name="description"
          content="Register your email to receive a personal access key, then unlock this device for full access to restricted Canon volumes."
        />
      </Head>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:pt-16 lg:pt-20">
        <header className="mb-10 space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-softGold/70">
            Inner Circle
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Access the Canon Inner Circle
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-softGold/80">
            Register your email to receive a personal access key, then unlock
            this device for full access to restricted Canon volumes.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          {/* STEP 1 – REGISTER */}
          <section className="rounded-2xl border border-softGold/30 bg-black/70 p-6 shadow-xl shadow-black/40 backdrop-blur">
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-softGold/80">
              Step 1 · Register
            </h2>
            <p className="mt-2 text-sm text-softGold/80">
              Enter the email you use for the Inner Circle. We&apos;ll send you
              an access key and unlock link.
            </p>

            <form onSubmit={handleRegister} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="inner-circle-email"
                  className="block text-xs font-semibold uppercase tracking-[0.18em] text-softGold/80"
                >
                  Email address
                </label>
                <input
                  id="inner-circle-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="inner-circle-name"
                  className="block text-xs font-semibold uppercase tracking-[0.18em] text-softGold/80"
                >
                  Name <span className="text-softGold/60">(optional)</span>
                </label>
                <input
                  id="inner-circle-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-softGold/20 bg-black/50 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                  placeholder="What should we call you?"
                />
              </div>

              {registerError && (
                <div className="rounded-lg border border-red-700/70 bg-red-900/30 px-3 py-2 text-xs text-red-100">
                  {registerError}
                </div>
              )}

              {registerSuccess && (
                <div className="rounded-lg border border-emerald-600/70 bg-emerald-900/30 px-3 py-2 text-xs text-emerald-100">
                  {registerSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isRegistering}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-softGold px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-softGold/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isRegistering ? "Sending access key…" : "Send access key"}
              </button>

              <p className="text-[11px] text-softGold/70">
                Already a subscriber to the main newsletter? Use the same email.
                If you don&apos;t see the email, check your promotions or spam
                folder.
              </p>
            </form>
          </section>

          {/* STEP 2 – UNLOCK */}
          <section className="rounded-2xl border border-softGold/30 bg-black/70 p-6 shadow-xl shadow-black/40 backdrop-blur">
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-softGold/80">
              Step 2 · Unlock this device
            </h2>
            <p className="mt-2 text-sm text-softGold/80">
              Paste the access key from your email. This will set a secure
              cookie on this browser to unlock Canon Inner Circle volumes.
            </p>

            <form onSubmit={handleUnlock} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="inner-circle-key"
                  className="block text-xs font-semibold uppercase tracking-[0.18em] text-softGold/80"
                >
                  Access key
                </label>
                <input
                  id="inner-circle-key"
                  type="text"
                  autoComplete="off"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="w-full rounded-lg border border-softGold/30 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:ring-1 focus:ring-softGold/60"
                  placeholder="Paste your key here"
                />
              </div>

              {unlockError && (
                <div className="rounded-lg border border-red-700/70 bg-red-900/30 px-3 py-2 text-xs text-red-100">
                  {unlockError}
                </div>
              )}

              {unlockSuccess && (
                <div className="rounded-lg border border-emerald-600/70 bg-emerald-900/30 px-3 py-2 text-xs text-emerald-100">
                  {unlockSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isUnlocking}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-softGold px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-softGold/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isUnlocking ? "Unlocking…" : "Unlock Canon access"}
              </button>

              <p className="text-[11px] text-softGold/70">
                Once unlocked, you can open restricted Canon volumes directly on
                this device. Your access is stored only on this
                browser/device.
              </p>
              <p className="text-[11px] text-softGold/70">
                Need help? <a href="/contact" className="underline">Contact support.</a>
              </p>
            </form>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default InnerCircleAccessPage;