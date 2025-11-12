// components/SocialFollowStrip.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig, type SocialLink as ConfigLink } from "@/lib/siteConfig";

type SocialItem = Pick<ConfigLink, "href" | "label" | "icon" | "kind" | "external">;

type Props = {
  /** Light (default) = warm card; Dark = subtle glass on dark sections */
  variant?: "light" | "dark";
  className?: string;
  /** Optionally override/extend items (e.g., reorder or limit) */
  itemsOverride?: SocialItem[];
};

const isExternalHttp = (href: string) => /^https?:\/\//i.test(href);

// Be flexible with kinds coming from config; always fall back to a generic icon.
const ICONS: Partial<Record<NonNullable<SocialItem["kind"]>, string>> & Record<string, string> = {
  x: "/assets/images/social/x.svg",
  twitter: "/assets/images/social/x.svg",
  instagram: "/assets/images/social/instagram.svg",
  facebook: "/assets/images/social/facebook.svg",
  linkedin: "/assets/images/social/linkedin.svg",
  youtube: "/assets/images/social/youtube.svg",
  whatsapp: "/assets/images/social/whatsapp.svg",
  mail: "/assets/images/social/email.svg",
  email: "/assets/images/social/email.svg",
  phone: "/assets/images/social/phone.svg",
  tiktok: "/assets/images/social/tiktok.svg",
  website: "/assets/images/social/link.svg",
  link: "/assets/images/social/link.svg",
};

function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object") return Object.values(val as Record<string, T>).filter(Boolean) as T[];
  return [];
}

export default function SocialFollowStrip({
  variant = "light",
  className = "",
  itemsOverride,
}: Props) {
  // Robust: siteConfig.socialLinks may be array or object; normalise to array
  const raw = itemsOverride ?? (siteConfig as any).socialLinks;
  const items: SocialItem[] = toArray<SocialItem>(raw).filter((it) => !!it && typeof it.href === "string");

  const containerBg =
    variant === "dark"
      ? "from-black/60 to-[color:var(--color-on-secondary)/0.6] ring-white/10"
      : "from-white/90 to-warmWhite/90 ring-[color:var(--color-on-secondary)/0.1]";

  const textColor = variant === "dark" ? "text-cream" : "text-[color:var(--color-on-secondary)/0.8]";
  const chipBase =
    variant === "dark"
      ? "bg-white/10 text-cream ring-white/15 hover:bg-white/15"
      : "bg-softGold text-deepCharcoal ring-[color:var(--color-on-secondary)/0.2] hover:bg-forest hover:text-cream";

  return (
    <section className={`mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-12 ${className}`}>
      <div className={`rounded-2xl bg-gradient-to-br ${containerBg} backdrop-blur-md ring-2 shadow-2xl`}>
        <div className="flex flex-wrap items-center justify-between gap-6 px-8 py-6 sm:px-10 sm:py-8">
          <p className={`text-base sm:text-lg font-serif leading-relaxed ${textColor}`}>
            Join the conversation — follow <span className="font-semibold">{siteConfig.title}</span>
          </p>

          <nav aria-label="Social links">
            <ul className="flex items-center gap-4 sm:gap-6">
              {items.map((it) => {
                const href = it.href;
                const label =
                  it.label ||
                  (typeof it.kind === "string"
                    ? it.kind.charAt(0).toUpperCase() + it.kind.slice(1)
                    : "Social");
                const icon =
                  it.icon ||
                  (typeof it.kind === "string" && ICONS[it.kind]) ||
                  ICONS.link;

                const isUtility = href.startsWith("mailto:") || href.startsWith("tel:");
                const external = it.external ?? (isExternalHttp(href) && !isUtility);

                // Stronger a11y label: “Follow Abraham of London on TikTok”, etc.
                const aria =
                  it.kind === "mail" || it.kind === "email"
                    ? `Email ${siteConfig.title}`
                    : it.kind === "phone"
                    ? `Call ${siteConfig.title}`
                    : `Follow ${siteConfig.title} on ${label}`;

                const Chip = (
                  <span
                    className={`inline-flex items-center gap-2 sm:gap-3 rounded-full px-3 py-2 ring-1 transition-all duration-200 ${chipBase}`}
                  >
                    <Image
                      src={icon}
                      alt="" // decorative
                      aria-hidden="true"
                      width={22}
                      height={22}
                      className="inline-block"
                      loading="lazy"
                    />
                    <span className="hidden sm:inline text-sm font-serif">{label}</span>
                    <span className="sr-only sm:not-sr-only sm:hidden">{label}</span>
                  </span>
                );

                const key = `${it.kind ?? label}-${href}`;

                return (
                  <li key={key}>
                    {external ? (
                      <a
                        href={href}
                        aria-label={aria}
                        title={label}
                        className="group inline-flex items-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {Chip}
                      </a>
                    ) : isUtility ? (
                      <a href={href} aria-label={aria} title={label} className="group inline-flex items-center">
                        {Chip}
                      </a>
                    ) : (
                      <Link href={href} aria-label={aria} className="group inline-flex items-center" prefetch={false}>
                        {Chip}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </section>
  );
}
