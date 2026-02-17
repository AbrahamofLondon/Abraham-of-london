/* components/SocialLinks.tsx — FIXED (single source: config/site.ts) */
"use client";

import * as React from "react";
import Link from "next/link";
import clsx from "clsx";

import {
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Mail,
  Phone,
  MessageCircle,
  Globe,
} from "lucide-react";

import { getSocialLinks } from "@/config/site";

type Props = {
  className?: string;
  showLabels?: boolean;
  showIcons?: boolean;
  iconSize?: "sm" | "md" | "lg";
  maxItems?: number;
};

const isExternal = (href: string) => /^https?:\/\//i.test(href);
const isUtility = (href: string) => href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("sms:");

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  x: Twitter,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  email: Mail,
  phone: Phone,
  tiktok: MessageCircle,
  whatsapp: MessageCircle,
  website: Globe,
  github: Globe,
};

export default function SocialLinks({
  className,
  showLabels = true,
  showIcons = true,
  iconSize = "md",
  maxItems = 10,
}: Props): JSX.Element | null {
  const socials = getSocialLinks(); // already sorted by priority in your config/site.ts
  const display = Array.isArray(socials) ? socials.slice(0, maxItems) : [];

  if (!display.length) return null;

  const sizeClasses = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" } as const;

  return (
    <ul className={clsx("flex flex-wrap items-center gap-3", className)} role="list" aria-label="Social links">
      {display.map((social, i) => {
        const href = String(social?.href || "").trim();
        if (!href) return null;

        const kind = String(social?.kind || "website").toLowerCase();
        const Icon = iconMap[kind] || Globe;

        const external = isExternal(href);
        const utility = isUtility(href);

        const linkClasses = clsx(
          "inline-flex items-center gap-2",
          "text-zinc-400 hover:text-primary transition-colors",
          "hover:scale-[1.03] active:scale-[0.98]"
        );

        const content = (
          <>
            {showIcons ? <Icon className={clsx(sizeClasses[iconSize], "shrink-0")} /> : null}
            {showLabels ? (
              <span className="text-xs font-mono uppercase tracking-wider whitespace-nowrap">
                {social.label || kind}
              </span>
            ) : null}
          </>
        );

        // External links
        if (external && !utility) {
          return (
            <li key={`${kind}-${i}`}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClasses}
                aria-label={`${social.label || kind} (opens in new tab)`}
                title={social.label || kind}
              >
                {content}
              </a>
            </li>
          );
        }

        // Utility links (mailto/tel)
        if (utility) {
          return (
            <li key={`${kind}-${i}`}>
              <a href={href} className={linkClasses} aria-label={social.label || kind} title={social.label || kind}>
                {content}
              </a>
            </li>
          );
        }

        // Internal (rare)
        return (
          <li key={`${kind}-${i}`}>
            <Link href={href} className={linkClasses} aria-label={social.label || kind} title={social.label || kind}>
              {content}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function SocialLinksCompact({
  className,
  iconSize = "sm",
  maxItems = 6,
}: {
  className?: string;
  iconSize?: "sm" | "md";
  maxItems?: number;
}) {
  return <SocialLinks className={className} showLabels={false} showIcons iconSize={iconSize} maxItems={maxItems} />;
}