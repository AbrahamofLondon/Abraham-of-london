// components/SocialLinks.tsx
import * as React from "react";
import Link from "next/link";
import clsx from "clsx";
import { siteConfig } from "@/lib/siteConfig";

type Props = {
  className?: string;
};

export default function SocialLinks({ className }: Props): JSX.Element | null {
  const socials = Array.isArray(siteConfig.socialLinks)
    ? siteConfig.socialLinks
    : [];

  if (!socials.length) return null;

  return (
    <ul className={clsx("flex flex-wrap items-center gap-3 text-sm", className)}>
      {socials.map((s, i) => {
        if (!s) return null;

        const rawHref = typeof s.href === "string" ? s.href.trim() : "";
        const href = rawHref || "#";

        const label =
          s.label?.trim() ||
          href.replace(/^https?:\/\//, "").replace(/\/$/, "") ||
          "Link";

        const isExternal = /^https?:\/\//i.test(href);

        // Guard against obviously broken hrefs
        if (!href || href === "#") {
          return (
            <li key={`social-${i}`} className="opacity-60">
              <span>{label}</span>
            </li>
          );
        }

        return (
          <li key={`${label}-${i}`}>
            {isExternal ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                aria-label={label}
              >
                {label}
              </a>
            ) : (
              <Link
                href={href}
                className="hover:underline"
                aria-label={label}
                prefetch={false}
              >
                {label}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}