// components/ContactForm.tsx
"use client";

import { useState, useMemo } from "react";
import Head from "next/head";
import { motion, useReducedMotion } from "framer-motion";
import { siteConfig, absUrl } from "@/lib/siteConfig";

const SITE_URL = siteConfig.siteUrl;
const FORM_NAME = "contact-form";

const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: "easeOut", when: "beforeChildren" } },
};
const formVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 } },
};
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

export default function ContactForm() {
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const prefersReducedMotion = useReducedMotion();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formStatus === "submitting") return;
    setFormStatus("submitting");

    try {
      const formEl = event.currentTarget;
      const formData = new FormData(formEl);

      // Ensure Netlify receives the form name
      if (!formData.get("form-name")) formData.append("form-name", FORM_NAME);

      // Build x-www-form-urlencoded body
      const body = new URLSearchParams();
      for (const [k, v] of formData.entries()) body.append(k, String(v));

      // Post to "/" for reliable Netlify capture regardless of route
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (response.ok) {
        setFormStatus("success");
        formEl.reset();
        // Auto-clear after a bit
        setTimeout(() => setFormStatus("idle"), 5000);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      console.error("Form submission failed:", err);
      setFormStatus("error");
    }
  };

  const isSubmitting = formStatus === "submitting";

  const structuredData = useMemo(() => {
    const contactSchema = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/contact` },
      description: "Contact form for Abraham of London inquiries.",
      url: `${SITE_URL}/contact`,
      potentialAction: {
        "@type": "CommunicateAction",
        target: { "@type": "EntryPoint", actionPlatform: ["https://schema.org/ContactPoint"], inLanguage: "en" },
      },
      contactPoint: { "@type": "ContactPoint", contactType: "Customer service", areaServed: "Global", email: siteConfig.email },
    };
    return [contactSchema];
  }, []);

  return (
    <>
      <Head>
        <title>Contact | {siteConfig.author}</title>
        <meta name="description" content="Get in touch with Abraham of London for inquiries and collaborations." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/contact`} />
        <meta property="og:title" content="Contact | Abraham of London" />
        <meta property="og:description" content="Reach out for collaborations, speaking engagements, and inquiries." />
        <meta property="og:url" content={`${SITE_URL}/contact`} />
        <meta property="og:image" content={absUrl(siteConfig.ogImage)} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={absUrl(siteConfig.twitterImage)} />
        {structuredData.map((schema, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        ))}
      </Head>

      <motion.section
        className="container mx-auto max-w-3xl px-4 py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={prefersReducedMotion ? { duration: 0 } : undefined}
      >
        <h2 className="text-4xl font-serif text-[var(--color-primary)] mb-6 text-center">Contact Us</h2>
        <p className="text-lg text-[var(--color-on-primary)]/80 mb-8 text-center">
          Reach out for inquiries, collaborations, or support.
        </p>

        <motion.form
          action="/"                 // Netlify capture endpoint
          method="POST"
          name={FORM_NAME}
          acceptCharset="UTF-8"
          data-netlify="true"
          data-netlify-honeypot="bot-field"  // correct attribute
          // data-netlify-recaptcha="true"    // ← optional: enable if you add the widget below
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          {/* Netlify needs these fields in the HTML at build time */}
          <input type="hidden" name="form-name" value={FORM_NAME} />
          <input type="hidden" name="subject" value="New contact form submission" />
          <input type="hidden" name="bot-field" /> {/* honeypot */}

          <motion.div variants={itemVariants}>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-on-primary)]">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              className="mt-1 w-full px-4 py-2 border border-[var(--color-lightGrey)] rounded-[6px] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              disabled={isSubmitting}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-on-primary)]">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              required
              maxLength={254}
              className="mt-1 w-full px-4 py-2 border border-[var(--color-lightGrey)] rounded-[6px] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              disabled={isSubmitting}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label htmlFor="message" className="block text-sm font-medium text-[var(--color-on-primary)]">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              minLength={10}
              maxLength={4000}
              className="mt-1 w-full px-4 py-2 border border-[var(--color-lightGrey)] rounded-[6px] focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              disabled={isSubmitting}
            />
          </motion.div>

          {/* Uncomment to enable Netlify reCAPTCHA v2 */}
          {/* <div data-netlify-recaptcha="true" /> */}

          <motion.div variants={itemVariants} className="text-center">
            <button
              type="submit"
              className="inline-block px-6 py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-[6px] hover:bg-[var(--color-primary)]/80 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Send Message"}
            </button>
          </motion.div>

          {/* ARIA live region for status updates */}
          <motion.p
            variants={itemVariants}
            role="status"
            aria-live="polite"
            className="text-center mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: formStatus === "idle" ? 0 : 1 }}
          >
            {formStatus === "success" && <span className="text-green-600">Message sent successfully!</span>}
            {formStatus === "error" && <span className="text-red-600">Failed to send message. Please try again.</span>}
          </motion.p>

          {/* No-JS fallback hint */}
          <noscript>
            <p className="text-center text-sm text-[var(--color-on-primary)]/70">
              JavaScript is disabled. Submitting will use the standard form submission.
            </p>
          </noscript>
        </motion.form>
      </motion.section>
    </>
  );
}
