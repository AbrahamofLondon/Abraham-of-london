"use client";

import * as React from "react";
import { getRecaptchaToken } from "@/lib/recaptchaClient";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface NewsletterFormProps {
  variant?: "default" | "premium";
  placeholder?: string;
  buttonText?: string;
}

interface NewsletterFormData {
  email: string;
  honeypot: string;
  timestamp: string;
  userAgent: string;
}

interface NewsletterResponse {
  message?: string;
  ok?: boolean;
  error?: string;
}

export default function NewsletterForm({
  variant = "default",
  placeholder = "you@example.com",
  buttonText = "Subscribe",
}: NewsletterFormProps) {
  const [email, setEmail] = React.useState("");
  const [honeypot, setHoneypot] = React.useState(""); // Enhanced honeypot
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = React.useState("");
  const [submitAttempts, setSubmitAttempts] = React.useState(0);
  const [lastSubmitTime, setLastSubmitTime] = React.useState<number>(0);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const statusRef = React.useRef<HTMLParagraphElement | null>(null);

  // Rate limiting: max 3 submissions per minute
  const isRateLimited = React.useMemo(() => {
    const now = Date.now();
    return submitAttempts >= 3 && now - lastSubmitTime < 60000;
  }, [submitAttempts, lastSubmitTime]);

  React.useEffect(() => {
    if (status !== "idle" && statusRef.current) {
      statusRef.current.focus();
    }
  }, [status, message]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  function validateForm(): string | null {
    // Honeypot validation - if filled, likely a bot
    if (honeypot.trim() !== "") {
      console.warn("Newsletter honeypot triggered - possible bot");
      return "Thank you for subscribing!";
    }

    // Email validation
    if (!email.trim()) {
      return "Please enter your email address";
    }

    if (!EMAIL_RE.test(email.trim().toLowerCase())) {
      return "Please enter a valid email address";
    }

    // Email length validation
    if (email.length > 254) {
      return "Email address is too long";
    }

    // Rate limiting
    if (isRateLimited) {
      return "Too many attempts. Please try again in a minute.";
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (status === "loading") return;

    // Form validation
    const validationError = validateForm();
    if (validationError) {
      if (honeypot.trim() !== "") {
        // Pretend success for bots
        setStatus("success");
        setMessage("You're subscribed. Welcome!");
        setEmail("");
        setHoneypot("");
        return;
      }
      setStatus("error");
      setMessage(validationError);
      return;
    }

    setStatus("loading");
    setMessage("");

    // Abort any existing request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Enhanced reCAPTCHA v3 with timeout
      const recaptchaToken = await Promise.race([
        getRecaptchaToken("newsletter_signup"),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);

      if (!recaptchaToken) {
        setStatus("error");
        setMessage("Security verification failed. Please try again.");
        return;
      }

      const formData: NewsletterFormData = {
        email: email.trim().toLowerCase(),
        honeypot,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken,
        }),
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Newsletter API error ${response.status}:`, errorText);

        if (response.status === 429) {
          throw new Error("Too many requests. Please try again later.");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        } else {
          throw new Error("Subscription failed. Please try again.");
        }
      }

      let data: NewsletterResponse = {};
      try {
        data = (await response.json()) as NewsletterResponse;
      } catch {
        throw new Error("Invalid server response");
      }

      const successMessage = data.message || "You're subscribed. Welcome!";

      if (response.ok && data.ok !== false) {
        setStatus("success");
        setMessage(successMessage);
        setEmail("");
        setHoneypot("");

        // Update rate limiting
        setSubmitAttempts((prev) => prev + 1);
        setLastSubmitTime(Date.now());
      } else {
        throw new Error(data.error || "Subscription failed");
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setStatus("error");
          setMessage("Request timeout. Please try again.");
        } else {
          setStatus("error");
          setMessage(error.message);
        }
      } else {
        setStatus("error");
        setMessage("An unexpected error occurred");
      }
    } finally {
      abortControllerRef.current = null;
    }
  }

  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const isError = status === "error";

  const wrapperClasses =
    variant === "premium"
      ? [
          "mx-auto flex w-full max-w-xl flex-col gap-3",
          "rounded-2xl border border-softGold/40 bg-black/40",
          "p-4 sm:flex-row sm:items-center sm:p-5",
          "shadow-[0_18px_45px_rgba(0,0,0,0.55)] backdrop-blur",
        ].join(" ")
      : [
          "mx-auto flex w-full max-w-xl flex-col gap-3",
          "rounded-2xl border border-lightGrey bg-warmWhite",
          "p-4 sm:flex-row sm:items-center sm:p-5",
          "shadow-card",
        ].join(" ");

  const buttonClasses =
    variant === "premium"
      ? [
          "rounded-full px-5 py-2 text-sm font-semibold",
          "bg-softGold text-black",
          "transition-all duration-150",
          "hover:bg-softGold/90 hover:-translate-y-[1px]",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0",
          "focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2",
        ].join(" ")
      : [
          "rounded-full px-5 py-2 text-sm font-semibold",
          "bg-forest text-cream",
          "transition-all duration-150",
          "hover:bg-[color:var(--color-primary)/0.9] hover:-translate-y-[1px]",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0",
          "focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2",
        ].join(" ");

  const inputClasses =
    variant === "premium"
      ? [
          "flex-1 rounded-lg border border-white/25 bg-black/40 px-3 py-2 text-sm text-cream",
          "placeholder:text-gray-400",
          "focus:border-softGold focus:outline-none focus:ring-1 focus:ring-softGold/70",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ")
      : [
          "flex-1 rounded-lg border border-lightGrey bg-white px-3 py-2 text-sm text-deepCharcoal",
          "placeholder:text-[color:var(--color-on-secondary)/0.5]",
          "focus:border-deepCharcoal focus:outline-none focus:ring-1 focus:ring-deepCharcoal/60",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ].join(" ");

  return (
    <form onSubmit={handleSubmit} className={wrapperClasses} noValidate>
      {/* Enhanced Honeypot - multiple fields for better bot detection */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="newsletter-honeypot" className="sr-only">
          Do not fill this field
        </label>
        <input
          id="newsletter-honeypot"
          type="text"
          name="honeypot"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
        />

        {/* Additional hidden fields for advanced bot protection */}
        <input
          type="text"
          name="confirm_email"
          autoComplete="off"
          tabIndex={-1}
          className="hidden"
        />
      </div>

      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        name="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder={placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClasses}
        aria-describedby="newsletter-status"
        aria-invalid={isError || undefined}
        disabled={isLoading || isRateLimited}
        maxLength={254}
      />

      <button
        type="submit"
        disabled={isLoading || isRateLimited}
        className={buttonClasses}
      >
        {isLoading
          ? "Subscribing..."
          : isRateLimited
            ? "Try Again Later"
            : buttonText}
      </button>

      <p
        id="newsletter-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
        ref={statusRef}
        className={`sm:ml-2 text-sm transition-colors duration-200 ${
          isSuccess
            ? "text-green-600"
            : isError
              ? "text-red-600"
              : "text-transparent"
        }`}
      >
        {message || " "}
      </p>
    </form>
  );
}
