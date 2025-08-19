/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import * as React from "react";

type IconType = string | React.ReactNode;

export interface SocialLinkItem {
  href: string;
  label: string;
  icon: IconType;            // string path to /public asset or a ReactNode
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

const isHttp  = (href: string) => /^https?:\/\//i.test(href);
const isProto = (href: string) => /^\/\//.test(href);
const isMail  = (href: string) => href.startsWith("mailto:");
const isTel   = (href: string) => href.startsWith("tel:");
const isHash  = (href: string) => href.startsWith("#");

function ensureHttps(u: string) {
  try {
    if (isMail(u) || isTel(u) || isHash(u)) return u;
    if (isHttp(u)) return u;
    if (isProto(u)) return `https:${u}`;
    // treat bare domains as https
    return `https://${u.replace(/^\/+/, "")}`;
  } catch {
    return u;
  }
}

function withUtm(u: string, source = "abraham-site", medium = "social", campaign = "global") {
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
  if (!gtag) return;
  try {
    gtag("event", "select_content", {
      content_type: "social_link",
      item_id: label,
      destination: href,
    });
  } catch { /* no-op */ }
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
  if (!Array.isArray(links) || links.length === 0) return null;

  const baseBtn =
    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent";
  const ghost =
    "border text-deepCharcoal border-lightGrey/70 bg-white/70 hover:bg-white " +
    "dark:text-cream dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20 " +
    "focus:ring-forest/40 dark:focus:ring-cream/30";
  const solid =
    "bg-forest text-cream hover:bg-emerald-700 " +
    "dark:bg-cream dark:text-deepCharcoal dark:hover:bg-cream/90 " +
    "focus:ring-deepCharcoal/40 dark:focus:ring-forest/40";

  return (
    <nav aria-label="Social links" className={cn("flex flex-wrap gap-3", className)}>
      {links.map((item) => {
        let href = item.href.trim();
        const mail = isMail(href);
        const tel  = isTel(href);
        const externalAuto = isHttp(href) || isProto(href);
        const isExternal = item.external ?? externalAuto;
        const openNewTab = isExternal && !mail && !tel && !isHash(href);

        if (isExternal && (isHttp(href) || isProto(href))) {
          href = ensureHttps(href);
          if (enrichExternalWithUtm) {
            href = withUtm(href, utmSource, utmMedium, utmCampaign);
          }
        }

        const rel = openNewTab
          ? cn("noopener", "noreferrer", "external", item.rel)
          : item.rel;

        const aria =
          openNewTab ? `${item.label} (opens in a new tab)` : item.label;

        const classes = cn(baseBtn, variant === "ghost" ? ghost : solid, item.className);
        const key = item.id ?? `${item.href}-${item.label}`;

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

        // External (new tab)
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

        // Same-tab anchors, mailto, tel, or same-origin http
        if (isHttp(href) || mail || tel || isHash(href)) {
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

        // Internal routes → Next Link
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
