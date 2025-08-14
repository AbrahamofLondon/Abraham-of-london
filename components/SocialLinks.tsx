/* eslint-disable @next/next/no-img-element */
// components/SocialLinks.tsx
import Link from "next/link";
import * as React from "react";

type IconType = string | React.ReactNode;

export interface SocialLinkItem {
  href: string;
  label: string;
  icon: IconType; // string path to SVG in /public or a ReactNode
  external?: boolean;
  rel?: string;
  className?: string;
  id?: string;
}

interface SocialLinksProps {
  links: SocialLinkItem[];
  size?: number;
  className?: string;
  variant?: "ghost" | "solid";
  enrichExternalWithUtm?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function isHttp(href: string) {
  return /^https?:\/\//i.test(href);
}

function isMail(href: string) {
  return href.startsWith("mailto:");
}

function isTel(href: string) {
  return href.startsWith("tel:");
}

function ensureHttps(u: string) {
  try {
    if (isMail(u) || isTel(u) || u.startsWith("#")) return u;
    if (/^https?:\/\//i.test(u)) return u;
    return `https://${u.replace(/^\/+/, "")}`;
  } catch {
    return u;
  }
}

function withUtm(
  u: string,
  source = "abraham-site",
  medium = "social",
  campaign = "global",
) {
  try {
    const url = new URL(u);
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", medium);
    url.searchParams.set("utm_campaign", campaign);
    return url.toString();
  } catch {
    return u;
  }
}

function getGtag(): ((...args: any[]) => void) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as any;
  return typeof w.gtag === "function" ? w.gtag : undefined;
}

function trackSocialClick(label: string, href: string) {
  const gtag = getGtag();
  if (gtag) {
    gtag("event", "select_content", {
      content_type: "social_link",
      item_id: label,
      destination: href,
    });
  }
}

export default function SocialLinks({
  links,
  size = 18,
  className,
  variant = "ghost",
  enrichExternalWithUtm = false,
  utmSource = "abraham-site",
  utmMedium = "social",
  utmCampaign = "global",
}: SocialLinksProps) {
  const baseBtn =
    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-deepCharcoal transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const ghost =
    "border border-lightGrey hover:bg-warmWhite focus:ring-deepCharcoal/30";
  const solid =
    "bg-deepCharcoal text-warmWhite hover:opacity-90 focus:ring-deepCharcoal/40";

  if (!Array.isArray(links) || links.length === 0) return null;

  return (
    <nav
      aria-label="Social links"
      className={cn("flex flex-wrap gap-3", className)}
    >
      {links.map((item) => {
        // Normalize href and external flags
        let href = item.href.trim();
        const externalAuto = isHttp(href);
        const mail = isMail(href);
        const tel = isTel(href);
        const isExternal = item.external ?? externalAuto;
        const openNewTab = isExternal && !mail && !tel;

        if (isExternal && isHttp(href)) {
          href = ensureHttps(href);
          if (enrichExternalWithUtm) {
            href = withUtm(href, utmSource, utmMedium, utmCampaign);
          }
        }

        const rel = openNewTab
          ? cn("noopener", "noreferrer", "external", item.rel)
          : item.rel;
        const aria = openNewTab
          ? `${item.label} ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â opens in new tab`
          : item.label;
        const classes = cn(
          baseBtn,
          variant === "ghost" ? ghost : solid,
          item.className,
        );
        const key = item.id ?? `${item.href}-${item.label}`;

        // Icon handling: use <img> for string SVGs; ReactNode otherwise
        const iconNode =
          typeof item.icon === "string" ? (
            <img
              src={item.icon}
              alt=""
              width={size}
              height={size}
              aria-hidden="true"
              loading="lazy"
            />
          ) : (
            <span aria-hidden="true">{item.icon}</span>
          );

        const content = (
          <>
            {iconNode}
            <span>{item.label}</span>
          </>
        );

        // External HTTP(S)
        if (openNewTab) {
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel={rel || "noopener noreferrer external"}
              aria-label={aria}
              className={classes}
              referrerPolicy="no-referrer-when-downgrade"
              onClick={() => trackSocialClick(item.label, href)}
            >
              {content}
            </a>
          );
        }

        // mailto/tel/inline http without new tab
        if (isHttp(href) || mail || tel) {
          return (
            <a
              key={key}
              href={href}
              rel={rel || undefined}
              aria-label={aria}
              className={classes}
              onClick={() => trackSocialClick(item.label, href)}
            >
              {content}
            </a>
          );
        }

        // Internal link
        return (
          <Link
            key={key}
            href={href}
            prefetch={false}
            aria-label={aria}
            className={classes}
            onClick={() => trackSocialClick(item.label, href)}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}



