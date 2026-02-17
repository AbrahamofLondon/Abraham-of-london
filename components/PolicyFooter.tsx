// components/PolicyFooter.tsx — CONSOLIDATED POLICY SECTION (Institutional, readable)
import * as React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

interface PolicyFooterProps {
  isDark?: boolean;
}

/** Robust email resolver */
function resolveEmail(config: any): string {
  const direct = typeof config?.email === "string" ? config.email : null;
  const nested = typeof config?.author?.email === "string" ? config.author.email : null;
  const contact = typeof config?.contact?.email === "string" ? config.contact.email : null;

  const email = (direct || nested || contact || "info@abrahamoflondon.org").trim();
  return email || "info@abrahamoflondon.org";
}

export default function PolicyFooter({ isDark = true }: PolicyFooterProps): React.ReactElement {
  const email = resolveEmail(siteConfig);

  const border = isDark ? "border-white/10" : "border-gray-200/70";
  const bg = isDark
    ? "bg-white/[0.02]"
    : "bg-gradient-to-br from-white via-white to-slate-50";
  const heading = isDark ? "text-white/90" : "text-slate-900";
  const body = isDark ? "text-white/45" : "text-slate-600";
  const subtle = isDark ? "text-white/35" : "text-slate-500";
  const link = isDark
    ? "text-amber-200/80 underline decoration-amber-200/25 underline-offset-4 hover:decoration-amber-200/60 hover:text-amber-100"
    : "text-emerald-700 underline decoration-emerald-700/30 underline-offset-4 hover:decoration-emerald-700 hover:text-emerald-800";

  return (
    <section className={`overflow-hidden rounded-3xl border ${border} ${bg} backdrop-blur-sm p-7 sm:p-8`}>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

      <div className="mx-auto max-w-3xl text-center">
        <p className={`text-[10px] font-mono uppercase tracking-[0.35em] ${subtle}`}>
          Governance · Policies
        </p>

        <h3 className={`mt-3 font-serif text-xl sm:text-2xl ${heading}`}>
          Clear terms. Minimal friction.
        </h3>

        <p className={`mt-3 text-sm leading-relaxed ${body}`}>
          These documents explain how the platform operates—privacy, security, accessibility, and usage—written for
          comprehension, not intimidation.
        </p>

        {/* Policy Links */}
        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm font-medium">
          <Link href="/privacy" className={link}>Privacy</Link>
          <span className={subtle}>•</span>
          <Link href="/terms" className={link}>Terms</Link>
          <span className={subtle}>•</span>
          <Link href="/cookies" className={link}>Cookies</Link>
          <span className={subtle}>•</span>
          <Link href="/security" className={link}>Security</Link>
          <span className={subtle}>•</span>
          <Link href="/accessibility" className={link}>Accessibility</Link>
        </div>

        {/* Privacy note */}
        <div className={`mx-auto mt-6 max-w-2xl rounded-2xl border ${border} ${isDark ? "bg-black/30" : "bg-white"} p-4`}>
          <p className={`text-xs leading-relaxed ${body}`}>
            <span className="font-semibold text-white/70">Privacy note:</span>{" "}
            Data collection is kept intentionally lean. No list-selling. No casual sharing. Email delivery relies on
            reputable providers for transactional and newsletter distribution.
          </p>
        </div>

        {/* Contact */}
        <p className={`mt-5 text-xs leading-relaxed ${body}`}>
          Questions?{" "}
          <Link href="/contact" className={link}>Contact</Link>{" "}
          or email{" "}
          <a href={`mailto:${email}`} className={link}>{email}</a>.
        </p>

        {/* Badges */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full border ${border} px-3 py-1 text-[10px] ${isDark ? "bg-white/5" : "bg-white"} ${body}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            Data-minimised
          </span>
          <span className={`inline-flex items-center gap-2 rounded-full border ${border} px-3 py-1 text-[10px] ${isDark ? "bg-white/5" : "bg-white"} ${body}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            Unsubscribe-anytime
          </span>
        </div>

        <p className={`mt-5 text-[0.7rem] leading-relaxed ${subtle}`}>
          Informational only. Not legal, financial, or professional advice. Use of this site is governed by the most
          recent versions published here.
        </p>
      </div>
    </section>
  );
}