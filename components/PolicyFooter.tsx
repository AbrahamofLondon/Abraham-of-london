// components/PolicyFooter.tsx
import * as React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/imports";

interface PolicyFooterProps {
  isDark?: boolean;
}

export default function PolicyFooter({
  isDark = true,
}: PolicyFooterProps): JSX.Element {
  const border = isDark ? "border-white/10" : "border-gray-300";
  const text = isDark ? "text-gold/70" : "text-slate-700";
  const link = isDark
    ? "text-gold hover:text-amber-200"
    : "text-forest hover:text-emerald-700";
  const bg = isDark ? "bg-charcoal/60" : "bg-white";
  const email = siteConfig.email ?? "info@abrahamoflondon.org";

  return (
    <section
      className={`mt-16 rounded-2xl border ${border} ${bg} backdrop-blur-sm p-6 text-center`}
    >
      <p className={`mb-4 text-sm ${text}`}>
        For a full view of how we manage data, security, accessibility, and
        platform use, please refer to the following documents:
      </p>

      <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
        <Link
          href="/privacy"
          className={`${link} underline underline-offset-2`}
        >
          Privacy Policy
        </Link>

        <span className={text}>•</span>

        <Link href="/terms" className={`${link} underline underline-offset-2`}>
          Terms of Service
        </Link>

        <span className={text}>•</span>

        <Link
          href="/cookies"
          className={`${link} underline underline-offset-2`}
        >
          Cookie Policy
        </Link>

        <span className={text}>•</span>

        <Link
          href="/security"
          className={`${link} underline underline-offset-2`}
        >
          Security Policy
        </Link>

        <span className={text}>•</span>

        <Link
          href="/accessibility"
          className={`${link} underline underline-offset-2`}
        >
          Accessibility Statement
        </Link>
      </div>

      <p className={`mt-4 text-xs ${text}`}>
        If you have questions about these policies, you can{" "}
        <Link
          href="/contact"
          className={`${link} underline underline-offset-2`}
        >
          contact us
        </Link>{" "}
        or email{" "}
        <a
          href={`mailto:${email}`}
          className={`${link} underline underline-offset-2`}
        >
          {email}
        </a>
        .
      </p>

      <p className={`mt-2 text-[0.7rem] ${text}`}>
        These documents collectively describe our governance framework. They are
        for general information only and do not constitute legal, financial, or
        professional advice. Your use of this site remains subject to the most
        recent versions published here.
      </p>
    </section>
  );
}

