// components/ContactForm.tsx
"use client";

import { useState, useMemo } from "react";
import Head from "next/head";
import {
  motion,
  useReducedMotion,
  type Variants,
  type Transition,
} from "framer-motion";
import { siteConfig, absUrl } from "@/lib/siteConfig";

const SITE_URL = siteConfig.siteUrl;
const FORM_NAME = "contact-form";

/** Use a cubic-bezier so TS is happy about Transition["ease"] */
const EASE: Transition["ease"] = [0.16, 1, 0.3, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: EASE,
      when: "beforeChildren",
    },
  },
};

const formVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: EASE,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: EASE },
  },
};

export default function ContactForm() {
  const [formStatus, setFormStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const prefersReducedMotion = useReducedMotion();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formStatus === "submitting") return;
    setFormStatus("submitting");

    try {
      const formEl = event.currentTarget;
      const formData = new FormData(formEl);

      // Ensure Netlify sees the form name
      if (!formData.get("form-name")) formData.append("form-name", FORM_NAME);

      // Build x-www-form-urlencoded body (no iterator assumptions)
      const body = new URLSearchParams();
      formData.forEach((value, key) => body.append(key, String(value)));

      // Post to "/" so Netlify captures on any route
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (response.ok) {
        setFormStatus("success");
        formEl.reset();
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
        target: {
          "@type": "EntryPoint",
          actionPlatform: ["https://schema.org/ContactPoint"],
          inLanguage: "en",
        },
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Customer service",
        areaServed: "Global",
        email: siteConfig.email,
      },
    };
    return [contactSchema];
  }, []);

  return (
    <>
      <Head>
        <title>Contact | {siteConfig.author}</title>
        <meta
          name="description"
          content="Get in touch with Abraham of London for inquiries and collaborations."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/contact`} />
        <meta property="og:title" content="Contact | Abraham of London" />
        <meta
          property="og:description"
          content="Reach out for collaborations, speaking engagements, and inquiries."
        />
        <meta property="og:url" content={`${SITE_URL}/contact`} />
        <meta property="og:image" content={absUrl(siteConfig.ogImage)} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={absUrl(siteConfig.twitterImage)} />
        {structuredData.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </Head>

      <motion.section
        className="container mx-auto max-w-3xl px-4 py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={prefersReducedMotion ? { duration: 0 } : undefined}
      >
        <h2 className="mb-6 text-center font-serif text-4xl text-[var(--color-primary)]">
          Contact Us
        </h2>
        <p className="mb-8 text-center text-lg text-[var(--color-on-primary)]/80">
          Reach out for inquiries, collaborations, or support.
        </p>

        <motion.form
          action="/" // Netlify capture endpoint
          method="POST"
          name={FORM_NAME}
          acceptCharset="UTF-8"
          // Netlify attributes (cast to any to satisfy TS)
          {...({
            "data-netlify": "true",
            "netlify-honeypot": "bot-field",
          } as any)}
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Netlify needs these fields present at build time */}
          <input type="hidden" name="form-name" value={FORM_NAME} />
          <input type="hidden" name="subject" value="New contact form submission" />

          {/* Honeypot field — visually hidden but present in DOM */}
          <label htmlFor="bot-field" className="sr-only">
            Leave this field empty
          </label>
          <input
            id="bot-field"
            name="bot-field"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
          />

          <motion.div variants={itemVariants}>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-[var(--color-on-primary)]"
            >
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
              className="mt-1 w-full rounded-[6px] border border-[var(--color-lightGrey)] px-4 py-2 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              disabled={isSubmitting}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--color-on-primary)]"
            >
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
              className="mt-1 w-full rounded-[6px] border border-[var(--color-lightGrey)] px-4 py-2 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              disabled={isSubmitting}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-[var(--color-on-primary)]"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              minLength={10}
              maxLength={4000}
              className="mt-1 w-full rounded-[6px] border border-[var(--color-lightGrey)] px-4 py-2 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              disabled={isSubmitting}
            />
          </motion.div>

          {/* Optional reCAPTCHA v2:
          <div data-netlify-recaptcha="true" /> */}

          <motion.div variants={itemVariants} className="text-center">
            <button
              type="submit"
              className="inline-block rounded-[6px] bg-[var(--color-primary)] px-6 py-3 text-[var(--color-on-primary)] hover:bg-[var(--color-primary)]/80 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Send Message"}
            </button>
          </motion.div>

          <motion.p
            variants={itemVariants}
            role="status"
            aria-live="polite"
            className="mt-2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: formStatus === "idle" ? 0 : 1 }}
          >
            {formStatus === "success" && (
              <span className="text-green-600">Message sent successfully!</span>
            )}
            {formStatus === "error" && (
              <span className="text-red-600">
                Failed to send message. Please try again.
              </span>
            )}
          </motion.p>

          <noscript>
            <p className="text-center text-sm text-[var(--color-on-primary)]/70">
              JavaScript is disabled. Submitting will use the standard form
              submission.
            </p>
          </noscript>
        </motion.form>
      </motion.section>
    </>
  );
}
