// components/LegalStrip.tsx
import * as React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export interface LegalStripProps {
  variant?: "subtle" | "strong";
  className?: string;
}

export default function LegalStrip({
  variant = "subtle",
  className = "",
}: LegalStripProps): JSX.Element {
  const email = siteConfig.email ?? "info@abrahamoflondon.org";

  const baseClasses =
    "mt-6 rounded-xl border px-4 py-3 text-xs leading-relaxed sm:text-[0.8rem]";
  const tone =
    variant === "strong"
      ? "border-gold/50 bg-black/70 text-gold/80"
      : "border-gold/25 bg-black/40 text-gold/60";

  return (
    <section className={`${baseClasses} ${tone} ${className}`.trim()}>
      <p>
        We handle your information with restraint and common sense. Email and
        newsletter delivery are powered by{" "}
        <span className="font-semibold text-cream">Resend</span> (for
        transactional/system emails) and{" "}
        <span className="font-semibold text-cream">Buttondown</span> (for
        curated newsletters and updates).
      </p>
      <p className="mt-1">
        We don&apos;t sell your data, spam your inbox, or share your details
        casually. You can unsubscribe from newsletters at any time. For full
        details, please review our{" "}
        <Link
          href="/privacy"
          className="text-softGold underline underline-offset-2 hover:text-amber-200"
        >
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link
          href="/terms"
          className="text-softGold underline underline-offset-2 hover:text-amber-200"
        >
          Terms of Service
        </Link>
        , or email{" "}
        <a
          href={`mailto:${email}`}
          className="text-softGold underline underline-offset-2 hover:text-amber-200"
        >
          {email}
        </a>{" "}
        if you have concerns.
      </p>
    </section>
  );
}
