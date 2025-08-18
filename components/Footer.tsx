import React from "react";
import Link from "next/link";
import Image from "next/image";

const AOF_URL = process.env.NEXT_PUBLIC_AOF_URL || "https://abrahamoflondon.org";
const INNOVATE_HUB_URL =
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL ||
  process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL ||
  "https://innovatehub-abrahamoflondon.netlify.app";
const ALOMARADA_URL = process.env.NEXT_PUBLIC_ALOMARADA_URL || "https://alomarada.com";
const ENDURELUXE_URL = process.env.NEXT_PUBLIC_ENDURELUXE_URL || "https://endureluxe.com";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@abrahamoflondon.org";

const socials = [
  {
    href: "https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09",
    icon: "/assets/images/social/twitter.svg",
    label: "Twitter / X",
  },
  {
    href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    icon: "/assets/images/social/linkedin.svg",
    label: "LinkedIn",
  },
  {
    href: "https://www.instagram.com/abraham_of_london",
    icon: "/assets/images/social/instagram.svg",
    label: "Instagram",
  },
  {
    href: "https://youtube.com",
    icon: "/assets/images/social/youtube.svg",
    label: "YouTube",
  },
];

const isExternal = (href: string) => /^https?:\/\//i.test(href) || href.startsWith("mailto:");

function SmartLink({
  href,
  children,
  className,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const base =
    className ||
    "hover:text-forest transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 rounded-sm";

  if (isExternal(href)) {
    const isHttp = href.startsWith("http");
    return (
      <a
        href={href}
        className={base}
        aria-label={ariaLabel}
        {...(isHttp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} prefetch={false} className={base} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-cream border-t border-black/10">
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-deepCharcoal">
          <SmartLink href="/about">About</SmartLink>
          <SmartLink href="/blog">Blog</SmartLink>
          <SmartLink href="/books">Books</SmartLink>
          <SmartLink href="/ventures">Ventures</SmartLink>
          <SmartLink href="/contact">Contact</SmartLink>
          <SmartLink href={`mailto:${CONTACT_EMAIL}`}>Email</SmartLink>
          <SmartLink href="/privacy">Privacy</SmartLink>
          <SmartLink href="/terms">Terms</SmartLink>
        </nav>

        <nav aria-label="Brand family" className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-3 text-deepCharcoal/90">
          <SmartLink href={AOF_URL}>Abraham of London</SmartLink>
          <SmartLink href={INNOVATE_HUB_URL}>InnovateHub</SmartLink>
          <SmartLink href={ALOMARADA_URL}>Alomarada</SmartLink>
          <SmartLink href={ENDURELUXE_URL}>Endureluxe</SmartLink>
        </nav>

        <div className="mt-6 flex justify-center gap-4">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
            >
              <Image src={s.icon} alt={s.label} width={24} height={24} loading="lazy" decoding="async" />
            </a>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-deepCharcoal/60">
          © {year}{" "}
          <a href={AOF_URL} className="underline decoration-forest/30 hover:decoration-forest">
            Abraham of London
          </a>
          . All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
