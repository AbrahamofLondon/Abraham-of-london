// components/PolicyFooter.tsx
import * as React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/imports";

interface PolicyFooterProps {
  isDark?: boolean;
}

export default function PolicyFooter({ isDark = true }: PolicyFooterProps): JSX.Element {
  const email = siteConfig.contact?.email || (siteConfig as any).email || "info@abrahamoflondon.org";

  const border = isDark ? "border-white/10" : "border-gray-200/70";
  const bg = isDark
    ? "bg-gradient-to-br from-charcoal/70 via-black/50 to-charcoal/60"
    : "bg-gradient-to-br from-white via-white to-slate-50";
  const text = isDark ? "text-gold/75" : "text-slate-700";
  const subtle = isDark ? "text-gold/50" : "text-slate-500";
  const link = isDark
    ? "text-softGold hover:text-amber-200"
    : "text-forest hover:text-emerald-700";

  return (
    <section className={`mt-16 overflow-hidden rounded-3xl border ${border} ${bg} backdrop-blur-md p-7 sm:p-8`}>
      <div className="mx-auto max-w-3xl text-center">
        <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${subtle}`}>
          Governance · Policies
        </p>

        <h3 className={`mt-2 font-serif text-xl sm:text-2xl ${isDark ? "text-cream" : "text-slate-900"}`}>
          The boring bits - written with restraint.
        </h3>

        <p className={`mt-3 text-sm leading-relaxed ${text}`}>
          For a clear view of how we handle data, security, accessibility, and platform use, review the documents below.
          They&apos;re designed to be readable - not intimidating.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm font-medium">
          <Link href="/privacy" className={`${link} underline underline-offset-4`}>
            Privacy
          </Link>
          <span className={subtle}>•</span>
          <Link href="/terms" className={`${link} underline underline-offset-4`}>
            Terms
          </Link>
          <span className={subtle}>•</span>
          <Link href="/cookies" className={`${link} underline underline-offset-4`}>
            Cookies
          </Link>
          <span className={subtle}>•</span>
          <Link href="/security" className={`${link} underline underline-offset-4`}>
            Security
          </Link>
          <span className={subtle}>•</span>
          <Link href="/accessibility" className={`${link} underline underline-offset-4`}>
            Accessibility
          </Link>
        </div>

        <div className={`mx-auto mt-6 max-w-2xl rounded-2xl border ${border} ${isDark ? "bg-black/30" : "bg-white"} p-4`}>
          <p className={`text-xs leading-relaxed ${text}`}>
            Questions?{" "}
            <Link href="/contact" className={`${link} underline underline-offset-4`}>
              Contact us
            </Link>{" "}
            or email{" "}
            <a href={`mailto:${email}`} className={`${link} underline underline-offset-4`}>
              {email}
            </a>
            .
          </p>
        </div>

        <p className={`mt-4 text-[0.72rem] leading-relaxed ${subtle}`}>
          These documents are informational and do not constitute legal, financial, or professional advice. Your use of
          this site is governed by the most recent versions published here.
        </p>
      </div>
    </section>
  );
}

