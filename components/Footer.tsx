"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";

const AOF_URL = process.env.NEXT_PUBLIC_AOF_URL || "https://abrahamoflondon.org";
const INNOVATE_HUB_URL =
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL ||
  process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL ||
  "https://innovatehub-abrahamoflondon.netlify.app";
const ALOMARADA_URL = process.env.NEXT_PUBLIC_ALOMARADA_URL || "https://alomarada.com";
const ENDURELUXE_URL = process.env.NEXT_PUBLIC_ENDURELUXE_URL || "https://endureluxe.com";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@abrahamoflondon.org";

const socials = [
  { href: "https://x.com/AbrahamAda48634", icon: "/assets/images/social/twitter.svg", label: "Twitter / X" },
  { href: "https://www.linkedin.com/in/abraham-adaramola-06630321/", icon: "/assets/images/social/linkedin.svg", label: "LinkedIn" },
  { href: "https://www.instagram.com/abraham_of_london", icon: "/assets/images/social/instagram.svg", label: "Instagram" },
  { href: "https://youtube.com", icon: "/assets/images/social/youtube.svg", label: "YouTube" },
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
    return (
      <a
        href={href}
        className={base}
        aria-label={ariaLabel}
        target="_blank"
        rel="noopener noreferrer"
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

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/10 bg-cream text-deepCharcoal dark:border-white/10 dark:bg-deepCharcoal dark:text-cream">
      <div className="container mx-auto max-w-7xl px-4 py-10">
        {/* Main nav */}
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          <SmartLink href="/about">About</SmartLink>
          <SmartLink href="/blog">Blog</SmartLink>
          <SmartLink href="/books">Books</SmartLink>
          <SmartLink href="/ventures">Ventures</SmartLink>
          <SmartLink href="/privacy">Privacy</SmartLink>
          <SmartLink href="/terms">Terms</SmartLink>
        </nav>

        {/* Brand family */}
        <nav aria-label="Brand family" className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
          <SmartLink href={AOF_URL}>Abraham of London</SmartLink>
          <SmartLink href={INNOVATE_HUB_URL}>InnovateHub</SmartLink>
          <SmartLink href={ALOMARADA_URL}>Alomarada</SmartLink>
          <SmartLink href={ENDURELUXE_URL}>Endureluxe</SmartLink>
        </nav>

        {/* Social icons */}
        <div className="mt-6 flex justify-center gap-4">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="rounded p-1 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
            >
              <Image src={s.icon} alt={s.label} width={24} height={24} loading="lazy" decoding="async" />
            </a>
          ))}
        </div>

        {/* Contact CTAs */}
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="ghost" size="sm" href={`mailto:${CONTACT_EMAIL}`}>
            Email
          </Button>
          <Button variant="primary" size="sm" href="/contact">
            Enquire
          </Button>
        </div>

        {/* Copyright */}
        <p className="mt-6 text-center text-sm text-deepCharcoal/60 dark:text-cream/60">
          © {year}{" "}
          <a href={AOF_URL} className="underline decoration-forest/30 hover:decoration-forest">
            Abraham of London
          </a>
          . All rights reserved.
        </p>
      </div>
    </footer>
  );
}
