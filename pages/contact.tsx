"use client";

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { siteConfig } from "@/lib/imports";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import {
  getSecurityAssuranceMaterialById,
} from "@/lib/security-assurance/security-assurance-pack-registry";
import {
  createSecurityAssuranceRequestPayload,
  getSecurityAssuranceSubmissionErrorMessage,
  resolveSecurityAssuranceMaterialId,
} from "@/lib/security-assurance/security-assurance-contact";

const GOLD = "#C9A96E";

const ENQUIRY_TYPES = [
  { value: "", label: "Select enquiry type" },
  { value: "institutional", label: "Institutional mandate" },
  { value: "security-assurance", label: "Security assurance pack" },
  { value: "private", label: "Private / confidential advisory" },
  { value: "education", label: "Education or research" },
  { value: "media", label: "Media enquiry" },
  { value: "partnership", label: "Partnership or collaboration" },
  { value: "strategic-advisory", label: "Strategic advisory" },
  { value: "other", label: "Other" },
];

const PROCUREMENT_STAGES = [
  { value: "", label: "Select stage (optional)" },
  { value: "early_review", label: "Early review" },
  { value: "pilot_due_diligence", label: "Pilot due diligence" },
  { value: "procurement", label: "Procurement" },
  { value: "security_review", label: "Security review" },
  { value: "legal_review", label: "Legal review" },
  { value: "other", label: "Other" },
];

const ContactFormContent = () => {
  const router = useRouter();
  const typeParam = (router.query.type as string) ?? "";
  const requestedParam = (router.query.requested as string) ?? "";
  const defaultType = ENQUIRY_TYPES.some(t => t.value === typeParam) ? typeParam : "";

  const [enquiryType, setEnquiryType] = React.useState(defaultType);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [submitErrorMessage, setSubmitErrorMessage] = React.useState<string | null>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const isSecurityAssurance = enquiryType === "security-assurance";
  const requestedMaterial = isSecurityAssurance && requestedParam
    ? getSecurityAssuranceMaterialById(requestedParam)
    : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!executeRecaptcha) {
      setSubmitErrorMessage(
        "Security verification is still loading. Please refresh and try again.",
      );
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitErrorMessage(null);

    try {
      const formData = new FormData(event.currentTarget);

      // Honeypot protection
      if (formData.get("website") || formData.get("middleName")) {
        setSubmitStatus('success');
        return;
      }

      if (isSecurityAssurance) {
        // Route security-assurance requests to the structured intake API
        const gRecaptchaToken = await executeRecaptcha("security_assurance_request");
        const payload = createSecurityAssuranceRequestPayload(
          {
            name: formData.get("name") as string | null,
            email: formData.get("email") as string | null,
            organisation: formData.get("organisation") as string | null,
            role: formData.get("role") as string | null,
            procurementStage: formData.get("procurementStage") as string | null,
            message: formData.get("message") as string | null,
          },
          resolveSecurityAssuranceMaterialId(requestedParam),
          gRecaptchaToken,
        );

        const response = await fetch('/api/security-assurance/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          setSubmitStatus('success');
          (event.target as HTMLFormElement).reset();
        } else {
          const body = await response.json().catch(() => null);
          setSubmitErrorMessage(
            getSecurityAssuranceSubmissionErrorMessage(
              response.status,
              typeof body?.code === "string" ? body.code : undefined,
            ),
          );
          setSubmitStatus('error');
        }
      } else {
        // Standard contact flow
        const gRecaptchaToken = await executeRecaptcha("contact_form");
        const payload: Record<string, unknown> & { gRecaptchaToken: string } = {
          ...Object.fromEntries(formData.entries()),
          gRecaptchaToken,
        };

        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          setSubmitStatus('success');
          (event.target as HTMLFormElement).reset();
        } else {
          setSubmitErrorMessage("Transmission failed. Please try again.");
          setSubmitStatus('error');
        }
      }
    } catch (_error) {
      setSubmitErrorMessage("Transmission failed. Please try again.");
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

      {/* Requested material banner */}
      {requestedMaterial && (
        <div
          className="mt-6"
          style={{
            border: `1px solid ${GOLD}22`,
            backgroundColor: `${GOLD}05`,
            padding: "0.75rem 1rem",
          }}
        >
          <p className="font-mono text-[7px] uppercase tracking-[0.18em]" style={{ color: `${GOLD}88`, marginBottom: "0.2rem" }}>
            Requested material
          </p>
          <p className="font-serif text-sm" style={{ color: "rgba(255,255,255,0.70)", fontWeight: 300 }}>
            {requestedMaterial.title}
          </p>
          {requestedMaterial.requiresNda && (
            <p className="font-mono text-[6.5px] uppercase tracking-[0.12em] mt-1" style={{ color: "rgba(252,165,165,0.55)" }}>
              This material requires NDA before sharing.
            </p>
          )}
        </div>
      )}

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
            value={enquiryType}
            onChange={(e) => setEnquiryType(e.target.value)}
            className="w-full border border-white/12 bg-[rgb(3,3,5)] px-4 py-3 text-sm text-white focus:outline-none focus:border-white/24"
          >
            {ENQUIRY_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Security-assurance additional fields */}
        {isSecurityAssurance && (
          <>
            <div className="space-y-2">
              <label className="ml-1 font-mono text-[9px] uppercase tracking-[0.3em] text-white/32">
                Organisation
              </label>
              <input
                name="organisation"
                className="w-full border border-white/12 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/24 focus:outline-none focus:border-white/24"
                placeholder="Organisation name"
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 font-mono text-[9px] uppercase tracking-[0.3em] text-white/32">
                Role
              </label>
              <input
                name="role"
                className="w-full border border-white/12 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/24 focus:outline-none focus:border-white/24"
                placeholder="Your role or title"
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 font-mono text-[9px] uppercase tracking-[0.3em] text-white/32">
                Procurement Stage
              </label>
              <select
                name="procurementStage"
                className="w-full border border-white/12 bg-[rgb(3,3,5)] px-4 py-3 text-sm text-white focus:outline-none focus:border-white/24"
              >
                {PROCUREMENT_STAGES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </>
        )}

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
          {submitErrorMessage ?? "Transmission failed. Please try again."}
        </p>
      )}

      {/* What happens next */}
      <div className="mt-10" style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
        <div className="font-mono text-[7px] uppercase tracking-[0.28em] text-white/25" style={{ marginBottom: "0.85rem" }}>
          What happens next
        </div>
        <ol className="space-y-2 text-[13px] leading-[1.7] text-white/40" style={{ listStyleType: "decimal", paddingLeft: "1.25rem" }}>
          <li>Your enquiry is reviewed within 48 hours.</li>
          <li>Unsuitable or speculative requests are declined with a clear reason.</li>
          <li>Serious mandates receive a direct response with proposed boundaries.</li>
          <li>Confidential details should not be submitted in this form. The first conversation establishes scope.</li>
        </ol>
      </div>

      {/* Verification links */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/verification" className="font-mono text-[7px] uppercase tracking-[0.12em] text-white/25" style={{ padding: "5px 10px", border: "1px solid rgba(255,255,255,0.06)" }}>Verify the founder</Link>
        <Link href="/about/founder" className="font-mono text-[7px] uppercase tracking-[0.12em] text-white/25" style={{ padding: "5px 10px", border: "1px solid rgba(255,255,255,0.06)" }}>About the founder</Link>
        <Link href="/trust" className="font-mono text-[7px] uppercase tracking-[0.12em] text-white/25" style={{ padding: "5px 10px", border: "1px solid rgba(255,255,255,0.06)" }}>Trust boundaries</Link>
      </div>
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
