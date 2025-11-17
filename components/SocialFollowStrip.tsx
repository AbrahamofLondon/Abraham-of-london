// components/SocialFollowStrip.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/upgraded-component";

/* ---------- Types ---------- */
type Variant = "light" | "dark";

export type SocialItem = {
  href: string;
  label: string;
  kind?:
    | "tiktok"
    | "x"
    | "instagram"
    | "facebook"
    | "linkedin"
    | "youtube"
    | "mail"
    | "phone"
    | "whatsapp";
};

type Props = {
  variant?: Variant;
  className?: string;
  itemsOverride?: SocialItem[];
};

/* ---------- Defaults (your real accounts) ---------- */
const DEFAULT_ITEMS: SocialItem[] = [
  {
    href: "https://tiktok.com/@abrahamoflondon",
    label: "TikTok",
    kind: "tiktok",
  },
  {
    href: "https://x.com/AbrahamAda48634",
    label: "X",
    kind: "x",
  },
  {
    href: "https://www.instagram.com/abraham_of_london_/",
    label: "Instagram",
    kind: "instagram",
  },
  {
    href: "https://www.facebook.com/share/16tvsnTgRG/",
    label: "Facebook",
    kind: "facebook",
  },
  {
    href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    label: "LinkedIn",
    kind: "linkedin",
  },
  {
    href: "https://www.youtube.com/@abrahamoflondon",
    label: "YouTube",
    kind: "youtube",
  },
  {
    href: "mailto:info@abrahamoflondon.org",
    label: "Email",
    kind: "mail",
  },
  {
    href: "tel:+442086225909",
    label: "Landline",
    kind: "phone",
  },
  {
    href: "https://wa.me/447496334022",
    label: "WhatsApp",
    kind: "whatsapp",
  },
];

/* ---------- Asset-based icons ---------- */
/**
 * Map each social "kind" to its SVG asset under public/assets/images/social/svg.
 * Adjust filenames here if your actual files differ.
 */
type IconKind = NonNullable<SocialItem["kind"]>;

const ICON_SOURCES: Record<IconKind, string> = {
  tiktok: "/assets/images/social/tiktok.svg",
  x: "/assets/images/social/x.svg",
  instagram: "/assets/images/social/instagram.svg",
  facebook: "/assets/images/social/facebook.svg",
  linkedin: "/assets/images/social/linkedin.svg",
  youtube: "/assets/images/social/youtube.svg",
  mail: "/assets/images/social/mail.svg",
  phone: "/assets/images/social/phone.svg",
  whatsapp: "/assets/images/social/whatsapp.svg",
};

/**
 * Optional brand colour accent per platform.
 * Used only to lightly tint text/borders – icons themselves are the SVG art.
 */
const BRAND_HEX: Partial<Record<IconKind, string>> = {
  tiktok: "#010101",
  x: "#000000",
  instagram: "#E4405F",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  mail: "#EA4335",
  phone: "#16A34A",
  whatsapp: "#25D366",
};

/* ---------- Helpers ---------- */

const isExternal = (href: string) => /^https?:\/\//i.test(href);
const isUtility = (href: string) =>
  href.startsWith("mailto:") || href.startsWith("tel:");

/**
 * Solid flat icon renderer drawing directly from your SVG assets.
 */
function SocialIcon({
  kind,
  label,
}: {
  kind: IconKind;
  label: string;
}): JSX.Element {
  const src = ICON_SOURCES[kind];

  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center overflow-hidden">
      <Image
        src={src}
        alt={label}
        fill
        sizes="20px"
        className="object-contain"
      />
    </span>
  );
}

/**
 * Very simple fallback icon if "kind" is missing or misconfigured.
 * Keeps everything build-safe.
 */
function DefaultLinkIcon({ label }: { label: string }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-[10px] font-semibold text-white"
    >
      {label.charAt(0).toUpperCase()}
    </span>
  );
}

/* ---------- Component ---------- */
export default function SocialFollowStrip({
  variant = "light",
  className,
  itemsOverride,
}: Props): JSX.Element {
  const items = (itemsOverride?.length ? itemsOverride : DEFAULT_ITEMS).filter(
    (it): it is SocialItem => Boolean(it),
  );

  const panel = cn(
    "rounded-2xl ring-1 shadow-xl",
    variant === "dark"
      ? "bg-deepCharcoal ring-white/10"
      : "bg-white ring-lightGrey",
  );

  const pillBase =
    "inline-flex items-center gap-2 rounded-full border px-3 py-2 transition-colors";

  const pill =
    variant === "dark"
      ? cn(
          pillBase,
          "border-white/15 bg-white/5 text-cream hover:bg-white/10",
        )
      : cn(
          pillBase,
          "border-lightGrey bg-white text-deepCharcoal hover:bg-warmWhite",
        );

  return (
    <section
      className={cn(
        "mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-12",
        className,
      )}
    >
      <div className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-6 px-8 py-6 sm:px-10 sm:py-8">
          <p
            className={cn(
              "font-serif leading-relaxed text-base sm:text-lg",
              variant === "dark"
                ? "text-[color:var(--color-on-primary)/0.85]"
                : "text-[color:var(--color-on-secondary)/0.8]",
            )}
          >
            Join the conversation — follow{" "}
            <span
              className={cn(
                "font-semibold",
                variant === "dark" ? "text-cream" : "text-deepCharcoal",
              )}
            >
              Abraham of London
            </span>
          </p>

          <nav
            aria-label="Social links"
            className="flex flex-wrap items-center gap-3 sm:gap-4"
          >
            {items.map(({ href, label, kind }) => {
              const iconKind = kind as IconKind | undefined;
              const accentColor =
                (iconKind && BRAND_HEX[iconKind]) || undefined;

              const IconNode = iconKind ? (
                <SocialIcon kind={iconKind} label={label} />
              ) : (
                <DefaultLinkIcon label={label} />
              );

              const content = (
                <span
                  className={pill}
                  style={
                    accentColor
                      ? {
                          // lightly tint text to brand colour while icon stays pure asset
                          color: accentColor,
                        }
                      : undefined
                  }
                >
                  {IconNode}
                  <span className="text-sm font-serif text-current">
                    {label}
                  </span>
                </span>
              );

              const external = isExternal(href);

              if (external || isUtility(href)) {
                return (
                  <a
                    key={`${label}-${href}`}
                    href={href}
                    className="group inline-flex items-center"
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link
                  key={`${label}-${href}`}
                  href={href}
                  className="group inline-flex items-center"
                  prefetch={false}
                >
                  {content}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </section>
  );
}