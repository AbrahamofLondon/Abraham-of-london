// components/SocialLinks.tsx
import * as React from "react";
import Link from "next/link";
import clsx from "clsx";
import { siteConfig } from "@/lib/imports";

type Props = {
  className?: string;
  showLabels?: boolean; // Optional: show/hide text labels
  iconSize?: "sm" | "md" | "lg";
};

const isExternal = (href: string) => /^https?:\/\//i.test(href);
const isUtility = (href: string) =>
  href.startsWith("mailto:") ||
  href.startsWith("tel:") ||
  href.startsWith("sms:");

export default function SocialLinks({ 
  className, 
  showLabels = true,
  iconSize = "md"
}: Props): JSX.Element | null {
  // Get social links directly from siteConfig
  const socials = siteConfig.socialLinks || [];

  if (!socials.length) return null;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  return (
    <ul
      className={clsx("flex flex-wrap items-center gap-3", className)}
      role="list"
      aria-label="Social media links"
    >
      {socials.map((social, i) => {
        if (!social.href) return null;

        const external = isExternal(social.href);
        const utility = isUtility(social.href);
        const isEmail = social.href.startsWith("mailto:");
        const isPhone = social.href.startsWith("tel:");

        const linkClasses = clsx(
          "flex items-center gap-2 transition-colors",
          external && !utility && "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300",
          isEmail && "text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300",
          isPhone && "text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300",
          !external && "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        );

        const content = (
          <>
            {/* Optional: Add icons here based on social.kind */}
            {showLabels && (
              <span className="text-sm font-medium">{social.label}</span>
            )}
          </>
        );

        if (external && !utility) {
          return (
            <li key={`${social.label}-${i}`}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClasses}
                aria-label={`Visit our ${social.label} profile (opens in new tab)`}
              >
                {content}
              </a>
            </li>
          );
        }

        if (utility) {
          return (
            <li key={`${social.label}-${i}`}>
              <a 
                href={social.href} 
                className={linkClasses}
                aria-label={`Contact us via ${social.label}`}
              >
                {content}
              </a>
            </li>
          );
        }

        // Internal links (unlikely for social links, but keeping for consistency)
        return (
          <li key={`${social.label}-${i}`}>
            <Link
              href={social.href}
              className={linkClasses}
              aria-label={social.label}
              prefetch={false}
            >
              {content}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
