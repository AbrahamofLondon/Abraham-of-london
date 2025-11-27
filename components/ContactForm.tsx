// components/ContactForm.tsx
import * as React from "react";
import { getRecaptchaToken } from "@/lib/recaptchaClient";

export default function ContactForm(): JSX.Element {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    botField: "", // honeypot (keep hidden in UI)
    teaserOptIn: false,
    newsletterOptIn: false,
  });

  const [status, setStatus] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setStatus(null);
    setSubmitting(true);

    try {
      // 1) Get reCAPTCHA v3 token for this action
      const recaptchaToken = await getRecaptchaToken("contact_form");

      if (!recaptchaToken) {
        setStatus("Security check failed. Please try again.");
        setSubmitting(false);
        return;
      }

      // 2) POST to API with token included
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          recaptchaToken,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; message?: string };

      if (!res.ok || !data?.ok) {
        setStatus(data?.message || "Something went wrong. Please try again.");
      } else {
        setStatus(data.message || "Message sent.");
        // Optional: reset visible fields
        setForm((prev) => ({
          ...prev,
          name: "",
          email: "",
          subject: "",
          message: "",
        }));
      }
    } catch (err) {
      console.error("[ContactForm] submit error:", err);
      setStatus("Unexpected error. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot – hide with CSS */}
      <div className="hidden">
        <label>
          Do not fill this field
          <input
            type="text"
            name="botField"
            value={form.botField}
            onChange={handleChange}
            autoComplete="off"
          />
        </label>
      </div>

      {/* Your normal fields */}
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-700 bg-black/40 p-3 text-gray-200"
        placeholder="Your name"
      />
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-700 bg-black/40 p-3 text-gray-200"
        placeholder="Your email"
        required
      />
      <input
        name="subject"
        value={form.subject}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-700 bg-black/40 p-3 text-gray-200"
        placeholder="Subject"
      />
      <textarea
        name="message"
        value={form.message}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-700 bg-black/40 p-3 text-gray-200"
        placeholder="Your message"
        rows={5}
        required
      />

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          name="teaserOptIn"
          checked={form.teaserOptIn}
          onChange={handleChange}
        />
        Send me the Fathering Without Fear teaser
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          name="newsletterOptIn"
          checked={form.newsletterOptIn}
          onChange={handleChange}
        />
        Add me to the mailing list
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-softGold py-3 text-black font-bold hover:bg-softGold/90 disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send Message"}
      </button>

      {status && (
        <p className="text-sm text-gray-300 mt-2" aria-live="polite">
          {status}
        </p>
      )}
    </form>
  );
}