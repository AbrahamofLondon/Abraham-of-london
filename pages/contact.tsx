"use client";

import * as React from "react";
import Head from "next/head";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  ChevronRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import Layout from "@/components/Layout";
import { siteConfig } from "@/lib/imports";
import PolicyFooter from "@/components/PolicyFooter";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";

const ContactFormContent = ({ 
  isDark, 
  cardClass, 
  inputClass, 
  primaryTextClass, 
  accentTextClass, 
  buttonClass 
}: any) => {
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
    <div className="grid gap-12 lg:grid-cols-3">
      {/* Contact Information Sidebar */}
      <div className="lg:col-span-1">
        <div className={`rounded-2xl border p-8 h-full transition-all ${cardClass}`}>
          <h2 className={`font-serif text-2xl font-semibold mb-6 ${primaryTextClass}`}>Direct Contact</h2>
          <div className="space-y-8 text-sm">
            <div className="flex items-start gap-4">
              <div className={`rounded-lg p-3 ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}>
                <Mail className={isDark ? "text-softGold" : "text-forest"} size={20} />
              </div>
              <div>
                <h3 className={`font-semibold mb-1 ${primaryTextClass}`}>Email</h3>
                <a href={`mailto:${siteConfig.contact?.email ?? ""}`} className={`hover:underline transition-colors ${accentTextClass}`}>
                  {siteConfig.contact?.email ?? ""}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className={`rounded-lg p-3 ${isDark ? "bg-softGold/10" : "bg-forest/10"}`}>
                <Clock className={isDark ? "text-softGold" : "text-forest"} size={20} />
              </div>
              <div>
                <h3 className={`font-semibold mb-1 ${primaryTextClass}`}>Availability</h3>
                <p className={isDark ? "text-zinc-400" : "text-zinc-600"}>GMT Standard Time<br />Mon — Fri: 09:00 - 18:00</p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
                <ShieldCheck size={12} />
                Encrypted Transmission Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Contact Form */}
      <div className="lg:col-span-2">
        <div className={`rounded-2xl border p-8 transition-all ${cardClass}`}>
          <h2 className={`font-serif text-2xl font-semibold mb-2 ${primaryTextClass}`}>Strategic Enquiry</h2>
          <p className="text-zinc-500 text-sm mb-8 italic">Specify parameters for routing to the appropriate operative.</p>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Honeypot fields */}
            <div className="hidden" aria-hidden="true">
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              <input type="text" name="middleName" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 ml-1">Principal Name</label>
                <input name="name" required className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-softGold transition-all ${inputClass}`} placeholder="Full Name" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 ml-1">Secure Email</label>
                <input name="email" type="email" required className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-softGold transition-all ${inputClass}`} placeholder="email@domain.com" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 ml-1">Engagement Type</label>
              <select name="enquiryType" required className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-softGold transition-all ${inputClass}`}>
                 <option value="">Select Enquiry Nature</option>
                 <option value="strategic-advisory">Strategic Advisory</option>
                 <option value="intelligence-briefing">Intelligence Briefing</option>
                 <option value="invitation-request">Invitation Request</option>
                 <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 ml-1">Brief Context</label>
              <textarea name="message" required rows={6} className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-softGold transition-all resize-none ${inputClass}`} placeholder="Detail the parameters of your request..." />
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${buttonClass}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Transmitting...
                </>
              ) : (
                <>
                  Submit Strategic Enquiry
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          {submitStatus === 'success' && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-500 text-xs font-bold uppercase tracking-widest text-center">Transmission Received. Deployment pending review.</p>
            </div>
          )}
          {submitStatus === 'error' && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-xs font-bold uppercase tracking-widest text-center">Security Error: Transmission Failed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ContactPage = (): JSX.Element => {
  const [isDark, setIsDark] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("aof-theme");
    if (stored) setIsDark(stored === "dark");
  }, []);

  if (!mounted) return <Layout title="Contact"><div className="min-h-screen bg-black" /></Layout>;

  // Theme Logic Matching your UI system
  const shellClass = isDark ? "bg-black text-cream" : "bg-warmWhite text-ink";
  const cardClass = isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-white shadow-sm";
  const inputClass = isDark ? "bg-white/5 border-white/20 text-white placeholder:text-zinc-600" : "bg-gray-50 border-gray-300 text-black placeholder:text-zinc-400";
  const buttonClass = isDark ? "bg-white text-black hover:bg-softGold" : "bg-forest text-white hover:bg-forest/90";

  return (
    <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}>
      <Layout title="Contact | Abraham of London">
        <div className={`min-h-screen transition-colors duration-500 ${shellClass}`}>
          <div className="mx-auto max-w-6xl px-4 py-24">
            <header className="mb-16 text-center lg:text-left">
              <h1 className="font-serif text-5xl md:text-6xl mb-4">Get in Touch</h1>
              <p className="text-zinc-500 max-w-2xl text-lg italic">Strategic alignment begins with a secure dialogue.</p>
            </header>

            <ContactFormContent 
                isDark={isDark} 
                cardClass={cardClass} 
                inputClass={inputClass} 
                buttonClass={buttonClass}
                primaryTextClass={isDark ? "text-white" : "text-black"}
                accentTextClass={isDark ? "text-softGold" : "text-forest"}
            />
            <PolicyFooter isDark={isDark} />
          </div>
        </div>
      </Layout>
    </GoogleReCaptchaProvider>
  );
};

export default ContactPage;