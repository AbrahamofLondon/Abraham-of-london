// components/LegalStrip.tsx
import * as React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/imports";

export interface LegalStripProps {
  variant?: "subtle" | "strong";
  className?: string;
}

/**
 * Robust email resolver:
 * - supports legacy siteConfig.email
 * - supports new siteConfig.contact.email
 * - safe fallback
 */
function resolveEmail(config: any): string {
  const direct = typeof config?.email === "string" ? config.email : null;
  const nested =
    typeof config?.contact?.email === "string" ? config.contact.email : null;

  const email = (direct || nested || "info@abrahamoflondon.org").trim();
  return email || "info@abrahamoflondon.org";
}

export default function LegalStrip({
  variant = "subtle",
  className = "",
}: LegalStripProps): React.ReactElement {
  const email = resolveEmail(siteConfig);

  const shell =
    "mt-8 overflow-hidden rounded-2xl border backdrop-blur-sm shadow-[0_12px_40px_rgba(0,0,0,0.35)]";

  const tone =
    variant === "strong"
      ? "border-softGold/35 bg-gradient-to-br from-black/80 via-[#07060a]/80 to-black/70"
      : "border-white/10 bg-gradient-to-br from-black/55 via-[#07060a]/45 to-black/45";

  const inner = "px-5 py-4 sm:px-6 sm:py-5";

  const heading =
    variant === "strong"
      ? "text-cream"
      : "text-cream/90";

  const text =
    variant === "strong"
      ? "text-gold/80"
      : "text-zinc-300/80";

  const chip =
    variant === "strong"
      ? "border-softGold/30 bg-softGold/10 text-softGold"
      : "border-white/10 bg-white/5 text-zinc-200/80";

  const link =
    "text-softGold underline decoration-softGold/40 underline-offset-4 hover:decoration-softGold hover:text-amber-200 transition-colors";

  return (
    <section className={`${shell} ${tone} ${className}`.trim()} aria-label="Privacy and terms notice">
      {/* Soft top accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-softGold/60 to-transparent" />

      <div className={inner}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className={`text-sm font-semibold tracking-wide ${heading}`}>
              A quick word on privacy
            </p>
            <p className={`text-xs leading-relaxed ${text}`}>
              We handle your information with restraint and common sense.
              No selling lists. No sloppy sharing. No nonsense.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${chip}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              Data-minimised
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ${chip}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              Unsubscribe-anytime
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <p className={`text-xs leading-relaxed ${text}`}>
            Email delivery is powered by{" "}
            <span className="font-semibold text-cream/90">Resend</span>{" "}
            (transactional/system emails) and{" "}
            <span className="font-semibold text-cream/90">Buttondown</span>{" "}
            (curated newsletters and updates).
          </p>

          <p className={`text-xs leading-relaxed ${text}`}>
            For full details, see our{" "}
            <Link href="/privacy" className={link}>
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className={link}>
              Terms of Service
            </Link>
            . If anything looks off, email{" "}
            <a href={`mailto:${email}`} className={link}>
              {email}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}