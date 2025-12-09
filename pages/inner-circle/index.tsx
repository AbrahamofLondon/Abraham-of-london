import * as React from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";
import useAnalytics from "@/hooks/useAnalytics";
import { getRecaptchaTokenSafe } from "@/lib/recaptchaClient";

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
      // 1. Get reCAPTCHA token (safe wrapper – returns null on failure)
      const recaptchaToken = await getRecaptchaTokenSafe(
        "inner_circle_register"
      );

      if (!recaptchaToken) {
        setRegisterState("error");
        setRegisterMessage(
          "Security check failed. Please ensure JavaScript is enabled and try again."
        );
        trackEvent("inner_circle_register_error", {
          error: "recaptcha_token_missing_or_failed",
        });
        return;
      }

      trackEvent("inner_circle_register_submit", {
        email_domain: email.split("@")[1] ?? "",
      });

      const body = {
        email,
        name,
        returnTo,
        recaptchaToken,
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
          "Check your inbox. We've sent your Inner Circle access key and unlock link."
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
          "We've resent your Inner Circle email. Check your inbox."
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
      <main className="mx-auto max-w-3xl px-4 py-16">
        <header className="mb-10 text-center">
          <h1 className="mb-4 font-serif text-4xl tracking-tight text-cream">
            Inner Circle Access
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-softGold/90">
            A curated space for supporters and trusted readers.
            <br />
            Your key unlocks exclusive writings, early drafts, and deeper notes.
          </p>

          <div
            className={`mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${
              alreadyUnlocked
                ? "bg-green-900/20 text-green-400"
                : "bg-softGold/10 text-softGold/80"
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                alreadyUnlocked ? "bg-green-400" : "bg-softGold/60"
              }`}
            />
            {badgeText}
          </div>
        </header>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="relative mb-4 flex items-center justify-between">
            <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-softGold/20" />
            <div
              className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-softGold transition-all duration-500"
              style={{ width: `${((progressStep - 1) / 2) * 100}%` }}
            />
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors ${
                  step <= progressStep
                    ? "border-softGold bg-softGold text-black"
                    : "border-softGold/30 bg-black text-softGold/50"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-softGold/70">
            <span className="max-w-[80px] text-center">Request Access</span>
            <span className="max-w-[80px] text-center">Enter Key</span>
            <span className="max-w-[80px] text-center">Unlocked</span>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column: Registration */}
          <section className="space-y-6">
            <h2 className="font-serif text-2xl text-cream">
              Request an Access Key
            </h2>
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm text-softGold/80">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-softGold/30 bg-black/50 px-4 py-3 text-cream outline-none transition-colors focus:border-softGold/60"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isRegistering}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-softGold/80">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-lg border border-softGold/30 bg-black/50 px-4 py-3 text-cream outline-none transition-colors focus:border-softGold/60"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isRegistering}
                />
              </div>

              {registerMessage && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    registerState === "error"
                      ? "bg-red-900/20 text-red-300"
                      : "bg-green-900/20 text-green-300"
                  }`}
                >
                  {registerMessage}
                  {registerState === "success" && email && (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="ml-2 text-softGold hover:underline"
                    >
                      Resend?
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isRegistering}
                className="flex w-full items-center justify-center rounded-full bg-softGold px-6 py-3 font-medium text-black transition-colors hover:bg-softGold/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRegistering ? (
                  <>
                    <span className="mr-2 h-2 w-2 animate-ping rounded-full bg-black" />
                    Sending…
                  </>
                ) : (
                  "Request Access Key"
                )}
              </button>
            </form>

            <div className="border-t border-softGold/20 pt-4">
              <h3 className="mb-2 text-sm font-medium text-cream">
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-softGold/70">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-softGold">✓</span>
                  You’ll receive an email with your personal access key and a
                  one-click unlock link.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-softGold">✓</span>
                  Use either method to unlock this browser permanently.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-softGold">✓</span>
                  Your access persists until you clear browser data.
                </li>
              </ul>
            </div>
          </section>

          {/* Right Column: Unlock */}
          <section className="space-y-6">
            <h2 className="font-serif text-2xl text-cream">
              Already Have a Key?
            </h2>
            <form onSubmit={handleUnlock} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm text-softGold/80">
                  Access Key
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-softGold/30 bg-black/50 px-4 py-3 font-mono text-cream outline-none transition-colors focus:border-softGold/60"
                  placeholder="ic_••••••••••••••••••••••••"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  disabled={isUnlocking || alreadyUnlocked}
                />
                <p className="mt-1 text-xs text-softGold/50">
                  Usually 28 characters, starting with{" "}
                  <code className="rounded bg-black/30 px-1">ic_</code>
                </p>
              </div>

              {unlockMessage && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    unlockState === "error"
                      ? "bg-red-900/20 text-red-300"
                      : "bg-green-900/20 text-green-300"
                  }`}
                >
                  {unlockMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isUnlocking || alreadyUnlocked}
                className="flex w-full items-center justify-center rounded-full border border-softGold/50 bg-transparent px-6 py-3 font-medium text-softGold transition-colors hover:border-softGold hover:bg-softGold/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {alreadyUnlocked ? (
                  "Already Unlocked"
                ) : isUnlocking ? (
                  <>
                    <span className="mr-2 h-2 w-2 animate-ping rounded-full bg-softGold" />
                    Unlocking…
                  </>
                ) : (
                  "Unlock This Browser"
                )}
              </button>
            </form>

            <div className="border-t border-softGold/20 pt-4">
              <h3 className="mb-2 text-sm font-medium text-cream">
                Troubleshooting
              </h3>
              <ul className="space-y-2 text-sm text-softGold/70">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-softGold">•</span>
                  Can’t find the key? Check spam, promotions, or request a
                  resend above.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-softGold">•</span>
                  Key not working? Ensure you’re copying the full string,
                  including <code className="rounded bg-black/30 px-1">ic_</code>
                  .
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-softGold">•</span>
                  On a shared device? Unlock only if you trust others using this
                  browser.
                </li>
              </ul>
            </div>
          </section>
        </div>

        <footer className="mt-16 border-t border-softGold/20 pt-8 text-center text-sm text-softGold/60">
          <p>
            Inner Circle access is managed privately and respectfully. No
            tracking, no ads, no nonsense.
          </p>
          <p className="mt-1">
            Questions?{" "}
            <a
              href="mailto:support@example.com"
              className="text-softGold hover:underline"
            >
              support@example.com
            </a>
          </p>
        </footer>
      </main>
    </Layout>
  );
};

export default InnerCirclePage;