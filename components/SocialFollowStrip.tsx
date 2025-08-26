// components/SocialFollowStrip.tsx
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
  { href: "https://x.com/AbrahamAda48634", label: "X",           kind: "x" },
  { href: "https://www.instagram.com/abraham_of_london_/", label: "Instagram",  kind: "instagram" },
  { href: "https://www.facebook.com/share/16tvsnTgRG/", label: "Facebook",   kind: "facebook" },
  { href: "https://www.linkedin.com/in/abraham-adaramola-06630321/", label: "LinkedIn", kind: "linkedin" },
  { href: "https://www.youtube.com/@abrahamoflondon", label: "YouTube",    kind: "youtube" },
  { href: "mailto:info@abrahamoflondon.org",          label: "Email",      kind: "mail" },
  { href: "tel:+442086225909",                        label: "Call",       kind: "phone" },
  // { href: "https://wa.me/447496334022",               label: "WhatsApp",   kind: "whatsapp" },
];

/* ---------- Brand colors (solid) ---------- */
/* Picked for recognizability + contrast on white */
const BRAND_HEX: Record<NonNullable<SocialItem["kind"]>, string> = {
  x: "#000000",
  instagram: "#E4405F", // solid alternative to gradient
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  mail: "#EA4335",      // Gmail red; generic mail color
  phone: "#16A34A",     // Tailwind green-600
  whatsapp: "#25D366",
};

const isExternal = (href: string) => /^https?:\/\//i.test(href);
const isUtility = (href: string) => href.startsWith("mailto:") || href.startsWith("tel:");

export default function SocialFollowStrip({ variant = "light", className = "", itemsOverride }: Props) {
  const items = (itemsOverride?.length ? itemsOverride : DEFAULT_ITEMS).filter(Boolean);

  return (
    <section className={clsx("mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-12", className)}>
      {/* Solid white surface as requested */}
      <div className="rounded-2xl bg-white ring-1 ring-lightGrey shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-6 px-8 py-6 sm:px-10 sm:py-8">
          <p className={clsx("text-base sm:text-lg font-serif leading-relaxed", "text-deepCharcoal/80")}>
            Join the conversation — follow{" "}
            <span className="font-semibold text-deepCharcoal">Abraham of London</span>
          </p>

          <nav aria-label="Social links" className="flex flex-wrap items-center gap-3 sm:gap-4">
            {items.map(({ href, label, kind }) => {
              const bg = (kind && BRAND_HEX[kind]) || "#1F2937"; // fallback: gray-800
              const pill = (
                <span
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-3 py-2",
                    "text-white shadow-lg ring-1 ring-black/5",
                    "transition-all duration-200 hover:brightness-90"
                  )}
                  style={{ backgroundColor: bg }}
                >
                  <Icon kind={kind} aria-hidden="true" />
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
                    {pill}
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
                  {pill}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Icons (inherit currentColor -> white) ---------------- */

function Icon({ kind, ...props }: { kind?: SocialItem["kind"] } & React.SVGProps<SVGSVGElement>) {
  switch (kind) {
    case "x":         return <XIcon {...props} />;
    case "instagram": return <InstagramIcon {...props} />;
    case "facebook":  return <FacebookIcon {...props} />;
    case "linkedin":  return <LinkedInIcon {...props} />;
    case "youtube":   return <YouTubeIcon {...props} />;
    case "mail":      return <MailIcon {...props} />;
    case "phone":     return <PhoneIcon {...props} />;
    case "whatsapp":  return <WhatsAppIcon {...props} />;
    default:          return <LinkIcon {...props} />;
  }
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" {...props}>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm7-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
    </svg>
  );
}
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" {...props}>
      <path d="M13.5 22v-8h2.7l.4-3h-3.1V8.4c0-.9.3-1.5 1.6-1.5h1.6V4.1C16.4 4 15.5 4 14.5 4c-2.5 0-4.2 1.5-4.2 4.1V11H7.5v3h2.8v8h3.2z"/>
    </svg>
  );
}
function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" {...props}>
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4v15h-4V8zm7 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-5.8c0-1.38-.02-3.14-1.92-3.14-1.92 0-2.22 1.5-2.22 3.04V23h-4V8z"/>
    </svg>
  );
}
function YouTubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" {...props}>
      <path d="M10 15l5.2-3L10 9v6z" />
      <path d="M23 12c0-2.1-.2-3.5-.5-4.4-.3-.8-.9-1.5-1.7-1.7C19.9 5.5 12 5.5 12 5.5s-7.9 0-8.8.4c-.8.2-1.4.9-1.7 1.7C1.2 8.5 1 9.9 1 12s.2 3.5.5 4.4c.3.8.9 1.5 1.7 1.7.9.4 8.8.4 8.8.4s7.9 0 8.8-.4c.8-.2 1.4-.9 1.7-1.7.3-.9.5-2.3.5-4.4z" />
    </svg>
  );
}
function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>
      <path d="M22 8l-10 6L2 8"/>
    </svg>
  );
}
function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" {...props}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.9 19.9 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.9 19.9 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/>
    </svg>
  );
}
function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" {...props}>
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15.1L2 22l5.1-1.5A9.9 9.9 0 1 0 12.04 2zm0 2a7.9 7.9 0 0 1 0 15.8c-1.3 0-2.5-.3-3.6-.8l-.3-.1-3 .9.9-3.1-.1-.3A7.9 7.9 0 0 1 12.04 4zm-3.1 3.6c-.2 0-.5.1-.6.4-.2.3-.6 1-.6 1.8 0 .8.5 1.6.6 1.8.1.2 1.2 1.9 3 2.6 1.8.7 2.1.6 2.4.6.3 0 1.1-.5 1.2-1 .1-.5.1-.9 0-1-.1-.1-.2-.2-.5-.4-.3-.2-1.1-.6-1.3-.6-.2 0-.3 0-.5.3-.2.3-.6.9-.7 1-.1.1-.2.2-.4.1-.2-.1-.9-.3-1.7-1.1-.6-.6-1-1.3-1.1-1.5-.1-.2 0-.3.1-.4.1-.1.3-.3.4-.5.1-.2.2-.3.2-.5 0-.2-.5-1.3-.7-1.7-.2-.4-.4-.4-.6-.4z"/>
    </svg>
  );
}
function LinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 20" />
    </svg>
  );
}
