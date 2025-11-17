// components/Footer.tsx
import * as React from "react";
import Link from "next/link";
import { siteConfig, getRoutePath } from "@/lib/siteConfig";

type BareSocial = {
  href?: string;
  label?: string;
  external?: boolean;
};

// Canonical social + contact endpoints
const DEFAULT_SOCIALS: BareSocial[] = [
  {
    href: "https://tiktok.com/@abrahamoflondon",
    label: "TikTok",
    external: true,
  },
  {
    href: "https://x.com/AbrahamAda48634",
    label: "X",
    external: true,
  },
  {
    href: "https://www.instagram.com/abraham_of_london_/",
    label: "Instagram",
    external: true,
  },
  {
    href: "https://www.facebook.com/share/16tvsnTgRG/",
    label: "Facebook",
    external: true,
  },
  {
    href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    label: "LinkedIn",
    external: true,
  },
  {
    href: "https://www.youtube.com/@abrahamoflondon",
    label: "YouTube",
    external: true,
  },
  {
    href: "mailto:info@abrahamoflondon.org",
    label: "Email",
    external: false,
  },
  {
    href: "https://wa.me/447496334022",
    label: "WhatsApp",
    external: true,
  },
  {
    href: "tel:+442086225909",
    label: "Landline",
    external: false,
  },
];

const isExternal = (href: string) => /^https?:\/\//i.test(href);
const isUtility = (href: string) =>
  href.startsWith("mailto:") ||
  href.startsWith("tel:") ||
  href.startsWith("sms:");

export default function Footer(): JSX.Element {
  const title = siteConfig.title || "Abraham of London";
  const email = siteConfig.email || "info@abrahamoflondon.org";

  const configSocials: BareSocial[] = Array.isArray(siteConfig.socialLinks)
    ? (siteConfig.socialLinks as BareSocial[])
    : [];

  // Merge defaults + config socials, giving precedence to config where href matches
  const byHref = new Map<string, BareSocial>();

  [...DEFAULT_SOCIALS, ...configSocials].forEach((item) => {
    const rawHref = typeof item.href === "string" ? item.href.trim() : "";
    if (!rawHref) return;
    byHref.set(rawHref, {
      href: rawHref,
      label: item.label,
      external: item.external,
    });
  });

  const socials = Array.from(byHref.entries()).map(([href, item]) => {
    const rawLabel =
      (typeof item.label === "string" ? item.label.trim() : "") || href;
    const label =
      rawLabel ||
      href.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
      "Link";

    const external =
      typeof item.external === "boolean"
        ? item.external
        : isExternal(href) && !isUtility(href);

    return { href, label, external };
  });

  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/10 bg-gradient-to-b from-black via-deepCharcoal to-black text-gray-200">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start md:justify-between">
        {/* Brand + core links */}
        <div className="space-y-3 text-sm">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-softGold/80">
            Abraham of London
          </p>
          <h2 className="font-serif text-xl font-semibold text-cream">
            {title}
          </h2>
          <p className="max-w-md text-xs text-gray-300 md:text-sm">
            Faith-rooted strategy for fathers, founders, and boards who refuse
            to outsource responsibility – at home or in the marketplace.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs md:text-sm">
            <Link
              href={getRoutePath("home")}
              className="text-gray-300 hover:text-softGold hover:underline"
            >
              Home
            </Link>
            <span className="text-gray-500">•</span>
            <Link
              href="/ventures"
              className="text-gray-300 hover:text-softGold hover:underline"
            >
              Ventures
            </Link>
            <span className="text-gray-500">•</span>
            <Link
              href="/books"
              className="text-gray-300 hover:text-softGold hover:underline"
            >
              Books
            </Link>
            <span className="text-gray-500">•</span>
            <Link
              href="/downloads"
              className="text-gray-300 hover:text-softGold hover:underline"
            >
              Downloads
            </Link>
            <span className="text-gray-500">•</span>
            <Link
              href="/contact"
              className="text-gray-300 hover:text-softGold hover:underline"
            >
              Contact
            </Link>
          </div>

          {email && (
            <p className="mt-2 text-xs text-gray-400">
              Email:{" "}
              <a
                href={`mailto:${email}`}
                className="font-medium text-softGold hover:underline"
              >
                {email}
              </a>
            </p>
          )}
        </div>

        {/* Social strip */}
        {socials.length > 0 && (
          <div className="space-y-3 text-sm">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-softGold/80">
              Connect
            </p>
            <ul className="flex flex-wrap items-center gap-3">
              {socials.map(({ href, label, external }, index) => {
                if (!href) {
                  return (
                    <li
                      key={`social-empty-${index}`}
                      className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-400"
                    >
                      <span>{label}</span>
                    </li>
                  );
                }

                const utility = isUtility(href);

                const baseClasses =
                  "inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs text-gray-200 transition hover:bg-white/10 hover:text-softGold";

                if (external && !utility) {
                  return (
                    <li key={`${label}-${index}`}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={baseClasses}
                        aria-label={label}
                      >
                        {label}
                      </a>
                    </li>
                  );
                }

                if (utility) {
                  return (
                    <li key={`${label}-${index}`}>
                      <a
                        href={href}
                        className={baseClasses}
                        aria-label={label}
                      >
                        {label}
                      </a>
                    </li>
                  );
                }

                // Internal links if you ever add them to siteConfig.socialLinks
                return (
                  <li key={`${label}-${index}`}>
                    <Link
                      href={href}
                      className={baseClasses}
                      aria-label={label}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Legal bar */}
      <div className="border-t border-white/10 bg-black/80 py-4 text-center text-[11px] text-gray-500">
        © {year} {title}. All rights reserved. Built for men who still believe
        in duty, consequence, and legacy.
      </div>
    </footer>
  );
}