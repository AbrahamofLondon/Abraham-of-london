// components/ContactForm.tsx
import * as React from "react";
import { getRecaptchaToken } from "@/lib/recaptchaClient";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string; // honeypot field
  teaserOptIn: boolean;
  newsletterOptIn: boolean;
}

interface ApiResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

export default function ContactForm(): JSX.Element {
  const [form, setForm] = React.useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "", // honeypot - hidden from users
    teaserOptIn: false,
    newsletterOptIn: false,
  });

  const [status, setStatus] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitAttempts, setSubmitAttempts] = React.useState(0);
  const [lastSubmitTime, setLastSubmitTime] = React.useState<number>(0);

  // Rate limiting: max 3 submissions per minute
  const isRateLimited = React.useMemo(() => {
    const now = Date.now();
    return submitAttempts >= 3 && (now - lastSubmitTime) < 60000;
  }, [submitAttempts, lastSubmitTime]);

  // Separate handlers for different input types
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Separate handler for checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Enhanced form validation
  function validateForm(): string | null {
    // Honeypot validation - if filled, likely a bot
    if (form.website.trim() !== "") {
      console.warn("Contact form honeypot triggered - possible bot detected");
      return "Thank you for your message!";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return "Please enter a valid email address";
    }

    // Required fields
    if (!form.name.trim() || form.name.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }

    if (!form.message.trim() || form.message.trim().length < 10) {
      return "Message must be at least 10 characters long";
    }

    // Field length limits for security
    if (form.name.length > 100) return "Name is too long";
    if (form.email.length > 255) return "Email is too long";
    if (form.subject.length > 200) return "Subject is too long";
    if (form.message.length > 5000) return "Message is too long";

    // Rate limiting
    if (isRateLimited) {
      return "Too many submission attempts. Please try again in a minute.";
    }

    return null;
  }

  // Sanitize form data before submission
  function sanitizeFormData(data: ContactFormData): ContactFormData {
    return {
      ...data,
      name: data.name.trim().slice(0, 100),
      email: data.email.trim().slice(0, 255),
      subject: data.subject.trim().slice(0, 200),
      message: data.message.trim().slice(0, 5000),
      website: "", // Always clear honeypot on submission
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Prevent multiple simultaneous submissions
    if (submitting) return;

    // Rate limiting check
    if (isRateLimited) {
      setStatus("Too many submission attempts. Please try again in a minute.");
      return;
    }

    setStatus(null);
    setSubmitting(true);

    try {
      // Form validation
      const validationError = validateForm();
      if (validationError) {
        if (form.website.trim() !== "") {
          // Pretend success for bots
          setStatus("Thank you for your message! We'll get back to you soon.");
          setForm({
            name: "",
            email: "",
            subject: "",
            message: "",
            website: "",
            teaserOptIn: false,
            newsletterOptIn: false,
          });
          setSubmitting(false);
          return;
        }
        setStatus(validationError);
        setSubmitting(false);
        return;
      }

      // 1) Get reCAPTCHA v3 token for contact action
      const recaptchaToken = await getRecaptchaToken("contact_form");

      if (!recaptchaToken) {
        setStatus("Security verification failed. Please refresh the page and try again.");
        setSubmitting(false);
        return;
      }

      // Sanitize data before sending
      const sanitizedData = sanitizeFormData(form);

      // 2) POST to API with token and honeypot included
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...sanitizedData,
          recaptchaToken,
          website: sanitizedData.website, // Honeypot field
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Contact API responded with status ${res.status}:`, errorText);
        
        if (res.status === 429) {
          setStatus("Too many requests. Please try again later.");
        } else if (res.status >= 500) {
          setStatus("Server error. Please try again later.");
        } else {
          setStatus("Submission failed. Please check your connection and try again.");
        }
        
        setSubmitting(false);
        return;
      }

      const data: ApiResponse = await res.json();

      if (!data?.ok) {
        setStatus(data?.message || "Submission failed. Please try again.");
      } else {
        setStatus(data.message || "Message sent successfully!");
        
        // Reset form on success
        setForm({
          name: "",
          email: "",
          subject: "",
          message: "",
          website: "",
          teaserOptIn: false,
          newsletterOptIn: false,
        });

        // Update rate limiting counters
        setSubmitAttempts(prev => prev + 1);
        setLastSubmitTime(Date.now());
      }
    } catch (err: unknown) {
      // Enhanced error handling without 'any' type
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setStatus("Request timeout. Please check your connection and try again.");
        } else {
          console.error("[ContactForm] submit error:", err);
          setStatus("Network error. Please check your connection and try again.");
        }
      } else {
        console.error("[ContactForm] unknown error:", err);
        setStatus("An unexpected error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Enhanced Honeypot – renamed to 'website' for consistency */}
      <div 
        className="sr-only" 
        aria-hidden="true"
        style={{ 
          display: 'none',
          position: 'absolute',
          left: '-10000px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        <label htmlFor="website-field">
          Leave this field blank
        </label>
        <input
          id="website-field"
          type="text"
          name="website"
          value={form.website}
          onChange={handleInputChange}
          autoComplete="off"
          tabIndex={-1}
        />
      </div>

      {/* Form fields */}
      <div>
        <input
          name="name"
          value={form.name}
          onChange={handleInputChange}
          className="w-full rounded-xl border border-gray-700 bg-black/40 p-3 text-gray-200 focus:border-softGold focus:ring-1 focus:ring-softGold transition-colors"
          placeholder="Your name *"
          required
          minLength={2}
          maxLength={100}
          disabled={submitting || isRateLimited}
        />
      </div>

      <div>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleInputChange}
          className="w-full rounded-xl border border-gray-700 bg-black/40 p-3 text-gray-200 focus:border-softGold focus:ring-1 focus:ring-softGold transition-colors"
          placeholder="Your email *"
          required
          maxLength={255}
          disabled={submitting || isRateLimited}
        />
      </div>

      <div>
        <input
          name="subject"
          value={form.subject}
          onChange={handleInputChange}
          className="w-full rounded-xl border border-gray-700 bg-black/40 p-3 text-gray-200 focus:border-softGold focus:ring-1 focus:ring-softGold transition-colors"
          placeholder="Subject"
          maxLength={200}
          disabled={submitting || isRateLimited}
        />
      </div>

      <div>
        <textarea
          name="message"
          value={form.message}
          onChange={handleInputChange}
          className="w-full rounded-xl border border-gray-700 bg-black/40 p-3 text-gray-200 focus:border-softGold focus:ring-1 focus:ring-softGold transition-colors resize-vertical"
          placeholder="Your message *"
          rows={5}
          required
          minLength={10}
          maxLength={5000}
          disabled={submitting || isRateLimited}
        />
        <div className="text-xs text-gray-500 text-right mt-1">
          {form.message.length}/5000
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-gray-200 transition-colors">
          <input
            type="checkbox"
            name="teaserOptIn"
            checked={form.teaserOptIn}
            onChange={handleCheckboxChange}
            disabled={submitting || isRateLimited}
            className="rounded border-gray-600 bg-black/40 text-softGold focus:ring-softGold focus:ring-2 focus:ring-offset-2 focus:ring-offset-black"
          />
          Send me the Fathering Without Fear teaser
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-gray-200 transition-colors">
          <input
            type="checkbox"
            name="newsletterOptIn"
            checked={form.newsletterOptIn}
            onChange={handleCheckboxChange}
            disabled={submitting || isRateLimited}
            className="rounded border-gray-600 bg-black/40 text-softGold focus:ring-softGold focus:ring-2 focus:ring-offset-2 focus:ring-offset-black"
          />
          Add me to the mailing list
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting || isRateLimited}
        className="w-full rounded-xl bg-softGold py-3 text-black font-bold hover:bg-softGold/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-black"
      >
        {submitting ? "Sending…" : isRateLimited ? "Try Again Later" : "Send Message"}
      </button>

      {status && (
        <div 
          className={`p-3 rounded-lg text-sm mt-2 ${
            status.includes("successfully") || status.includes("Thank you")
              ? "bg-green-900/30 text-green-300 border border-green-800"
              : "bg-red-900/30 text-red-300 border border-red-800"
          }`}
          aria-live="polite"
          role="alert"
        >
          {status}
        </div>
      )}

      {/* Security notice */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-800">
        Protected by reCAPTCHA and security measures
      </div>
    </form>
  );
}