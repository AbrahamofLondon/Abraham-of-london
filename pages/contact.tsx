"use client";

import * as React from "react";
import Head from "next/head";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { siteConfig } from "@/lib/imports";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";

const ContactFormContent = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!executeRecaptcha) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const gRecaptchaToken = await executeRecaptcha("contact_form");
      const formData = new FormData(event.currentTarget);
      const payload: Record<string, unknown> & { gRecaptchaToken: string } = {
        ...Object.fromEntries(formData.entries()),
        gRecaptchaToken,
      };

      // Honeypot protection
      if (payload["website"] || payload["middleName"]) {
        // Silently fail for bots
        setSubmitStatus('success');
        return;
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmitStatus('success');
        (event.target as HTMLFormElement).reset();
      } else {
        setSubmitStatus('error');
      }
    } catch (_error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <a
        href={`mailto:${siteConfig.contact?.email ?? ""}`}
        className="font-mono text-[10px] tracking-[0.08em] text-white/58 transition-colors hover:text-[#C9A96E]"
      >
        {siteConfig.contact?.email ?? ""}
      </a>

      <form className="mt-8 space-y-5 bg-white/[0.02] p-6" onSubmit={handleSubmit}>
        <div className="hidden" aria-hidden="true">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          <input type="text" name="middleName" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="space-y-2">
          <label className="ml-1 font-mono text-[9px] uppercase tracking-[0.3em] text-white/32">
            Principal Name
          </label>
          <input
            name="name"
            required
            className="w-full border border-white/12 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/24 focus:outline-none focus:border-white/24"
            placeholder="Full Name"
          />
        </div>

        <div className="space-y-2">
          <label className="ml-1 font-mono text-[9px] uppercase tracking-[0.3em] text-white/32">
            Secure Email
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full border border-white/12 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/24 focus:outline-none focus:border-white/24"
            placeholder="email@domain.com"
          />
        </div>

        <div className="space-y-2">
          <label className="ml-1 font-mono text-[9px] uppercase tracking-[0.3em] text-white/32">
            Engagement Type
          </label>
          <select
            name="enquiryType"
            required
            className="w-full border border-white/12 bg-[rgb(3,3,5)] px-4 py-3 text-sm text-white focus:outline-none focus:border-white/24"
          >
            <option value="">Select Enquiry Nature</option>
            <option value="strategic-advisory">Strategic Advisory</option>
            <option value="intelligence-briefing">Intelligence Briefing</option>
            <option value="invitation-request">Invitation Request</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="ml-1 font-mono text-[9px] uppercase tracking-[0.3em] text-white/32">
            Brief Context
          </label>
          <textarea
            name="message"
            required
            rows={6}
            className="w-full resize-none border border-white/12 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/24 focus:outline-none focus:border-white/24"
            placeholder="Detail the parameters of your request..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-500 transition-colors hover:underline disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Sending...
            </span>
          ) : (
            "Send message →"
          )}
        </button>
      </form>

      {submitStatus === 'success' && (
        <p className="mt-5 font-mono text-[7.5px] uppercase tracking-[0.16em] text-green-500">
          Transmission received. Deployment pending review.
        </p>
      )}
      {submitStatus === 'error' && (
        <p className="mt-5 font-mono text-[7.5px] uppercase tracking-[0.16em] text-red-500">
          Security error. Transmission failed.
        </p>
      )}

      <p className="mt-8 font-mono text-[7.5px] uppercase tracking-[0.16em] text-white/28">
        Serious inquiries only. Principals, executives, and family offices.
      </p>
      <p className="mt-3 font-mono text-[7.5px] uppercase tracking-[0.16em] text-white/24">
        Response within 48 hours.
      </p>
    </div>
  );
};

const ContactPage = (): JSX.Element => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <Layout title="Contact"><div className="min-h-screen bg-[rgb(3,3,5)]" /></Layout>;

  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}>
      <Layout title="Contact | Abraham of London">
        <div className="min-h-screen bg-[rgb(3,3,5)] text-white">
          <div className="mx-auto max-w-5xl px-6 pb-16 pt-28 lg:px-12 lg:pb-20 lg:pt-36">
            <header className="max-w-3xl">
              <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/38">
                CONTACT · INSTITUTIONAL
              </p>
              <h1 className="mt-6 font-serif text-[clamp(2.5rem,6vw,4rem)] font-light italic leading-[0.95] text-white/92">
                The channel.
              </h1>
              <p className="mt-5 max-w-[56ch] text-base leading-[1.6] text-white/48">
                Direct institutional inquiry.
              </p>
            </header>

            <div className="mt-10">
              <ContactFormContent />
            </div>

            <footer className="mt-12">
              <a
                href="/"
                className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/28 transition-colors hover:text-white/52"
              >
                ← Back to home
              </a>
            </footer>
          </div>
        </div>
      </Layout>
    </GoogleReCaptchaProvider>
  );
};

export default ContactPage;
