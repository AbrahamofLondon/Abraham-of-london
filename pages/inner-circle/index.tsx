// pages/inner-circle/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";
import useAnalytics from "@/hooks/useAnalytics";

type RegisterState = "idle" | "submitting" | "success" | "error";
type UnlockState = "idle" | "submitting" | "success" | "error";

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";

function hasInnerCircleCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .some((c) => c.startsWith(`${INNER_CIRCLE_COOKIE_NAME}=true`));
}

const InnerCirclePage: NextPage = () => {
  const router = useRouter();
  const { trackEvent } = useAnalytics();

  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [accessKey, setAccessKey] = React.useState("");
  const [registerState, setRegisterState] =
    React.useState<RegisterState>("idle");
  const [unlockState, setUnlockState] = React.useState<UnlockState>("idle");
  const [registerMessage, setRegisterMessage] = React.useState<string | null>(
    null
  );
  const [unlockMessage, setUnlockMessage] = React.useState<string | null>(null);
  const [alreadyUnlocked, setAlreadyUnlocked] = React.useState(false);

  const returnTo =
    typeof router.query.returnTo === "string"
      ? router.query.returnTo
      : "/canon";

  React.useEffect(() => {
    setAlreadyUnlocked(hasInnerCircleCookie());
  }, []);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !name) return;

    setRegisterState("submitting");
    setRegisterMessage(null);

    try {
      trackEvent("inner_circle_register_submit", {
        email_domain: email.split("@")[1] ?? "",
      });

      // If you have client-side reCAPTCHA, inject token here
      const body = {
        email,
        name,
        returnTo,
        // recaptchaToken: ...
      };

      const res = await fetch("/api/inner-circle/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
      };

      if (!data.ok) {
        setRegisterState("error");
        setRegisterMessage(data.error ?? "Registration failed.");
        trackEvent("inner_circle_register_error", {
          error: data.error ?? "unknown",
          status: res.status,
        });
        return;
      }

      setRegisterState("success");
      setRegisterMessage(
        data.message ??
          "Check your inbox. We’ve sent your Inner Circle access key and unlock link."
      );
      trackEvent("inner_circle_register_success", { status: res.status });
    } catch (err) {
      setRegisterState("error");
      setRegisterMessage("Something went wrong. Please try again.");
      trackEvent("inner_circle_register_error", {
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  };

  const handleUnlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessKey) return;

    setUnlockState("submitting");
    setUnlockMessage(null);

    try {
      trackEvent("inner_circle_unlock_submit", {});

      const res = await fetch("/api/inner-circle/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: accessKey, returnTo }),
      });

      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
        redirectTo?: string;
      };

      if (!data.ok) {
        setUnlockState("error");
        setUnlockMessage(data.error ?? "Unlock failed.");
        trackEvent("inner_circle_unlock_error", {
          error: data.error ?? "unknown",
          status: res.status,
        });
        return;
      }

      setUnlockState("success");
      setUnlockMessage(data.message ?? "Device unlocked.");
      setAlreadyUnlocked(true);
      trackEvent("inner_circle_unlock_success", {});

      const target = data.redirectTo ?? returnTo ?? "/canon";
      setTimeout(() => {
        void router.push(target);
      }, 900);
    } catch (err) {
      setUnlockState("error");
      setUnlockMessage("Something went wrong. Please try again.");
      trackEvent("inner_circle_unlock_error", {
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setRegisterState("submitting");
    setRegisterMessage(null);

    try {
      const res = await fetch("/api/inner-circle/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, returnTo }),
      });

      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
      };

      if (!data.ok) {
        setRegisterState("error");
        setRegisterMessage(data.error ?? "Could not resend key.");
        return;
      }

      setRegisterState("success");
      setRegisterMessage(
        data.message ??
          "We’ve resent your Inner Circle email. Check your inbox."
      );
    } catch (err) {
      setRegisterState("error");
      setRegisterMessage("Could not resend key. Please try again later.");
    }
  };

  const isRegistering = registerState === "submitting";
  const isUnlocking = unlockState === "submitting";

  const badgeText = alreadyUnlocked
    ? "This browser already has Inner Circle access."
    : "This browser is not yet unlocked.";

  return (
    <Layout title="Inner Circle Access">
      <main className="mx-auto max-w-4xl px-4 py-16 sm:py-20 lg:py-24">
        <header className="mb-10 space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-softGold/80">
            Inner Circle
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Access the Canon Inner Circle
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-softGold/80">
            Register your email to receive a personal access key, then unlock
            this device for full access to restricted Canon volumes.
          </p>
          <p className="mt-2 text-xs text-softGold/70">{badgeText}</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Step 1: Register */}
          <section className="rounded-2xl border border-softGold/40 bg-slate-950/60 p-6 shadow-lg shadow-black/40">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-softGold/70">
              Step 1 · Register
            </p>
            <h2 className="mt-2 font-serif text-xl text-cream">
              Request your Inner Circle key
            </h2>
            <p className="mt-2 text-xs text-softGold/80">
              Use the email you already receive Abraham of London updates with.
              If you&apos;re new, this will create a secure Inner Circle record.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleRegister}>
              <div>
                <label className="block text-xs font-medium text-softGold/80">
                  Name
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-softGold/40 bg-black/60 px-3 py-2 text-sm text-cream outline-none ring-0 transition focus:border-softGold focus:bg-black/80"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-softGold/80">
                  Email address
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-softGold/40 bg-black/60 px-3 py-2 text-sm text-cream outline-none ring-0 transition focus:border-softGold focus:bg-black/80"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              {registerMessage && (
                <p
                  className={`text-xs ${
                    registerState === "error"
                      ? "text-red-400"
                      : "text-emerald-300"
                  }`}
                >
                  {registerMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isRegistering}
                className="inline-flex w-full items-center justify-center rounded-full bg-softGold px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-softGold/90 disabled:cursor-not-allowed disabled:bg-softGold/60"
              >
                {isRegistering ? "Sending…" : "Send access key"}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={!email || isRegistering}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-softGold/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-softGold/90 transition hover:border-softGold hover:bg-black/40 disabled:cursor-not-allowed disabled:border-softGold/20 disabled:text-softGold/40"
              >
                Didn&apos;t get the email? Resend
              </button>

              <p className="mt-2 text-[11px] text-softGold/70">
                If you don&apos;t see the email in your inbox, check Promotions
                or Spam. The key works only with the address you register here.
              </p>
            </form>
          </section>

          {/* Step 2: Unlock this device */}
          <section className="rounded-2xl border border-softGold/40 bg-slate-950/60 p-6 shadow-lg shadow-black/40">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-softGold/70">
              Step 2 · Unlock this device
            </p>
            <h2 className="mt-2 font-serif text-xl text-cream">
              Paste your Inner Circle key
            </h2>
            <p className="mt-2 text-xs text-softGold/80">
              Paste the access key from your email. This sets a secure cookie in
              this browser and unlocks all Inner Circle Canon volumes on this
              device.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleUnlock}>
              <div>
                <label className="block text-xs font-medium text-softGold/80">
                  Access key
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-softGold/40 bg-black/60 px-3 py-2 text-sm text-cream outline-none ring-0 transition focus:border-softGold focus:bg-black/80"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                  placeholder="PASTE-YOUR-KEY-HERE"
                  required
                />
              </div>

              {unlockMessage && (
                <p
                  className={`text-xs ${
                    unlockState === "error"
                      ? "text-red-400"
                      : "text-emerald-300"
                  }`}
                >
                  {unlockMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isUnlocking || !accessKey}
                className="inline-flex w-full items-center justify-center rounded-full bg-softGold px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-softGold/90 disabled:cursor-not-allowed disabled:bg-softGold/60"
              >
                {isUnlocking ? "Unlocking…" : "Unlock Canon access"}
              </button>

              <p className="mt-2 text-[11px] text-softGold/70">
                Once unlocked, you can open restricted Canon volumes directly.
                Access is stored only on this browser/device. You can revoke
                access at any time by clearing cookies.
              </p>
            </form>
          </section>
        </div>

        <section className="mt-10 border-t border-softGold/20 pt-6 text-xs text-softGold/70">
          <p>
            We never store your raw email address in access logs. Inner Circle
            keys are hashed and rotated; your unlock state lives as a cookie on
            this device only.
          </p>
        </section>
      </main>
    </Layout>
  );
};

export default InnerCirclePage;
