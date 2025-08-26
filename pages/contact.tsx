import React, { useState, useMemo } from "react";
import Head from "next/head";
import Image from "next/image";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { siteConfig } from "@/lib/siteConfig";

// ---------- Config & Helpers ----------
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "https://abraham-of-london.netlify.app"
).replace(/\/$/, "");

const abs = (path: string): string => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, SITE_URL).toString();
};

// Animations
const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: "easeOut", when: "beforeChildren" } },
};
const formVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 } },
};
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

export default function ContactPage() {
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [formError, setFormError] = useState<string>("");

  const structuredData = useMemo(() => {
    const contactPageSchema = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/contact` },
      description: "Get in touch with Abraham of London for speaking engagements, media inquiries, or collaborations.",
      url: `${SITE_URL}/contact`,
      potentialAction: { "@type": "CommunicateAction", target: { "@type": "EntryPoint", inLanguage: "en" } },
      contactPoint: { "@type": "ContactPoint", contactType: "Customer service", areaServed: "Global", email: siteConfig.email },
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
    } catch (err: any) {
      console.error("Form submission failed:", err?.message || err);
      setFormError(err?.message || "Failed to send message. Please try again.");
      setFormStatus("error");
    }
  };

  const isSubmitting = formStatus === "submitting";

  return (
    <Layout>
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

      <motion.main
        className="relative min-h-screen py-20 bg-gray-50 flex items-center justify-center overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="pattern-bg" />
        </div>

        {/* Decorative element (served from /public) */}
        <div className="absolute top-10 right-10 w-40 h-40 md:w-64 md:h-64 opacity-40 z-0">
          <Image src="/assets/images/contact-element.svg" alt="" fill className="object-contain" loading="lazy" />
        </div>

        <section className="w-full max-w-3xl mx-auto px-4 z-10">
          <h1 className="text-4xl md:text-5xl font-serif text-forest mb-6 text-center">Get in Touch</h1>
          <p className="text-lg text-deepCharcoal/80 mb-8 text-center">
            Reach out for speaking engagements, book signings, media inquiries, or collaborations.
          </p>

          <motion.form
            onSubmit={handleSubmit}
            variants={formVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 bg-white p-6 md:p-8 rounded-2xl shadow-xl"
            aria-describedby="form-status"
            noValidate
          >
            {/* Honeypot */}
            <p className="hidden">
              <label>
                Don’t fill this out if you’re human: <input name="bot-field" />
              </label>
            </p>

            <motion.div variants={itemVariants}>
              <label htmlFor="name" className="block text-sm font-medium text-deepCharcoal">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="mt-1 w-full px-4 py-2 border border-lightGrey rounded-[10px] focus:ring-forest focus:border-forest"
                disabled={isSubmitting}
                autoComplete="name"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-sm font-medium text-deepCharcoal">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="mt-1 w-full px-4 py-2 border border-lightGrey rounded-[10px] focus:ring-forest focus:border-forest"
                disabled={isSubmitting}
                autoComplete="email"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="message" className="block text-sm font-medium text-deepCharcoal">Message</label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                className="mt-1 w-full px-4 py-2 border border-lightGrey rounded-[10px] focus:ring-forest focus:border-forest"
                disabled={isSubmitting}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="text-center">
              <button
                type="submit"
                className="inline-block px-6 py-3 bg-forest text-cream rounded-full hover:bg-forest/90 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Send Message"}
              </button>
            </motion.div>

            <motion.p
              id="form-status"
              aria-live="polite"
              variants={itemVariants}
              className={`text-center font-medium ${
                formStatus === "success" ? "text-green-700"
                : formStatus === "error" ? "text-red-700"
                : "text-transparent"
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: formStatus === "idle" ? 0 : 1 }}
              role={formStatus === "error" ? "alert" : "status"}
            >
              {formStatus === "success"
                ? "Message sent successfully!"
                : formStatus === "error"
                ? (formError || "Failed to send message. Please try again.")
                : " "}
            </motion.p>
          </motion.form>
        </section>
      </motion.main>
    </Layout>
  );
}
