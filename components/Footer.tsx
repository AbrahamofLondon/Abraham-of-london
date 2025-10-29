import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";

// --- Configuration ---
const AOF_URL = process.env.NEXT_PUBLIC_AOF_URL || "https://abrahamoflondon.org";
const INNOVATE_HUB_URL =
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL ||
  process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL ||
  "https://innovatehub-abrahamoflondon.netlify.app";
const ALOMARADA_URL = process.env.NEXT_PUBLIC_ALOMARADA_URL || "https://alomarada.com";
const ENDURELUXE_URL = process.env.NEXT_PUBLIC_ENDURELUXE_URL || "https://endureluxe.com";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@abrahamoflondon.org";

const socials = [
  { href: "https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09", icon: "/assets/images/social/twitter.svg", label: "Twitter / X" },
  { href: "https://www.linkedin.com/in/abraham-adaramola-06630321/", icon: "/assets/images/social/linkedin.svg", label: "LinkedIn" },
  { href: "https://www.instagram.com/abraham_of_london", icon: "/assets/images/social/instagram.svg", label: "Instagram" },
  { href: "https://youtube.com", icon: "/assets/images/social/youtube.svg", label: "YouTube" },
];

const isExternal = (href: string) => /^https?:\/\//i.test(href) || href.startsWith("mailto:");

// --- SmartLink Component ---

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
  const baseClass = clsx(
    "text-sm font-medium transition-colors duration-200 py-1 px-2 -mx-2 rounded-md", 
    "hover:text-softGold dark:hover:text-softGold", 
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-softGold focus-visible:ring-opacity-50",
    className
  );

  if (isExternal(href)) {
    const isHttp = href.startsWith("http");
    return (
      <a
        href={href}
        className={baseClass}
        aria-label={ariaLabel}
        {...(isHttp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} prefetch={false} className={baseClass} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

// --- Footer Component ---

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-cream dark:bg-black border-t border-black/10 dark:border-white/10">
      <div className="container mx-auto max-w-7xl px-4 py-12 md:py-16">
        
        {/* --- 1. Primary Navigation --- */}
        <nav
          aria-label="Footer"
          className={clsx(
            "flex flex-wrap justify-center gap-x-8 gap-y-3",
            "text-deepCharcoal dark:text-cream"
          )}
        >
          <SmartLink href="/about">About</SmartLink>
          <SmartLink href="/blog">Insights</SmartLink>
          <SmartLink href="/books">Books</SmartLink>
          <SmartLink href="/ventures">Ventures</SmartLink>
          <SmartLink href="/contact">Contact</SmartLink>
          <SmartLink href={`mailto:${CONTACT_EMAIL}`}>Email</SmartLink>
          <SmartLink href="/privacy">Privacy</SmartLink>
          <SmartLink href="/terms">Terms</SmartLink>
        </nav>

        {/* --- 2. Brand Family (Differentiated Styling) --- */}
        <nav
          aria-label="Brand family"
          className={clsx(
            "mt-8 pt-4 border-t border-black/10 dark:border-white/10",
            "flex flex-wrap justify-center gap-x-6 gap-y-3",
            "text-deepCharcoal/70 dark:text-cream/70"
          )}
        >
          <SmartLink href={AOF_URL} className="font-semibold">
            Abraham of London
          </SmartLink>
          <SmartLink href={INNOVATE_HUB_URL}>InnovateHub</SmartLink>
          <SmartLink href={ALOMARADA_URL}>Alomarada</SmartLink>
          <SmartLink href={ENDURELUXE_URL}>Endureluxe</SmartLink>
        </nav>

        {/* --- 3. Social Icons --- */}
        <div className="mt-8 flex justify-center gap-5">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="rounded transition hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-softGold focus-visible:ring-opacity-60"
            >
              <Image 
                src={s.icon} 
                alt={s.label} 
                width={28}
                height={28} 
                loading="lazy" 
                decoding="async" 
                // Apply dark mode filter for social icons 
                className="dark:invert dark:opacity-85"
              />
            </a>
          ))}
        </div>

        {/* --- 4. Copyright & Credits --- */}
        <p 
          className={clsx(
            "mt-10 text-center text-sm",
            "text-deepCharcoal/60 dark:text-white/40"
          )}
        >
          © {year}{" "}
          <a 
            href={AOF_URL} 
            className="underline decoration-softGold/70 hover:decoration-softGold transition-colors"
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