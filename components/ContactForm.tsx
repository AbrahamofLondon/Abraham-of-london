// components/ContactForm.tsx
"use client";

import * as React from "react";
import { getRecaptchaToken } from "@/lib/recaptchaClient";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  botField: string; // honeypot field (matches API)
  teaserOptIn: boolean;
  newsletterOptIn: boolean;
}

interface ApiResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

type SubmitStatus = "success" | "error" | "info" | null;

export default function ContactForm(): JSX.Element {
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  function validateForm(): string | null {
    // Honeypot: if filled, it’s almost certainly a bot
    if (form.botField.trim() !== "") {
      console.warn("Contact form honeypot triggered - possible bot detected");
      // We *return a fake success message* here, but we don't block submit()
      // because handleSubmit short-circuits on botField separately.
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

  function sanitizeFormData(data: ContactFormData): ContactFormData {
    return {
      ...data,
      name: data.name.trim().slice(0, 100),
      email: data.email.trim().slice(0, 255),
      subject: data.subject.trim().slice(0, 200),
      message: data.message.trim().slice(0, 5000),
      // Always clear honeypot before sending
      botField: "",
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (submitting) return;

    if (isRateLimited) {
      setStatus("error");
      setStatusMessage(
        "Too many submission attempts. Please try again in a minute.",
      );
      return;
    }

    setStatus(null);
    setStatusMessage("");
    setSubmitting(true);

    try {
      const validationError = validateForm();

      // If honeypot is filled, pretend success and bail early
      if (form.botField.trim() !== "") {
        setStatus("success");
        setStatusMessage("Thank you for your message! We'll get back to you soon.");
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

      // reCAPTCHA v3 token
      const recaptchaToken = await getRecaptchaToken("contact_form");
      if (!recaptchaToken) {
        setStatus("error");
        setStatusMessage(
          "Security verification failed. Please refresh the page and try again.",
        );
        setSubmitting(false);
        return;
      }

      const sanitizedData = sanitizeFormData(form);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15_000);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...sanitizedData,
          // Server honeypot field (matches Contact API: botField)
          botField: sanitizedData.botField,
          recaptchaToken,
          timestamp: new Date().toISOString(),
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `Contact API responded with status ${res.status}:`,
          errorText,
        );

        if (res.status === 429) {
          setStatus("error");
          setStatusMessage("Too many requests. Please try again later.");
        } else if (res.status >= 500) {
          setStatus("error");
          setStatusMessage("Server error. Please try again later.");
        } else {
          setStatus("error");
          setStatusMessage(
            "Submission failed. Please check your connection and try again.",
          );
        }

        setSubmitting(false);
        return;
      }

      const data: ApiResponse = await res.json();

      if (!data?.ok) {
        setStatus("error");
        setStatusMessage(
          data?.message || "Submission failed. Please try again.",
        );
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
            "Request timeout. Please check your connection and try again.",
          );
        } else {
          console.error("[ContactForm] submit error:", err);
          setStatus("error");
          setStatusMessage(
            "Network error. Please check your connection and try again.",
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
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Honeypot – matches server 'botField' */}
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
      <div>
        <input
          name="name"
          value={form.name}
          onChange={handleInputChange}
          className="w-full rounded-xl border border-gray-700 bg-black/40 p-3 text-gray-200 transition-colors focus:border-softGold focus:ring-1 focus:ring-softGold"
          placeholder="Your name *"
          required
          minLength={2}
          maxLength={100}
          disabled={submitting || isRateLimited}
        />
      </div>

      {/* Email */}
      <div>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleInputChange}
          className="w-full rounded-xl border border-gray-700 bg-black/40 p-3 text-gray-200 transition-colors focus:border-softGold focus:ring-1 focus:ring-softGold"
          placeholder="Your email *"
          required
          maxLength={255}
          disabled={submitting || isRateLimited}
        />
      </div>

      {/* Subject */}
      <div>
        <input
          name="subject"
          value={form.subject}
          onChange={handleInputChange}
          className="w-full rounded-xl border border-gray-700 bg-black/40 p-3 text-gray-200 transition-colors focus:border-softGold focus:ring-1 focus:ring-softGold"
          placeholder="Subject"
          maxLength={200}
          disabled={submitting || isRateLimited}
        />
      </div>

      {/* Message */}
      <div>
        <textarea
          name="message"
          value={form.message}
          onChange={handleInputChange}
          className="w-full rounded-xl border border-gray-700 bg-black/40 p-3 text-gray-200 transition-colors resize-vertical focus:border-softGold focus:ring-1 focus:ring-softGold"
          placeholder="Your message *"
          rows={5}
          required
          minLength={10}
          maxLength={5000}
          disabled={submitting || isRateLimited}
        />
        <div className="mt-1 text-right text-xs text-gray-500">
          {form.message.length}/5000
        </div>
      </div>

      {/* Opt-ins */}
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300 transition-colors hover:text-gray-200">
          <input
            type="checkbox"
            name="teaserOptIn"
            checked={form.teaserOptIn}
            onChange={handleCheckboxChange}
            disabled={submitting || isRateLimited}
            className="rounded border-gray-600 bg-black/40 text-softGold focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-black"
          />
          Send me the Fathering Without Fear teaser
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300 transition-colors hover:text-gray-200">
          <input
            type="checkbox"
            name="newsletterOptIn"
            checked={form.newsletterOptIn}
            onChange={handleCheckboxChange}
            disabled={submitting || isRateLimited}
            className="rounded border-gray-600 bg-black/40 text-softGold focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-black"
          />
          Add me to the mailing list
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || isRateLimited}
        className="w-full rounded-xl bg-softGold py-3 font-bold text-black transition-all duration-200 hover:bg-softGold/90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-black"
      >
        {submitting
          ? "Sending…"
          : isRateLimited
          ? "Try Again Later"
          : "Send Message"}
      </button>

      {/* Status */}
      {status && statusMessage && (
        <div
          className={`mt-2 rounded-lg p-3 text-sm ${
            isSuccess
              ? "border border-green-800 bg-green-900/30 text-green-300"
              : "border border-red-800 bg-red-900/30 text-red-300"
          }`}
          aria-live="polite"
          role="alert"
        >
          {statusMessage}
        </div>
      )}

      {/* Security notice */}
      <div className="border-t border-gray-800 pt-2 text-center text-xs text-gray-500">
        Protected by reCAPTCHA and layered security controls.
      </div>
    </form>
  );
}