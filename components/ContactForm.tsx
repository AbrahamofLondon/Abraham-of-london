import { safeString } from "@/lib/utils/safe";
"use client";
import * as React from "react";
import { getRecaptchaToken } from "@/lib/recaptchaClient";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  botField: string;
  teaserOptIn: boolean;
  newsletterOptIn: boolean;
}

interface ApiResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

type SubmitStatus = "success" | "error" | "info" | null;

export default function ContactForm() {
  const [form, setForm] = React.useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
    botField: "",
    teaserOptIn: false,
    newsletterOptIn: false,
  });

  const [status, setStatus] = React.useState<SubmitStatus>(null);
  const [statusMessage, setStatusMessage] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitAttempts, setSubmitAttempts] = React.useState(0);
  const [lastSubmitTime, setLastSubmitTime] = React.useState<number>(0);

  // Client-side throttle: max 3 submissions per minute
  const isRateLimited = React.useMemo(() => {
    const now = Date.now();
    return submitAttempts >= 3 && now - lastSubmitTime < 60_000;
  }, [submitAttempts, lastSubmitTime]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  function validateForm(): string | null {
    if (form.botField.trim() !== "") {
      console.warn("Contact form honeypot triggered - possible bot detected");
      return "Thank you for your message!";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return "Please enter a valid email address";
    }

    if (!form.name.trim() || form.name.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }

    if (!form.message.trim() || form.message.trim().length < 10) {
      return "Message must be at least 10 characters long";
    }

    if (form.name.length > 100) return "Name is too long";
    if (form.email.length > 255) return "Email is too long";
    if (form.subject.length > 200) return "Subject is too long";
    if (form.message.length > 5000) return "Message is too long";

    if (isRateLimited) {
      return "Too many submission attempts. Please try again in a minute.";
    }

    return null;
  }

  // ✅ CORRECTED: safe string trimming + slicing
  function sanitizeFormData(data: ContactFormData): ContactFormData {
    return {
      ...data,
      name: safeString(data.name).slice(0, 100),
      email: safeString(data.email).slice(0, 255),
      subject: safeString(data.subject).slice(0, 200),
      message: safeString(data.message).slice(0, 5000),
      botField: "",
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (isRateLimited) {
      setStatus("error");
      setStatusMessage(
        "Too many submission attempts. Please try again in a minute."
      );
      return;
    }

    setStatus(null);
    setStatusMessage("");
    setSubmitting(true);

    try {
      const validationError = validateForm();

      // Honeypot short-circuit
      if (form.botField.trim() !== "") {
        setStatus("success");
        setStatusMessage(
          "Thank you for your message! We'll get back to you soon."
        );
        setForm({
          name: "",
          email: "",
          subject: "",
          message: "",
          botField: "",
          teaserOptIn: false,
          newsletterOptIn: false,
        });
        setSubmitting(false);
        return;
      }

      if (validationError) {
        setStatus("error");
        setStatusMessage(validationError);
        setSubmitting(false);
        return;
      }

      const recaptchaToken = await getRecaptchaToken("contact_form");
      if (!recaptchaToken) {
        setStatus("error");
        setStatusMessage(
          "Security verification failed. Please refresh the page and try again."
        );
        setSubmitting(false);
        return;
      }

      const sanitizedData = sanitizeFormData(form);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15_000);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sanitizedData,
          recaptchaToken,
          timestamp: new Date().toISOString(),
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Contact API responded with status ${res.status}:`, errorText);
        if (res.status === 429) {
          setStatus("error");
          setStatusMessage("Too many requests. Please try again later.");
        } else if (res.status >= 500) {
          setStatus("error");
          setStatusMessage("Server error. Please try again later.");
        } else {
          setStatus("error");
          setStatusMessage(
            "Submission failed. Please check your connection and try again."
          );
        }
        setSubmitting(false);
        return;
      }

      const data: ApiResponse = await res.json();
      if (!data?.ok) {
        setStatus("error");
        setStatusMessage(data?.message || "Submission failed. Please try again.");
      } else {
        setStatus("success");
        setStatusMessage(data.message || "Message sent successfully!");
        setForm({
          name: "",
          email: "",
          subject: "",
          message: "",
          botField: "",
          teaserOptIn: false,
          newsletterOptIn: false,
        });
        setSubmitAttempts((prev) => prev + 1);
        setLastSubmitTime(Date.now());
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setStatus("error");
          setStatusMessage(
            "Request timeout. Please check your connection and try again."
          );
        } else {
          console.error("[ContactForm] submit error:", err);
          setStatus("error");
          setStatusMessage(
            "Network error. Please check your connection and try again."
          );
        }
      } else {
        console.error("[ContactForm] unknown error:", err);
        setStatus("error");
        setStatusMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const isSuccess = status === "success";

  return (
    <form
      onSubmit={handleSubmit}
      className="relative space-y-6 rounded-3xl border border-white/10 bg-gradient-to-br from-black/60 via-zinc-950 to-black/80 p-8 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-amber-900/20"
      noValidate
    >
      {/* Honeypot */}
      <div
        className="sr-only"
        aria-hidden="true"
        style={{
          display: "none",
          position: "absolute",
          left: "-10000px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label htmlFor="bot-field">Leave this field blank</label>
        <input
          id="bot-field"
          type="text"
          name="botField"
          value={form.botField}
          onChange={handleInputChange}
          autoComplete="off"
          tabIndex={-1}
        />
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-amber-400/80">
          Name <span className="text-amber-400">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleInputChange}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-zinc-500 transition-all duration-200 hover:border-amber-500/40 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
          placeholder="Your name"
          required
          minLength={2}
          maxLength={100}
          disabled={submitting || isRateLimited}
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-amber-400/80">
          Email <span className="text-amber-400">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleInputChange}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-zinc-500 transition-all duration-200 hover:border-amber-500/40 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
          placeholder="you@example.com"
          required
          maxLength={255}
          disabled={submitting || isRateLimited}
        />
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <label htmlFor="subject" className="block text-xs font-bold uppercase tracking-wider text-amber-400/80">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          value={form.subject}
          onChange={handleInputChange}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-zinc-500 transition-all duration-200 hover:border-amber-500/40 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
          placeholder="What's this about?"
          maxLength={200}
          disabled={submitting || isRateLimited}
        />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-amber-400/80">
          Message <span className="text-amber-400">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={form.message}
          onChange={handleInputChange}
          rows={5}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-zinc-500 transition-all duration-200 hover:border-amber-500/40 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
          placeholder="Your message..."
          required
          minLength={10}
          maxLength={5000}
          disabled={submitting || isRateLimited}
        />
        <div className="flex justify-end text-xs text-zinc-500">
          <span className={form.message.length >= 5000 ? "text-amber-400" : ""}>
            {form.message.length}/5000
          </span>
        </div>
      </div>

      {/* Opt‑ins – refined checkboxes */}
      <div className="space-y-4 pt-2">
        <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300 transition-colors hover:text-white">
          <input
            type="checkbox"
            name="teaserOptIn"
            checked={form.teaserOptIn}
            onChange={handleCheckboxChange}
            disabled={submitting || isRateLimited}
            className="h-5 w-5 rounded-md border border-white/20 bg-white/5 text-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-60"
          />
          <span>Send me the <span className="font-semibold text-amber-400">Fathering Without Fear</span> teaser</span>
        </label>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300 transition-colors hover:text-white">
          <input
            type="checkbox"
            name="newsletterOptIn"
            checked={form.newsletterOptIn}
            onChange={handleCheckboxChange}
            disabled={submitting || isRateLimited}
            className="h-5 w-5 rounded-md border border-white/20 bg-white/5 text-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-60"
          />
          <span>Add me to the <span className="font-semibold text-amber-400">institutional mailing list</span></span>
        </label>
      </div>

      {/* Submit button – premium gradient */}
      <button
        type="submit"
        disabled={submitting || isRateLimited}
        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-4 font-bold text-black transition-all duration-300 hover:from-amber-400 hover:to-amber-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-amber-500 disabled:hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-black"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {submitting ? (
            <>
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0A12 12 0 000 12h4z"
                />
              </svg>
              <span>Sending…</span>
            </>
          ) : isRateLimited ? (
            "Try Again Later"
          ) : (
            <>
              <span>Send Message</span>
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </>
          )}
        </span>
      </button>

      {/* Status message – refined alert */}
      {status && statusMessage && (
        <div
          className={`mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm ${
            isSuccess
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
          role="alert"
          aria-live="polite"
        >
          <div className={`mt-0.5 h-2 w-2 rounded-full ${isSuccess ? "bg-emerald-500" : "bg-red-500"}`} />
          <p>{statusMessage}</p>
        </div>
      )}

      {/* Security footer – subtle institutional note */}
      <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[0.65rem] uppercase tracking-wider text-zinc-600">
        <span>Protected by reCAPTCHA</span>
        <span className="font-mono text-[0.55rem] text-zinc-700">// ENCRYPTED TRANSMISSION</span>
      </div>
    </form>
  );
}