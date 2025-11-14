// components/SocialFollowStrip.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import clsx from "clsx";

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

/* ---------- Defaults ---------- */
const DEFAULT_ITEMS: SocialItem[] = [
  { href: "https://tiktok.com/@abrahamoflondon", label: "TikTok", kind: "tiktok" },
  { href: "https://x.com/AbrahamAda48634", label: "X", kind: "x" },
  { href: "https://www.instagram.com/abraham_of_london_/", label: "Instagram", kind: "instagram" },
  { href: "https://www.facebook.com/share/16tvsnTgRG/", label: "Facebook", kind: "facebook" },
  { href: "https://www.linkedin.com/in/abraham-adaramola-06630321/", label: "LinkedIn", kind: "linkedin" },
  { href: "https://www.youtube.com/@abrahamoflondon", label: "YouTube", kind: "youtube" },
  { href: "mailto:info@abrahamoflondon.org", label: "Email", kind: "mail" },
  { href: "tel:+442086225909", label: "Call", kind: "phone" },
  // { href: "https://wa.me/447496334022", label: "WhatsApp", kind: "whatsapp" },
];

/* ---------- Brand colours ---------- */
const BRAND_HEX: Record<NonNullable<SocialItem["kind"]>, string> = {
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

const isExternal = (href: string) => /^https?:\/\//i.test(href);
const isUtility = (href: string) =>
  href.startsWith("mailto:") || href.startsWith("tel:");

/* ---------- Icon primitives ---------- */
type IconProps = {
  title?: string;
  size?: number;
  color?: string;
} & React.SVGProps<SVGSVGElement>;

function withA11yProps({ title, size = 20, ...rest }: IconProps) {
  const aria = title
    ? { role: "img", "aria-label": title }
    : { "aria-hidden": true };
  return { width: size, height: size, ...aria, ...rest };
}

/* Use currentColor + inline styles so external CSS can't nullify fills */
const svgStyle = (color?: string) => ({ color } as React.CSSProperties);
const fillCC = { fill: "currentColor" } as React.CSSProperties;
const strokeCC = { stroke: "currentColor" } as React.CSSProperties;

/* ---------- Icons ---------- */
export function XIcon(props: IconProps) {
  const color = props.color ?? "#000000";
  return (
    <svg
      {...withA11yProps(props)}
      viewBox="0 0 24 24"
      style={svgStyle(color)}
      fill="none"
    >
      <path d="M4 4l16 16M20 4L4 20" style={strokeCC} strokeWidth="2" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  const color = props.color ?? "#010101";
  return (
    <svg
      {...withA11yProps(props)}
      viewBox="0 0 24 24"
      style={svgStyle(color)}
    >
      <path
        style={fillCC}
        d="M12 3h1.1v5.2c1 .8 2.3 1.4 3.9 1.5V12c-1.9-.1-3.3-.7-4.5-1.6v5.8a4.5 4.5 0 1 1-1.5-3.3V3zM9.2 14.8a3.3 3.3 0 1 0 3.3 3.3 3.3 3.3 0 0 0-3.3-3.3z"
      />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  const color = props.color ?? "#E4405F";
  return (
    <svg
      {...withA11yProps(props)}
      viewBox="0 0 24 24"
      style={svgStyle(color)}
    >
      <path
        style={fillCC}
        d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm7-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
      />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  const color = props.color ?? "#1877F2";
  return (
    <svg
      {...withA11yProps(props)}
      viewBox="0 0 24 24"
      style={svgStyle(color)}
    >
      <path
        style={fillCC}
        d="M13.5 22v-8h2.7l.4-3h-3.1V8.4c0-.9.3-1.5 1.6-1.5h1.6V4.1C16.4 4 15.5 4 14.5 4c-2.5 0-4.2 1.5-4.2 4.1V11H7.5v3h2.8v8h3.2z"
      />
    </svg>
  );
}

export function LinkedInIcon(props: IconProps) {
  const color = props.color ?? "#0A66C2";
  return (
    <svg
      {...withA11yProps(props)}
      viewBox="0 0 24 24"
      style={svgStyle(color)}
    >
      <path
        style={fillCC}
        d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4v15h-4V8zm7 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-5.8c0-1.38-.02-3.14-1.92-3.14-1.92 0-2.22 1.5-2.22 3.04V23h-4V8z"
      />
    </svg>
  );
}

export function YouTubeIcon(props: IconProps) {
  const color = props.color ?? "#FF0000";
  return (
    <svg
      {...withA11yProps(props)}
      viewBox="0 0 24 24"
      style={svgStyle(color)}
    >
      <path
        style={fillCC}
        d="M22.5 12c0-2.1-.2-3.5-.5-4.4a3 3 0 0 0-1.7-1.7C19.4 5.5 12 5.5 12 5.5s-7.4 0-8.3.4a3 3 0 0 0-1.7 1.7C1.7 8.5 1.5 9.9 1.5 12s.2 3.5.5 4.4a3 3 0 0 0 1.7 1.7c.9.4 8.3.4 8.3.4s7.4 0 8.3-.4a3 3 0 0 0 1.7-1.7c.3-.9.5-2.3.5-4.4z"
      />
      <path d="M10 15l5.2-3L10 9v6z" fill="#fff" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  const color = props.color ?? "#EA4335";
  return (
    <svg
      {...withA11yProps(props)}
      viewBox="0 0 24 24"
      style={svgStyle(color)}
      fill="none"
    >
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        style={strokeCC}
        strokeWidth="1.8"
      />
      <path d="M21 8l-9 6-9-6" style={strokeCC} strokeWidth="1.8" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  const color = props.color ?? "#16A34A";
  return (
    <svg
      {...withA11yProps(props)}
      viewBox="0 0 24 24"
      style={svgStyle(color)}
    >
      <path
        style={fillCC}
        d="M22 16.9v3a2 2 0 0 1-2.2 2 19.9 19.9 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.9 19.9 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"
      />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  const color = props.color ?? "#25D366";
  return (
    <svg
      {...withA11yProps(props)}
      viewBox="0 0 24 24"
      style={svgStyle(color)}
    >
      <path
        style={fillCC}
        d="M12.04 2a9.9 9.9 0 0 0-8.5 15.1L2 22l5.1-1.5A9.9 9.9 0 1 0 12.04 2zm0 2a7.9 7.9 0 0 1 0 15.8c-1.3 0-2.5-.3-3.6-.8l-.3-.1-3 .9.9-3.1-.1-.3A7.9 7.9 0 0 1 12.04 4zm-3.1 3.6c-.2 0-.5.1-.6.4-.2.3-.6 1-.6 1.8 0 .8.5 1.6.6 1.8.1.2 1.2 1.9 3 2.6 1.8.7 2.1.6 2.4.6.3 0 1.1-.5 1.2-1 .1-.5.1-.9 0-1-.1-.1-.2-.2-.5-.4-.3-.2-1.1-.6-1.3-.6-.2 0-.3 0-.5.3-.2.3-.6.9-.7 1-.1.1-.2.2-.4.1-.2-.1-.9-.3-1.7-1.1-.6-.6-1-1.3-1.1-1.5-.1-.2 0-.3.1-.4.1-.1.3-.3.4-.5.1-.2.2-.3.2-.5 0-.2-.5-1.3-.7-1.7-.2-.4-.4-.4-.6-.4z"
      />
    </svg>
  );
}

export function DefaultLinkIcon(props: IconProps) {
  const color = props.color ?? "#1F2937";
  return (
    <svg
      {...withA11yProps(props)}
      viewBox="0 0 24 24"
      style={svgStyle(color)}
      fill="none"
    >
      <path
        d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4"
        style={strokeCC}
        strokeWidth="1.8"
      />
      <path
        d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 20"
        style={strokeCC}
        strokeWidth="1.8"
      />
    </svg>
  );
}

/* ---------- Icon map ---------- */
const ICONS: Record<
  NonNullable<SocialItem["kind"]>,
  (p: IconProps) => React.ReactElement
> = {
  tiktok: TikTokIcon,
  x: XIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
  mail: MailIcon,
  phone: PhoneIcon,
  whatsapp: WhatsAppIcon,
};

/* ---------- Component ---------- */
export default function SocialFollowStrip({
  variant = "light",
  className = "",
  itemsOverride,
}: Props): JSX.Element {
  const items = (itemsOverride?.length ? itemsOverride : DEFAULT_ITEMS).filter(
    (it): it is SocialItem => Boolean(it)
  );

  const panel = clsx(
    "rounded-2xl ring-1 shadow-xl",
    variant === "dark"
      ? "bg-deepCharcoal ring-white/10"
      : "bg-white ring-lightGrey"
  );

  const pill = clsx(
    "inline-flex items-center gap-2 rounded-full border px-3 py-2 transition-colors",
    variant === "dark"
      ? "border-white/15 bg-white/5 text-cream hover:bg-white/10"
      : "border-lightGrey bg-white text-deepCharcoal hover:bg-warmWhite"
  );

  return (
    <section
      className={clsx(
        "mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-12",
        className
      )}
    >
      <div className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-6 px-8 py-6 sm:px-10 sm:py-8">
          <p
            className={clsx(
              "font-serif leading-relaxed",
              variant === "dark"
                ? "text-[color:var(--color-on-primary)/0.85]"
                : "text-[color:var(--color-on-secondary)/0.8]",
              "text-base sm:text-lg"
            )}
          >
            Join the conversation — follow{" "}
            <span
              className={clsx(
                "font-semibold",
                variant === "dark" ? "text-cream" : "text-deepCharcoal"
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
              const IconComp = (kind && ICONS[kind]) || DefaultLinkIcon;
              const color =
                (kind && BRAND_HEX[kind]) || "#1F2937";

              const content = (
                <span className={pill}>
                  <IconComp size={20} color={color} />
                  <span className="text-sm font-serif">{label}</span>
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