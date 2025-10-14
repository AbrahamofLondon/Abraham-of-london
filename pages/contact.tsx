// pages/contact.tsx
import React, { useState, useMemo } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link"; // ✅ use next/link for internal routes
import { motion, type Variants } from "framer-motion";
import Layout from "@/components/Layout";
import { siteConfig } from "@/lib/siteConfig";

/* ---------- Config & Helpers ---------- */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "https://www.abrahamoflondon.org"
).replace(/\/$/, "");

const abs = (path: string): string => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, SITE_URL).toString();
};

/* ---------- Animations ---------- */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: EASE_OUT, when: "beforeChildren" as const },
  },
};

const formVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: EASE_OUT, staggerChildren: 0.1 } },
};

const itemVariants: Variants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

export default function ContactPage() {
  const [formStatus, setFormStatus] =
    useState<"idle" | "submitting" | "success" | "error">("idle");
  const [formError, setFormError] = useState<string>("");

  const structuredData = useMemo(() => {
    const contactPageSchema = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/contact` },
      description:
        "Get in touch with Abraham of London for speaking engagements, media inquiries, or collaborations.",
      url: `${SITE_URL}/contact`,
      potentialAction: { "@type": "CommunicateAction", target: { "@type": "EntryPoint", inLanguage: "en" } },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Customer service",
        areaServed: "Global",
        email: siteConfig.email,
      },
    };
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Contact", item: `${SITE_URL}/contact` },
      ],
    };
    return [contactPageSchema, breadcrumb];
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setFormStatus("submitting");

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);

      // Honeypot
      if (String(formData.get("bot-field") || "").trim()) {
        setFormStatus("success");
        form.reset();
        return;
      }

      const payload = {
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        subject: "Website contact",
        message: String(formData.get("message") || ""),
        teaserOptIn: formData.get("teaserOptIn") === "on",
        newsletterOptIn: formData.get("newsletterOptIn") === "on",
        source: "contact-page",
        "bot-field": "",
      };

      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!r.ok || !json?.ok) throw new Error(json?.error || `HTTP ${r.status}`);

      setFormStatus("success");
      form.reset();
      setTimeout(() => setFormStatus("idle"), 5000);
    } catch (err: unknown) {
      const msg = (err as any)?.message || "Failed to send message. Please try again.";
      console.error("Form submission failed:", msg);
      setFormError(msg);
      setFormStatus("error");
    }
  };

  const isSubmitting = formStatus === "submitting";

  return (
    <Layout pageTitle="Contact" hideCTA>
      <Head>
        <title>Contact | {siteConfig.author}</title>
        <meta
          name="description"
          content="Get in touch with Abraham of London for speaking engagements, book signings, media inquiries, and collaborations."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/contact`} />
        <meta property="og:title" content="Contact | Abraham of London" />
        <meta property="og:description" content="Reach out for collaborations, speaking engagements, and media opportunities." />
        <meta property="og:url" content={`${SITE_URL}/contact`} />
        <meta property="og:image" content={abs(siteConfig.ogImage || "/assets/images/social/og-image.jpg")} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={abs(siteConfig.twitterImage || "/assets/images/social/twitter-image.webp")} />
        {structuredData.map((schema, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        ))}
      </Head>

      <motion.div className="relative min-h-screen overflow-hidden bg-gray-50 py-20"
        initial="hidden" animate="visible" variants={containerVariants}>
        {/* Background pattern */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-10">
          <div className="pattern-bg" />
        </div>
        {/* Decorative element */}
        <div className="pointer-events-none absolute right-10 top-10 z-0">
          <div className="relative h-40 w-40 opacity-40 md:h-64 md:w-64">
            <Image src="/assets/images/contact-element.svg" alt="" fill className="object-contain" />
          </div>
        </div>

        <section className="z-10 mx-auto w-full max-w-3xl px-4">
          <h1 className="mb-6 text-center font-serif text-4xl text-forest md:text-5xl">Get in Touch</h1>
          <p className="mb-8 text-center text-lg text-deepCharcoal/80">
            Reach out for speaking engagements, book signings, media inquiries, or collaborations.
          </p>

          <motion.form
            onSubmit={handleSubmit}
            variants={formVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 rounded-2xl bg-white p-6 shadow-xl md:p-8"
            aria-describedby="form-status"
            noValidate
          >
            {/* Honeypot */}
            <p className="hidden">
              <label>Don’t fill this out if you’re human: <input name="bot-field" /></label>
            </p>

            <motion.div variants={itemVariants}>
              <label htmlFor="name" className="block text-sm font-medium text-deepCharcoal">Name</label>
              <input id="name" name="name" type="text" required autoComplete="name" disabled={isSubmitting} className="aol-input" />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-sm font-medium text-deepCharcoal">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" disabled={isSubmitting} className="aol-input" />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="message" className="block text-sm font-medium text-deepCharcoal">Message</label>
              <textarea id="message" name="message" required rows={5} disabled={isSubmitting} className="aol-textarea" />
            </motion.div>

            {/* New: teaser + newsletter opt-ins */}
            <motion.fieldset variants={itemVariants} className="space-y-3 rounded-lg border border-lightGrey/70 p-4">
              <legend className="px-1 text-sm font-semibold text-deepCharcoal">Extras</legend>

              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" name="teaserOptIn" className="mt-1" />
                <span>
                  Email me the <strong>Fathering Without Fear — Teaser</strong> (A4/Letter + Mobile PDFs)
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" name="newsletterOptIn" className="mt-1" />
                <span>
                  Add me to updates (chapter drops &amp; launch). <em>No spam; unsubscribe anytime.</em>
                </span>
              </label>
            </motion.fieldset>

            <motion.div variants={itemVariants} className="text-center">
              <button type="submit" className="aol-btn" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Send Message"}
              </button>
            </motion.div>

            <motion.p
              id="form-status"
              aria-live="polite"
              variants={itemVariants}
              className={`text-center font-medium ${
                formStatus === "success"
                  ? "text-green-700"
                  : formStatus === "error"
                  ? "text-red-700"
                  : "text-transparent"
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: formStatus === "idle" ? 0 : 1 }}
              role={formStatus === "error" ? "alert" : "status"}
            >
              {formStatus === "success"
                ? "Thanks—check your inbox!"
                : formStatus === "error"
                ? formError || "Failed to send message. Please try again."
                : " "}
            </motion.p>

            <p className="text-center text-xs text-deepCharcoal/60">
              By submitting, you agree to our{" "}
              <Link className="underline" href="/privacy">Privacy Policy</Link>.
            </p>
          </motion.form>
        </section>
      </motion.div>
    </Layout>
  );
}
