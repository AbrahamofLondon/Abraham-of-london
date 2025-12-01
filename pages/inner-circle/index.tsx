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

      const body = {
        email,
        name,
        returnTo,
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
    ? "This browser already carries Inner Circle access."
    : "This browser has not yet been marked for Inner Circle access.";

  const progressStep = alreadyUnlocked ? 3 : accessKey ? 2 : 1;

  return (
    <Layout title="Inner Circle Access">
      <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-charcoal text-cream">
        {/* Subtle sacred geometry / header field */}
        <section className="relative border-b border-softGold/20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 -top-40 h-72 bg-[radial-gradient(circle_at_top,_rgba(226,197,120,0.18),_transparent_70%)]" />
            <div className="absolute inset-y-0 left-[12%] w-px bg-gradient-to-b from-softGold/80 via-softGold/0 to-transparent" />
            <div className="absolute inset-y-0 right-[10%] w-px bg-gradient-to-t from-softGold/70 via-softGold/0 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-10 sm:pt-20 sm:pb-12">
            <header className="space-y-4 text-center">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-softGold/80">
                Canon · Inner Circle
              </p>
              <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
                Unlock the Inner Circle Catalogue
              </h1>
              <p className="mx-auto max-w-2xl text-sm text-softGold/80 sm:text-[0.95rem]">
                A two-step gate for restricted Canon volumes — designed for
                fathers, founders, and stewards who read with responsibility,
                not curiosity.
              </p>
              <p className="mt-1 text-[0.75rem] text-softGold/70">{badgeText}</p>

              {/* Progress strip: 1–3 */}
              <div className="mt-6 flex items-center justify-center gap-3 text-[0.7rem] text-softGold/80">
                {[
                  { step: 1, label: "Register" },
                  { step: 2, label: "Unlock Device" },
                  { step: 3, label: "Enter Canon" },
                ].map((item, idx) => {
                  const active = progressStep >= item.step;
                  return (
                    <React.Fragment key={item.step}>
                      <div className="flex items-center gap-2">
                        <div
                          className={[
                            "flex h-7 w-7 items-center justify-center rounded-full border text-[0.7rem] font-semibold",
                            active
                              ? "border-softGold bg-softGold text-black shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
                              : "border-softGold/30 text-softGold/70 bg-black/40",
                          ].join(" ")}
                        >
                          {item.step}
                        </div>
                        <span
                          className={
                            active
                              ? "uppercase tracking-[0.18em] text-softGold"
                              : "uppercase tracking-[0.18em] text-softGold/50"
                          }
                        >
                          {item.label}
                        </span>
                      </div>
                      {idx < 2 && (
                        <div className="h-px w-6 bg-gradient-to-r from-softGold/30 via-softGold/10 to-softGold/0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </header>
          </div>
        </section>

        {/* Twin panels */}
        <section className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Step 1: Register */}
            <section className="relative overflow-hidden rounded-3xl border border-softGold/40 bg-[radial-gradient(circle_at_top,_rgba(248,230,170,0.08),_rgba(15,23,42,1))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.9)]">
              <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-softGold/40 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              <div className="relative">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-softGold/75">
                  Step 1 · Register
                </p>
                <h2 className="mt-2 font-serif text-xl text-cream sm:text-[1.35rem]">
                  Request your Inner Circle key
                </h2>
                <p className="mt-2 text-[0.8rem] text-softGold/80">
                  Use the email you already receive Abraham of London updates
                  with. If you&apos;re new, this creates a secure Inner Circle
                  record tied to that address.
                </p>

                <form className="mt-5 space-y-4" onSubmit={handleRegister}>
                  <div>
                    <label className="block text-[0.75rem] font-medium text-softGold/80">
                      Name
                    </label>
                    <input
                      className="mt-1 w-full rounded-lg border border-softGold/40 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:bg-black/80"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[0.75rem] font-medium text-softGold/80">
                      Email address
                    </label>
                    <input
                      className="mt-1 w-full rounded-lg border border-softGold/40 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:bg-black/80"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>

                  {registerMessage && (
                    <p
                      className={`text-[0.75rem] ${
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
                    className="inline-flex w-full items-center justify-center rounded-full bg-softGold px-4 py-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-softGold/90 disabled:cursor-not-allowed disabled:bg-softGold/60"
                  >
                    {isRegistering ? "Sending…" : "Send access key"}
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!email || isRegistering}
                    className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-softGold/40 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-softGold/90 transition hover:border-softGold hover:bg-black/40 disabled:cursor-not-allowed disabled:border-softGold/20 disabled:text-softGold/40"
                  >
                    Didn&apos;t get the email? Resend
                  </button>

                  <p className="mt-2 text-[0.7rem] text-softGold/70">
                    If it doesn&apos;t show, check Promotions or Spam. The key
                    works only with the address registered here.
                  </p>
                </form>
              </div>
            </section>

            {/* Step 2: Unlock this device */}
            <section className="relative overflow-hidden rounded-3xl border border-softGold/40 bg-slate-950/70 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.9)]">
              <div className="pointer-events-none absolute inset-0 opacity-80">
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-softGold/30 via-softGold/70 to-softGold/30" />
                <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-softGold/40 via-transparent to-transparent" />
              </div>

              <div className="relative">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-softGold/75">
                  Step 2 · Unlock this device
                </p>
                <h2 className="mt-2 font-serif text-xl text-cream sm:text-[1.35rem]">
                  Paste your Inner Circle key
                </h2>
                <p className="mt-2 text-[0.8rem] text-softGold/80">
                  Paste the access key from your email. This marks this
                  browser/device as trusted and unlocks restricted Canon volumes
                  here.
                </p>

                <form className="mt-5 space-y-4" onSubmit={handleUnlock}>
                  <div>
                    <label className="block text-[0.75rem] font-medium text-softGold/80">
                      Access key
                    </label>
                    <input
                      className="mt-1 w-full rounded-lg border border-softGold/40 bg-black/60 px-3 py-2 text-sm text-cream outline-none transition focus:border-softGold focus:bg-black/80"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                      placeholder="PASTE-YOUR-KEY-HERE"
                      required
                    />
                  </div>

                  {unlockMessage && (
                    <p
                      className={`text-[0.75rem] ${
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
                    className="inline-flex w-full items-center justify-center rounded-full bg-softGold px-4 py-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-softGold/90 disabled:cursor-not-allowed disabled:bg-softGold/60"
                  >
                    {isUnlocking ? "Unlocking…" : "Unlock Canon access"}
                  </button>

                  <p className="mt-2 text-[0.7rem] text-softGold/70">
                    Once unlocked, you can open restricted Canon volumes
                    directly. Access is stored only on this browser. Clearing
                    cookies revokes it.
                  </p>
                </form>

                {alreadyUnlocked && (
                  <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-[0.75rem] text-emerald-200">
                    This browser already carries an Inner Circle cookie. You can
                    move straight into{" "}
                    <span className="font-semibold text-softGold">
                      restricted Canon entries
                    </span>{" "}
                    from the{" "}
                    <a
                      href="/canon"
                      className="underline decoration-softGold/70 underline-offset-4"
                    >
                      Canon index
                    </a>
                    .
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Privacy + intent footer */}
          <section className="mt-10 border-t border-softGold/20 pt-6 text-[0.7rem] text-softGold/70 space-y-2">
            <p>
              Inner Circle is not a fan club. It is a covenantal reading space
              for material that demands discretion, context, and responsibility.
            </p>
            <p>
              We do not log your raw email in access logs. Keys are hashed and
              rotated. Your unlock state lives as a cookie on this device only.
            </p>
          </section>
        </section>
      </main>
    </Layout>
  );
};

export default InnerCirclePage;