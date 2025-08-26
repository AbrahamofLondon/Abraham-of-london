"use client";

import * as React from "react";
import Link from "next/link";
import clsx from "clsx";

/* ---------- Types ---------- */
type Variant = "light" | "dark";
type Props = {
  variant?: Variant;
  className?: string;
  itemsOverride?: SocialItem[];
};

export type SocialItem = {
  href: string;
  label: string;
  kind?: "x" | "instagram" | "facebook" | "linkedin" | "youtube" | "mail" | "phone" | "whatsapp";
};

/* ---------- Links (defaults) ---------- */
const DEFAULT_ITEMS: SocialItem[] = [
  { href: "https://x.com/AbrahamAda48634", label: "X", kind: "x" },
  { href: "https://www.instagram.com/abraham_of_london_/", label: "Instagram", kind: "instagram" },
  { href: "https://www.facebook.com/share/16tvsnTgRG/", label: "Facebook", kind: "facebook" },
  { href: "https://www.linkedin.com/in/abraham-adaramola-06630321/", label: "LinkedIn", kind: "linkedin" },
  { href: "https://www.youtube.com/@abrahamoflondon", label: "YouTube", kind: "youtube" },
  { href: "mailto:info@abrahamoflondon.org", label: "Email", kind: "mail" },
  { href: "tel:+442086225909", label: "Call", kind: "phone" },
  // { href: "https://wa.me/447496334022", label: "WhatsApp", kind: "whatsapp" },
];

/* ---------- Local icon paths (under /public) ---------- */
const ICON_SRC: Record<NonNullable<SocialItem["kind"]>, string> = {
  x:         "/assets/images/social/x.svg",
  instagram: "/assets/images/social/instagram.svg",
  facebook:  "/assets/images/social/facebook.svg",
  linkedin:  "/assets/images/social/linkedin.svg",
  youtube:   "/assets/images/social/youtube.svg",   // add this file (see below)
  mail:      "/assets/images/social/mail.svg",
  phone:     "/assets/images/social/phone.svg",
  whatsapp:  "/assets/images/social/whatsapp.svg",
};

/* ---------- Simple, flat brand colours for inline fallback ---------- */
const BRAND_HEX: Record<NonNullable<SocialItem["kind"]>, string> = {
  x: "#000000",
  instagram: "#E4405F",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  mail: "#EA4335",
  phone: "#16A34A",
  whatsapp: "#25D366",
};

const isExternal = (href: string) => /^https?:\/\//i.test(href);
const isUtility = (href: string) => href.startsWith("mailto:") || href.startsWith("tel:");

export default function SocialFollowStrip({ className = "", itemsOverride }: Props) {
  const items = (itemsOverride?.length ? itemsOverride : DEFAULT_ITEMS).filter(Boolean);

  return (
    <section className={clsx("mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-12", className)}>
      {/* Solid white panel */}
      <div className="rounded-2xl bg-white ring-1 ring-lightGrey shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-6 px-8 py-6 sm:px-10 sm:py-8">
          <p className="text-base sm:text-lg font-serif leading-relaxed text-deepCharcoal/80">
            Join the conversation — follow{" "}
            <span className="font-semibold text-deepCharcoal">Abraham of London</span>
          </p>

          <nav aria-label="Social links" className="flex flex-wrap items-center gap-3 sm:gap-4">
            {items.map(({ href, label, kind }) => {
              const content = (
                <span
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full border border-lightGrey bg-white px-3 py-2",
                    "text-deepCharcoal hover:bg-warmWhite transition-colors"
                  )}
                >
                  <SolidIcon kind={kind} label={label} />
                  <span className="text-sm font-serif">{label}</span>
                </span>
              );

              const ext = isExternal(href);
              if (ext || isUtility(href)) {
                return (
                  <a
                    key={`${label}-${href}`}
                    href={href}
                    aria-label={label}
                    className="group inline-flex items-center"
                    target={ext ? "_blank" : undefined}
                    rel={ext ? "noopener noreferrer" : undefined}
                  >
                    {content}
                  </a>
                );
              }
              return (
                <Link
                  key={`${label}-${href}`}
                  href={href}
                  aria-label={label}
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

/* ---------- Icon that prefers your local asset, with inline fallback ---------- */

function SolidIcon({
  kind,
  label,
  size = 20,
}: {
  kind?: SocialItem["kind"];
  label: string;
  size?: number;
}) {
  const src = kind ? ICON_SRC[kind] : undefined;
  const [broken, setBroken] = React.useState(false);

  if (!src || broken) {
    // Inline fallback: a solid glyph in brand colour on transparent bg
    return <InlineGlyph kind={kind} size={size} title={label} />;
  }

  // Use native <img> so we can gracefully fall back if missing
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label}
      width={size}
      height={size}
      onError={() => setBroken(true)}
      style={{ display: "block" }}
    />
  );
}

function InlineGlyph({
  kind,
  size = 20,
  title,
}: {
  kind?: SocialItem["kind"];
  size?: number;
  title?: string;
}) {
  const color = (kind && BRAND_HEX[kind]) || "#1F2937";
  const common = { width: size, height: size, role: "img", "aria-label": title } as const;

  switch (kind) {
    case "x":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M4 4l16 16M20 4L4 20" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common} viewBox="0 0 24 24" fill={color}>
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm7-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
        </svg>
      );
    case "facebook":
      return (
        <svg {...common} viewBox="0 0 24 24" fill={color}>
          <path d="M13.5 22v-8h2.7l.4-3h-3.1V8.4c0-.9.3-1.5 1.6-1.5h1.6V4.1C16.4 4 15.5 4 14.5 4c-2.5 0-4.2 1.5-4.2 4.1V11H7.5v3h2.8v8h3.2z"/>
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common} viewBox="0 0 24 24" fill={color}>
          <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4v15h-4V8zm7 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-5.8c0-1.38-.02-3.14-1.92-3.14-1.92 0-2.22 1.5-2.22 3.04V23h-4V8z"/>
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} viewBox="0 0 24 24" fill={color}>
          <path d="M23 12c0-2.1-.2-3.5-.5-4.4-.3-.8-.9-1.5-1.7-1.7C19.9 5.5 12 5.5 12 5.5s-7.9 0-8.8.4c-.8.2-1.4.9-1.7 1.7C1.2 8.5 1 9.9 1 12s.2 3.5.5 4.4c.3.8.9 1.5 1.7 1.7.9.4 8.8.4 8.8.4s7.9 0 8.8-.4c.8-.2 1.4-.9 1.7-1.7.3-.9.5-2.3.5-4.4z"/>
          <path d="M10 15l5.2-3L10 9v6z" fill="#fff"/>
        </svg>
      );
    case "mail":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M21 8l-9 6-9-6" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common} viewBox="0 0 24 24" fill={color}>
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.9 19.9 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.9 19.9 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/>
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common} viewBox="0 0 24 24" fill={color}>
          <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15.1L2 22l5.1-1.5A9.9 9.9 0 1 0 12.04 2zm0 2a7.9 7.9 0 0 1 0 15.8c-1.3 0-2.5-.3-3.6-.8l-.3-.1-3 .9.9-3.1-.1-.3A7.9 7.9 0 0 1 12.04 4zm-3.1 3.6c-.2 0-.5.1-.6.4-.2.3-.6 1-.6 1.8 0 .8.5 1.6.6 1.8.1.2 1.2 1.9 3 2.6 1.8.7 2.1.6 2.4.6.3 0 1.1-.5 1.2-1 .1-.5.1-.9 0-1-.1-.1-.2-.2-.5-.4-.3-.2-1.1-.6-1.3-.6-.2 0-.3 0-.5.3-.2.3-.6.9-.7 1-.1.1-.2.2-.4.1-.2-.1-.9-.3-1.7-1.1-.6-.6-1-1.3-1.1-1.5-.1-.2 0-.3.1-.4.1-.1.3-.3.4-.5.1-.2.2-.3.2-.5 0-.2-.5-1.3-.7-1.7-.2-.4-.4-.4-.6-.4z"/>
        </svg>
      );
    default:
      return (
        <svg {...common} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
          <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4" />
          <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 20" />
        </svg>
      );
  }
}
