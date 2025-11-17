// components/Footer.tsx
import * as React from "react";
import Link from "next/link";
import { siteConfig, absUrl, getRoutePath } from "@/lib/siteConfig";

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

  return (
    <footer className="mt-16 w-full border-t border-lightGrey bg-white text-deepCharcoal">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row">
        <div className="text-sm">
          <span className="font-semibold">{title}</span>
          <span className="mx-2">•</span>
          {/* ✅ Use canonical route, NOT absUrl */}
          <Link href={getRoutePath("home")} className="hover:underline">
            Home
          </Link>
          {email ? (
            <>
              <span className="mx-2">•</span>
              <a href={`mailto:${email}`} className="hover:underline">
                {email}
              </a>
            </>
          ) : null}
        </div>

        {socials.length > 0 && (
          <ul className="flex flex-wrap items-center gap-4 text-sm">
            {socials.map(({ href, label, external }, index) => {
              if (!href) {
                return (
                  <li key={`social-empty-${index}`} className="opacity-60">
                    <span>{label}</span>
                  </li>
                );
              }

              const utility = isUtility(href);

              if (external && !utility) {
                return (
                  <li key={`${label}-${index}`}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
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
                      className="hover:underline"
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
                    className="hover:underline"
                    aria-label={label}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bg-warmWhite/60 py-4 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} {title}. All rights reserved.
      </div>
    </footer>
  );
}