// pages/inner-circle/index.tsx
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

  // … everything below here (layout / JSX) unchanged …
  // (You can keep your existing JSX from your current file)
  // -------------------------------------------------------------------
  // I’m not repeating the whole render tree to avoid noise; just drop
  // this updated logic section into your existing component.
  // -------------------------------------------------------------------

  return (
    <Layout title="Inner Circle Access">
      {/* keep the existing JSX body exactly as you have it now */}
      {/* (form markup already matches the handlers above) */}
      {/* ... */}
    </Layout>
  );
};

export default InnerCirclePage;