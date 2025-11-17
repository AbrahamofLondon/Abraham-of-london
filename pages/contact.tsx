// pages/contact.tsx
import * as React from "react";
import Head from "next/head";
import { Moon, SunMedium, Mail, Phone, MapPin, Clock, Users, Target } from "lucide-react";
import Layout from "@/components/Layout";
import { siteConfig, getPageTitle } from "@/lib/siteConfig";

const ContactPage = (): JSX.Element => {
  const pageTitle = "Contact Abraham of London";
  const [isDark, setIsDark] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  // Theme management
  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("aof-theme");
      if (stored === "light" || stored === "dark") {
        setIsDark(stored === "dark");
        return;
      }
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
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

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{getPageTitle(pageTitle)}</title>
        <meta
          name="description"
          content="Connect with Abraham of London for strategic advisory, fatherhood advocacy, legacy building, and venture leadership. Priority given to aligned vision and principled partnerships."
        />
        <meta name="theme-color" content={isDark ? "#0f172a" : "#f7f5ee"} />
      </Head>

      <div className={shellClass}>
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
          {/* Header with theme toggle */}
          <div className="flex items-start justify-between gap-4 mb-12">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${accentTextClass}`}>
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

          {/* Enhanced Hero Section */}
          <header className="text-center mb-16">
            <p className={`text-[0.7rem] font-semibold uppercase tracking-[0.24em] ${accentTextClass}`}>
              Begin the Dialogue
            </p>
            <h1 className={`mt-4 font-serif text-4xl font-bold md:text-5xl ${primaryTextClass}`}>
              Contact Abraham of London
            </h1>
            <p className={`mt-6 max-w-2xl mx-auto text-lg leading-relaxed ${secondaryTextClass}`}>
              For strategic advisory, fatherhood advocacy, legacy building, and venture leadership. 
              Priority consideration given to aligned vision and principled partnerships.
            </p>
          </header>

          <div className="grid gap-12 lg:grid-cols-3">
            {/* Contact Information Sidebar */}
            <div className="lg:col-span-1">
              <div className={`rounded-2xl border p-8 h-full ${cardClass}`}>
                <h2 className={`font-serif text-2xl font-semibold mb-6 ${primaryTextClass}`}>
                  Direct Contact
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-3 ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}>
                      <Mail className={isDark ? "h-5 w-5 text-softGold" : "h-5 w-5 text-forest"} />
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${primaryTextClass}`}>Email</h3>
                      <a 
                        href={`mailto:${siteConfig.email}`}
                        className={`text-sm hover:underline ${accentTextClass}`}
                      >
                        {siteConfig.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-3 ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}>
                      <Phone className={isDark ? "h-5 w-5 text-softGold" : "h-5 w-5 text-forest"} />
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${primaryTextClass}`}>Phone</h3>
                      <a 
                        href={`tel:${siteConfig.phone.replace(/\s/g, '')}`}
                        className={`text-sm hover:underline ${accentTextClass}`}
                      >
                        {siteConfig.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-3 ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}>
                      <MapPin className={isDark ? "h-5 w-5 text-softGold" : "h-5 w-5 text-forest"} />
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${primaryTextClass}`}>Location</h3>
                      <p className={`text-sm ${secondaryTextClass}`}>London, United Kingdom</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-3 ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}>
                      <Clock className={isDark ? "h-5 w-5 text-softGold" : "h-5 w-5 text-forest"} />
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${primaryTextClass}`}>Response Time</h3>
                      <p className={`text-sm ${secondaryTextClass}`}>2-3 business days for qualified inquiries</p>
                    </div>
                  </div>
                </div>

                <div className={`mt-8 pt-6 border-t ${isDark ? "border-white/10" : "border-lightGrey"}`}>
                  <h3 className={`font-semibold mb-3 ${primaryTextClass}`}>Priority Consideration</h3>
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
                      <span className="h-3 w-3 text-softGold">•</span>
                      Long-term impact potential
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Main Contact Form */}
            <div className="lg:col-span-2">
              <div className={`rounded-2xl border p-8 ${cardClass}`}>
                <div className="mb-8">
                  <h2 className={`font-serif text-2xl font-semibold mb-3 ${primaryTextClass}`}>
                    Strategic Enquiry Form
                  </h2>
                  <p className={`text-sm ${secondaryTextClass}`}>
                    For speaking invitations, strategic advisory, media enquiries, or collaboration 
                    opportunities. A response will be prioritised based on clarity of brief and strategic fit.
                  </p>
                </div>

                <form
                  method="post"
                  action="/api/contact"
                  className="space-y-6"
                >
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className={`block text-sm font-semibold mb-2 ${primaryTextClass}`}
                      >
                        Full Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-0 transition focus:ring-2 ${inputClass}`}
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className={`block text-sm font-semibold mb-2 ${primaryTextClass}`}
                      >
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-0 transition focus:ring-2 ${inputClass}`}
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className={`block text-sm font-semibold mb-2 ${primaryTextClass}`}
                    >
                      Subject
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-0 transition focus:ring-2 ${inputClass}`}
                      placeholder="Brief summary of your enquiry"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="enquiryType"
                      className={`block text-sm font-semibold mb-2 ${primaryTextClass}`}
                    >
                      Type of Enquiry
                    </label>
                    <select
                      id="enquiryType"
                      name="enquiryType"
                      required
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-0 transition focus:ring-2 ${inputClass}`}
                    >
                      <option value="">Select an option</option>
                      <option value="strategic-advisory">Strategic Advisory</option>
                      <option value="speaking-engagement">Speaking Engagement</option>
                      <option value="media-interview">Media Interview</option>
                      <option value="venture-partnership">Venture Partnership</option>
                      <option value="fatherhood-advocacy">Fatherhood Advocacy</option>
                      <option value="legacy-consulting">Legacy Consulting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className={`block text-sm font-semibold mb-2 ${primaryTextClass}`}
                    >
                      Detailed Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      className={`w-full rounded-xl border px-4 py-3 text-sm leading-relaxed outline-none ring-0 transition focus:ring-2 ${inputClass}`}
                      placeholder="Provide context, objectives, timelines, and decision-makers involved. Precision accelerates progress."
                    />
                    <p className={`mt-2 text-xs ${secondaryTextClass}`}>
                      Be specific: context, objectives, timelines, and decision-makers involved. 
                      Precision accelerates progress and ensures appropriate consideration.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                    <p className={`text-sm ${secondaryTextClass}`}>
                      Prefer direct communication?{" "}
                      <a
                        href={`mailto:${siteConfig.email}`}
                        className={`font-semibold underline-offset-2 hover:underline ${accentTextClass}`}
                      >
                        Email directly
                      </a>
                    </p>

                    <button
                      type="submit"
                      className={`inline-flex items-center rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-wide transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-105 ${buttonClass}`}
                    >
                      Submit Strategic Enquiry
                    </button>
                  </div>
                </form>
              </div>

              {/* Additional Context Section */}
              <div className={`mt-8 rounded-2xl border p-6 ${cardClass}`}>
                <h3 className={`font-serif text-lg font-semibold mb-3 ${primaryTextClass}`}>
                  About Abraham of London
                </h3>
                <p className={`text-sm leading-relaxed ${secondaryTextClass}`}>
                  Abraham of London leads a family of strategic ventures focused on legacy building, 
                  fatherhood advocacy, and principled leadership. Through InnovateHub, Alomarada, 
                  and Endureluxe, we create sustainable impact across advisory, innovation, and 
                  community domains.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;