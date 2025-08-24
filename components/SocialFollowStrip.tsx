// components/SocialFollowStrip.tsx
import Link from "next/link";
import * as React from "react";

type Props = { variant?: "light" | "dark" };

type Item = {
  href: string;
  label: string;
  external?: boolean; // auto-set for http(s)
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const items: Item[] = [
  { href: "https://twitter.com/abrahamoflondon", label: "Twitter",   Icon: XIcon,        external: true },
  { href: "https://www.facebook.com/share/p/156tQWm2mZ/", label: "Facebook", Icon: FacebookIcon, external: true },
  { href: "https://www.linkedin.com/in/abrahamoflondon", label: "LinkedIn", Icon: LinkedInIcon, external: true },
  { href: "https://instagram.com/abrahamoflondon", label: "Instagram", Icon: InstagramIcon, external: true },
  { href: "mailto:info@abrahamoflondon.org", label: "Email", Icon: MailIcon },
  { href: "tel:+442086225909", label: "Call", Icon: PhoneIcon },
];

export default function SocialFollowStrip({ variant = "light" }: Props) {
  const surface =
    variant === "dark"
      ? "from-black/40 to-black/20 ring-white/10"
      : "from-white/90 to-warmWhite/90 ring-deepCharcoal/10";
  const text = variant === "dark" ? "text-cream/85" : "text-deepCharcoal/80";
  const brand = variant === "dark" ? "text-cream" : "text-deepCharcoal";
  const btn =
    variant === "dark"
      ? "bg-white/10 text-cream ring-white/20 hover:bg-white/20"
      : "bg-softGold text-deepCharcoal ring-deepCharcoal/20 hover:bg-forest hover:text-cream";

  return (
    <section className="mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-12">
      <div className={rounded-2xl bg-gradient-to-br ${surface} backdrop-blur-md ring-2 shadow-2xl}>
        <div className="flex flex-wrap items-center justify-between gap-6 px-8 py-6 sm:px-10 sm:py-8">
          <p className={text-base sm:text-lg font-serif leading-relaxed ${text}}>
            Join the conversation — follow{" "}
            <span className={font-semibold ${brand}}>Abraham of London</span>
          </p>

          <nav aria-label="Social links" className="flex flex-wrap items-center gap-3 sm:gap-4">
            {items.map(({ href, label, external, Icon }) => {
              const content = (
                <span
                  className={inline-flex items-center gap-2 rounded-full px-3 py-2 shadow-lg ring-1 transition-all duration-300 ${btn}}
                >
                  {/* SVG inherits currentColor so it works in light/dark */}
                  <Icon width={20} height={20} aria-hidden="true" />
                  <span className="text-sm font-serif">{label}</span>
                </span>
              );

              const isExternal = external ?? /^https?:\/\//i.test(href);
              if (isExternal || href.startsWith("mailto:") || href.startsWith("tel:")) {
                return (
                  <a
                    key={href}
                    href={href}
                    aria-label={label}
                    className="group inline-flex items-center"
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                  >
                    {content}
                  </a>
                );
              }
              return (
                <Link key={href} href={href} aria-label={label} className="group inline-flex items-center" prefetch={false}>
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

/* ---------- Inline icons (stroke=currentColor) ---------- */
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 3l18 18M21 3L3 21" />
    </svg>
  );
}
function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 22v-8h2.7l.4-3H13.5V8.4c0-.9.3-1.5 1.6-1.5h1.6V4.1C16.4 4 15.5 4 14.5 4c-2.5 0-4.2 1.5-4.2 4.1V11H7.5v3h2.8v8h3.2z"/>
    </svg>
  );
}
function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4V23h-4V8zm7 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-5.8c0-1.38-.02-3.14-1.92-3.14-1.92 0-2.22 1.5-2.22 3.04V23h-4V8z"/>
    </svg>
  );
}
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 7zm7-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
    </svg>
  );
}
function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>
      <path d="M22 8l-10 6L2 8"/>
    </svg>
  );
}
function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.9 19.9 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.9 19.9 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/>
    </svg>
  );
}