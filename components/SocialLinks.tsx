// components/SocialLinks.tsx
import * as React from "react";
import Link from "next/link";
import clsx from "clsx";
import { siteConfig } from "@/lib/siteConfig";

type Props = {
  className?: string;
};

type BareSocial = {
  href?: string;
  label?: string;
};

// Your canonical social + contact endpoints
const DEFAULT_SOCIALS: BareSocial[] = [
  {
    href: "https://tiktok.com/@abrahamoflondon",
    label: "TikTok",
  },
  {
    href: "https://x.com/AbrahamAda48634",
    label: "X",
  },
  {
    href: "https://www.instagram.com/abraham_of_london_/",
    label: "Instagram",
  },
  {
    href: "https://www.facebook.com/share/16tvsnTgRG/",
    label: "Facebook",
  },
  {
    href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    label: "LinkedIn",
  },
  {
    href: "https://www.youtube.com/@abrahamoflondon",
    label: "YouTube",
  },
  {
    href: "mailto:info@abrahamoflondon.org",
    label: "Email",
  },
  {
    href: "https://wa.me/447496334022",
    label: "WhatsApp",
  },
  {
    href: "tel:+442086225909",
    label: "Landline",
  },
];

const isExternal = (href: string) => /^https?:\/\//i.test(href);
const isUtility = (href: string) =>
  href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("sms:");

export default function SocialLinks({ className }: Props): JSX.Element | null {
  const configSocials: BareSocial[] = Array.isArray(siteConfig.socialLinks)
    ? (siteConfig.socialLinks as BareSocial[])
    : [];

  // Merge config + defaults, preference to config if same href appears
  const byHref = new Map<string, BareSocial>();

  [...DEFAULT_SOCIALS, ...configSocials].forEach((item) => {
    const rawHref = typeof item.href === "string" ? item.href.trim() : "";
    if (!rawHref) return;
    byHref.set(rawHref, item);
  });

  const socials = Array.from(byHref.entries()).map(([href, item]) => {
    const rawLabel =
      (typeof item.label === "string" ? item.label.trim() : "") || href;
    const label =
      rawLabel ||
      href.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
      "Link";

    return { href, label };
  });

  if (!socials.length) return null;

  return (
    <ul className={clsx("flex flex-wrap items-center gap-3 text-sm", className)}>
      {socials.map(({ href, label }, i) => {
        if (!href) {
          return (
            <li key={`social-empty-${i}`} className="opacity-60">
              <span>{label}</span>
            </li>
          );
        }

        const external = isExternal(href);
        const utility = isUtility(href);

        // mailto/tel should not open in a new tab; treat as "utility" links
        if (external && !utility) {
          return (
            <li key={`${label}-${i}`}>
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
            <li key={`${label}-${i}`}>
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

        // Internal links (if you ever include them in siteConfig.socialLinks)
        return (
          <li key={`${label}-${i}`}>
            <Link
              href={href}
              className="hover:underline"
              aria-label={label}
              prefetch={false}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}