// components/Footer.tsx
import React from "react";
import Link from "next/link";

const AOF_URL =
  process.env.NEXT_PUBLIC_AOF_URL || "https://abrahamoflondon.org";
const INNOVATE_HUB_URL =
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL ||
  process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL ||
  "https://innovatehub.abrahamoflondon.org";
const ALOMARADA_URL =
  process.env.NEXT_PUBLIC_ALOMARADA_URL || "https://alomarada.com";
const ENDURELUXE_URL =
  process.env.NEXT_PUBLIC_ENDURELUXE_URL || "https://endureluxe.com";
const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@abrahamoflondon.org";

const isExternal = (href: string) =>
  /^https?:\/\//i.test(href) || href.startsWith("mailto:");

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
      <div className="container mx-auto max-w-7xl px-4 py-10 text-center">
        {/* Primary site links */}
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-deepCharcoal"
        >
          <SmartLink href="/about">About</SmartLink>
          <SmartLink href="/ventures">Ventures</SmartLink>
          <SmartLink href="/contact">Contact</SmartLink>
          <SmartLink href="/privacy">Privacy</SmartLink>
          <SmartLink href="/terms">Terms</SmartLink>
          <SmartLink href={`mailto:${CONTACT_EMAIL}`}>Email</SmartLink>
        </nav>

        {/* Brand family */}
        <nav
          aria-label="Brand family"
          className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-3 text-deepCharcoal/90"
        >
          <SmartLink href={AOF_URL}>Abraham of London</SmartLink>
          <SmartLink href={INNOVATE_HUB_URL}>InnovateHub</SmartLink>
          <SmartLink href={ALOMARADA_URL}>Alomarada</SmartLink>
          <SmartLink href={ENDURELUXE_URL}>Endureluxe</SmartLink>
        </nav>

        <p className="mt-6 text-sm text-deepCharcoal/60">
          © {year}{" "}
          <a
            href={AOF_URL}
            className="underline decoration-forest/30 hover:decoration-forest"
          >
            Abraham of London
          </a>
          . All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;






