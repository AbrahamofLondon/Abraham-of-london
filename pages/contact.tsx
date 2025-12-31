// pages/contact.tsx - FIXED (console statements removed)
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Moon,
  SunMedium,
  Mail,
  Phone,
  MapPin,
  Clock,
  Users,
  Target,
  CheckCircle,
  Shield,
  Calendar,
} from "lucide-react";
import Layout from "@/components/Layout";
import { getPageTitle, siteConfig } from "@/lib/imports";
import PolicyFooter from "@/components/PolicyFooter";

const ContactPage = (): JSX.Element => {
  const pageTitle = "Contact Abraham of London";
  const [isDark, setIsDark] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  // Safe phone number with fallback
  const contactPhone =
    (siteConfig as { phone?: string }).phone ?? "+44 20 8622 5909";

  // Theme management
  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("aof-theme");
      if (stored === "light" || stored === "dark") {
        setIsDark(stored === "dark");
        return;
      }
      const prefersDark = window.matchMedia?.(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDark(prefersDark);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("aof-theme", next ? "dark" : "light");
      } catch {
        // ignore localStorage errors
      }
      return next;
    });
  };

  // Form submission handler - FIXED: removed console.log
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const formData = new FormData(event.currentTarget);
      const data = Object.fromEntries(formData.entries());

      // Basic honeypot protection - FIXED: removed console.log
      if (data.website || data.middleName) {
        // Honeypot triggered - silently ignore
        return;
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmitStatus('success');
        (event.target as HTMLFormElement).reset();
      } else {
        setSubmitStatus('error');
      }
    } catch (_error) {
      // FIXED: renamed error to _error to avoid unused variable warning
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset submit status when form changes
  const handleFormChange = () => {
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
    }
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <Layout title={pageTitle}>
        <div className="min-h-screen bg-gray-100" />
      </Layout>
    );
  }

  // Theme classes
  const shellClass = isDark
    ? "min-h-screen bg-gradient-to-br from-deepCharcoal via-gray-900 to-black text-cream"
    : "min-h-screen bg-gradient-to-br from-warmWhite via-cream to-white text-ink";

  const cardClass = isDark
    ? "border-white/10 bg-white/5 backdrop-blur-sm hover:border-softGold/30 transition-all duration-300"
    : "border-lightGrey bg-white shadow-lg hover:shadow-xl transition-all duration-300";

  const inputClass = isDark
    ? "border-white/20 bg-white/5 text-cream placeholder-gray-400 focus:border-softGold/60 focus:bg-white/10 focus:ring-softGold/40"
    : "border-lightGrey bg-warmWhite/60 text-ink placeholder-gray-500 focus:border-forest/60 focus:bg-white focus:ring-forest/40";

  const primaryTextClass = isDark ? "text-cream" : "text-deepCharcoal";
  const secondaryTextClass = isDark ? "text-gray-300" : "text-slate-700";
  const accentTextClass = isDark ? "text-softGold" : "text-forest";

  const buttonClass = isDark
    ? "bg-softGold text-deepCharcoal hover:bg-softGold/90 shadow-lg hover:shadow-softGold/25"
    : "bg-forest text-cream hover:bg-forest/90 shadow-lg hover:shadow-forest/25";

  const successClass = isDark 
    ? "border-green-500/30 bg-green-500/10 text-green-300"
    : "border-green-500/30 bg-green-50 text-green-700";

  const errorClass = isDark
    ? "border-red-500/30 bg-red-500/10 text-red-300"
    : "border-red-500/30 bg-red-50 text-red-700";

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{getPageTitle(pageTitle)}</title>
        <meta
          name="description"
          content="Connect with Abraham of London for strategic conversations around leadership, legacy, and principled ventures. Enquiries are considered based on clarity of brief and strategic fit."
        />
        <meta name="theme-color" content={isDark ? "#0f172a" : "#f7f5ee"} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ContactPage",
              "name": "Contact Abraham of London",
              "description": "Strategic partnership and advisory contact page",
              "telephone": contactPhone,
              "email": siteConfig.email,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "London",
                "addressCountry": "UK"
              }
            })
          }}
        />
      </Head>

      <div className={shellClass}>
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
          {/* Header with theme toggle */}
          <div className="flex items-start justify-between gap-4 mb-12">
            <div>
              <p
                className={`text-sm font-semibold uppercase tracking-[0.2em] ${accentTextClass}`}
              >
                Strategic Partnership
              </p>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm transition-all ${
                isDark
                  ? "border-white/15 bg-white/5 text-cream hover:bg-white/10"
                  : "border-lightGrey bg-white text-ink hover:bg-warmWhite"
              }`}
              aria-label="Toggle light/dark mode"
            >
              {isDark ? (
                <>
                  <SunMedium className="h-4 w-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Hero Section */}
          <header className="text-center mb-16">
            <p
              className={`text-[0.7rem] font-semibold uppercase tracking-[0.24em] ${accentTextClass}`}
            >
              Begin the Dialogue
            </p>
            <h1
              className={`mt-4 font-serif text-4xl font-bold md:text-5xl ${primaryTextClass}`}
            >
              Contact Abraham of London
            </h1>
            <p
              className={`mt-6 max-w-2xl mx-auto text-lg leading-relaxed ${secondaryTextClass}`}
            >
              For strategic advisory, fatherhood advocacy, legacy building, and
              venture leadership. Enquiries are prioritised where there is clear
              alignment of vision, values, and impact.
            </p>
          </header>

          {/* Submission Status Messages */}
          {submitStatus === 'success' && (
            <div className={`mb-6 rounded-xl border p-4 ${successClass}`}>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Enquiry Submitted Successfully</p>
                  <p className="text-sm mt-1">We&apos;ll respond within 2-3 business days. Thank you for your interest.</p>
                </div>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className={`mb-6 rounded-xl border p-4 ${errorClass}`}>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Submission Failed</p>
                  <p className="text-sm mt-1">Please try again or email us directly at {siteConfig.email}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-12 lg:grid-cols-3">
            {/* Contact Information Sidebar */}
            <div className="lg:col-span-1">
              <div className={`rounded-2xl border p-8 h-full ${cardClass}`}>
                <h2
                  className={`font-serif text-2xl font-semibold mb-6 ${primaryTextClass}`}
                >
                  Direct Contact
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-lg p-3 ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}
                    >
                      <Mail
                        className={
                          isDark
                            ? "h-5 w-5 text-softGold"
                            : "h-5 w-5 text-forest"
                        }
                      />
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${primaryTextClass}`}>
                        Email
                      </h3>
                      <a
                        href={`mailto:${siteConfig.email}`}
                        className={`text-sm hover:underline ${accentTextClass}`}
                      >
                        {siteConfig.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-lg p-3 ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}
                    >
                      <Phone
                        className={
                          isDark
                            ? "h-5 w-5 text-softGold"
                            : "h-5 w-5 text-forest"
                        }
                      />
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${primaryTextClass}`}>
                        Phone
                      </h3>
                      <a
                        href={`tel:${contactPhone.replace(/\s/g, "")}`}
                        className={`text-sm hover:underline ${accentTextClass}`}
                      >
                        {contactPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-lg p-3 ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}
                    >
                      <MapPin
                        className={
                          isDark
                            ? "h-5 w-5 text-softGold"
                            : "h-5 w-5 text-forest"
                        }
                      />
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${primaryTextClass}`}>
                        Location
                      </h3>
                      <p className={`text-sm ${secondaryTextClass}`}>
                        London, United Kingdom
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-lg p-3 ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}
                    >
                      <Clock
                        className={
                          isDark
                            ? "h-5 w-5 text-softGold"
                            : "h-5 w-5 text-forest"
                        }
                      />
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${primaryTextClass}`}>
                        Response Time
                      </h3>
                      <p className={`text-sm ${secondaryTextClass}`}>
                        We aim to respond to qualified enquiries within 2–3
                        business days. Depending on volume and strategic fit, we
                        may not be able to reply to every message individually.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-8 pt-6 border-t ${isDark ? "border-white/10" : "border-lightGrey"}`}
                >
                  <h3 className={`font-semibold mb-3 ${primaryTextClass}`}>
                    Priority Consideration
                  </h3>
                  <ul className={`text-sm space-y-2 ${secondaryTextClass}`}>
                    <li className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-softGold" />
                      Strategic alignment with core values
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-softGold" />
                      Clear vision and execution capability
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-softGold" />
                      Long-term impact potential
                    </li>
                  </ul>
                </div>

                <div
                  className={`mt-6 pt-4 border-t text-xs ${
                    isDark
                      ? "border-white/10 text-gray-400"
                      : "border-lightGrey text-slate-600"
                  }`}
                >
                  <p className="mb-1">
                    Submitting an enquiry does not create a client, advisory, or
                    fiduciary relationship.
                  </p>
                  <p>
                    Please avoid including confidential, highly sensitive, or
                    case-specific legal, financial, or medical details at this
                    stage.
                  </p>
                </div>
              </div>
            </div>

            {/* Main Contact Form */}
            <div className="lg:col-span-2">
              <div className={`rounded-2xl border p-8 ${cardClass}`}>
                <div className="mb-8">
                  <h2
                    className={`font-serif text-2xl font-semibold mb-3 ${primaryTextClass}`}
                  >
                    Strategic Enquiry Form
                  </h2>
                  <p className={`text-sm ${secondaryTextClass}`}>
                    For speaking invitations, strategic advisory, media
                    enquiries, or collaboration opportunities. Responses are
                    prioritised based on clarity of brief, timing, and strategic
                    fit.
                  </p>
                </div>

                <form 
                  method="post" 
                  action="/api/contact" 
                  className="space-y-6"
                  onSubmit={handleSubmit}
                  onChange={handleFormChange}
                >
                  {/* Honeypot fields - hidden from users */}
                  <div className="hidden">
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                    <input type="text" name="middleName" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className={`block text-sm font-semibold mb-2 ${primaryTextClass}`}
                      >
                        Full Name *
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-0 transition focus:ring-2 ${inputClass}`}
                        placeholder="Your full name"
                        minLength={2}
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className={`block text-sm font-semibold mb-2 ${primaryTextClass}`}
                      >
                        Email Address *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-0 transition focus:ring-2 ${inputClass}`}
                        placeholder='your.email@example.com'
                        pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className={`block text-sm font-semibold mb-2 ${primaryTextClass}`}
                    >
                      Subject *
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-0 transition focus:ring-2 ${inputClass}`}
                      placeholder="Brief summary of your enquiry"
                      minLength={5}
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="enquiryType"
                      className={`block text-sm font-semibold mb-2 ${primaryTextClass}`}
                    >
                      Type of Enquiry *
                    </label>
                    <select
                      id="enquiryType"
                      name="enquiryType"
                      required
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-0 transition focus:ring-2 ${inputClass}`}
                    >
                      <option value="">Select an option</option>
                      <option value="strategic-advisory">
                        Strategic Advisory
                      </option>
                      <option value="speaking-engagement">
                        Speaking Engagement
                      </option>
                      <option value="media-interview">Media Interview</option>
                      <option value="venture-partnership">
                        Venture Partnership
                      </option>
                      <option value="fatherhood-advocacy">
                        Fatherhood Advocacy
                      </option>
                      <option value="legacy-consulting">
                        Legacy Consulting
                      </option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className={`block text-sm font-semibold mb-2 ${primaryTextClass}`}
                    >
                      Detailed Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      className={`w-full rounded-xl border px-4 py-3 text-sm leading-relaxed outline-none ring-0 transition focus:ring-2 ${inputClass}`}
                      placeholder="Provide context, objectives, timelines, stakeholders, and decision-makers involved."
                      minLength={20}
                      maxLength={2000}
                    />
                    <p className={`mt-2 text-xs ${secondaryTextClass}`}>
                      Precision helps us assess strategic fit and determine
                      whether we are the right counterpart for your enquiry.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                    <p className={`text-sm ${secondaryTextClass}`}>
                      Prefer direct communication?{` `}
                      <a
                        href={`mailto:${siteConfig.email}`}
                        className={`font-semibold underline-offset-2 hover:underline ${accentTextClass}`}
                      >
                        Email directly
                      </a>
                      .
                    </p>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`inline-flex items-center rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-wide transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:hover:scale-100 ${buttonClass}`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Strategic Enquiry'
                      )}
                    </button>
                  </div>

                  <p className={`mt-4 text-xs ${secondaryTextClass}`}>
                    By submitting this form, you acknowledge that you have read
                    our{` `}
                    <Link
                      href="/privacy-policy"
                      className={`underline underline-offset-2 ${accentTextClass} hover:opacity-90`}
                    >
                      Privacy Policy
                    </Link>{` `}
                    and{` `}
                    <Link
                      href="/terms-of-service"
                      className={`underline underline-offset-2 ${accentTextClass} hover:opacity-90`}
                    >
                      Terms of Service
                    </Link>
                    .
                  </p>
                </form>
              </div>

              {/* Additional Context Section */}
              <div className={`mt-8 rounded-2xl border p-6 ${cardClass}`}>
                <h3
                  className={`font-serif text-lg font-semibold mb-3 ${primaryTextClass}`}
                >
                  About Abraham of London
                </h3>
                <p className={`text-sm leading-relaxed ${secondaryTextClass}`}>
                  Abraham of London curates a family of ventures focused on
                  legacy building, fatherhood advocacy, and principled
                  leadership. Through platforms such as Alomarada, InnovateHub,
                  and Endureluxe, we bring together strategic advisory, founder
                  support, and community initiatives aimed at durable impact.
                </p>
              </div>
            </div>
          </div>

          <PolicyFooter isDark={isDark} />
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
