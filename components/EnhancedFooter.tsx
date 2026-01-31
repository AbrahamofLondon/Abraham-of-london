"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  MapPin,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  Phone,
  ArrowUp,
  Globe,
  FileText,
  Users,
  MessageCircle,
  BookOpen,
  Shield,
  Briefcase,
  Lock,
  Compass,
  ScrollText,
} from "lucide-react";

import { siteConfig } from "@/config/site";

type SocialPlatform =
  | "twitter"
  | "x"
  | "linkedin"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "facebook"
  | "email"
  | "phone"
  | "website"
  | "whatsapp";

const iconMap: Record<
  SocialPlatform,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  twitter: Twitter,
  x: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: MessageCircle,
  whatsapp: MessageCircle,
  facebook: Facebook,
  email: Mail,
  phone: Phone,
  website: Globe,
};

const fallbackSiteConfig = {
  brand: {
    name: "Abraham of London",
    tagline: "Faith · Strategy · Fatherhood",
  },
  author: { email: "info@abrahamoflondon.org" },
  seo: {
    description:
      "Faith-rooted strategy and leadership for founders, leadership teams, and institutions that refuse to outsource responsibility.",
  },
  socials: [
    {
      kind: "twitter" as const,
      label: "Twitter / X",
      href: "https://twitter.com/abrahamoflondon",
    },
    {
      kind: "linkedin" as const,
      label: "LinkedIn",
      href: "https://linkedin.com/company/abrahamoflondon",
    },
    {
      kind: "instagram" as const,
      label: "Instagram",
      href: "https://instagram.com/abrahamoflondon",
    },
  ],
};

const config = siteConfig || fallbackSiteConfig;

function cleanTel(phone: string): string {
  return phone.replace(/\s+/g, "");
}

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    viewport={{ once: true, margin: "-40px" }}
  >
    {children}
  </motion.div>
);

function FooterLink({ href, label }: { href: string; label: string }): JSX.Element {
  const external = isExternal(href);

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400/40 group-hover:bg-amber-400 transition-colors duration-200" />
        <span className="relative">
          {label}
          <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-amber-400 group-hover:w-full transition-all duration-300" />
        </span>
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200"
      prefetch={false}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400/40 group-hover:bg-amber-400 transition-colors duration-200" />
      <span className="relative">
        {label}
        <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-amber-400 group-hover:w-full transition-all duration-300" />
      </span>
    </Link>
  );
}

/**
 * ALWAYS-LIVE FOOTER ROUTING — NO DEAD ENDS.
 * Vault = /downloads/vault (canonical).
 * Removed /content unless you truly have it.
 */
const footerSections: Array<{
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  links: Array<{ label: string; href: string }>;
}> = [
  {
    title: "Explore",
    icon: Globe,
    links: [
      { label: "Home", href: "/" },
      { label: "Shorts", href: "/shorts" },
      { label: "Essays", href: "/blog" },
      { label: "The Canon", href: "/canon" },
      { label: "Books", href: "/books" },
      { label: "Ventures", href: "/ventures" },
      { label: "Strategy", href: "/strategy" },
      { label: "Resources", href: "/resources" },
      { label: "Downloads", href: "/downloads" },
    ],
  },
  {
    title: "Assets",
    icon: FileText,
    links: [
      { label: "Strategic Frameworks", href: "/resources/strategic-frameworks" },
      { label: "Ultimate Purpose of Man", href: "/blog/ultimate-purpose-of-man" },
      { label: "The Vault", href: "/downloads/vault" },
      { label: "Resources Hub", href: "/resources" },
      { label: "Downloads Hub", href: "/downloads" },
      { label: "Canon Volume I", href: "/canon/volume-i-foundations-of-purpose" },
    ],
  },
  {
    title: "Engage",
    icon: Users,
    links: [
      { label: "Consulting", href: "/consulting" },
      { label: "Book / Introductions", href: "/contact" },
      { label: "Inner Circle", href: "/inner-circle" },
      { label: "Newsletter", href: "/inner-circle#newsletter" },
      { label: "Speaking", href: "/consulting#speaking" },
    ],
  },
];

export default function Footer(): JSX.Element {
  const year = new Date().getFullYear();

  const email = config.author?.email || "info@abrahamoflondon.org";
  const phone = "+44 20 8622 5909";
  const location = "Based in London, working globally";

  const description =
    config.seo?.description ||
    "Faith-rooted strategy and leadership for founders, leadership teams, and institutions that refuse to outsource responsibility.";

  const socials = Array.isArray((config as any).socials) ? (config as any).socials : [];

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative bg-black border-t border-white/10">
      {/* Subtle accent + vignette */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {/* TOP: Institutional “Start Here” rail (shareable, high-conversion) */}
        <FadeIn delay={0.02}>
          <div className="mb-14 rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">
                  Start here
                </p>
                <h3 className="mt-4 font-serif text-3xl font-light text-amber-100">
                  Less theatre. More operating system.
                </h3>
                <p className="mt-4 text-sm lg:text-base text-gray-300/90 font-light leading-relaxed">
                  If you’re assessing credibility: start with the thesis and frameworks.
                  If you’re building: open the Vault and deploy the artefacts.
                </p>
              </div>

              <div className="lg:col-span-6">
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/resources/strategic-frameworks"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-400/25 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-amber-200 hover:border-amber-400/45 hover:bg-white/10 transition-all"
                  >
                    <Compass className="h-4 w-4 text-amber-300" />
                    Frameworks
                  </Link>

                  <Link
                    href="/blog/ultimate-purpose-of-man"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-200 hover:border-white/20 hover:bg-white/10 transition-all"
                  >
                    <ScrollText className="h-4 w-4 text-amber-300" />
                    Ultimate Purpose
                  </Link>

                  <Link
                    href="/downloads/vault"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-amber-200 hover:border-amber-400/45 hover:bg-amber-500/15 transition-all"
                  >
                    <Lock className="h-4 w-4 text-amber-300" />
                    Vault Assets
                  </Link>

                  <Link
                    href="/consulting"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-200 hover:border-white/20 hover:bg-white/10 transition-all"
                  >
                    <Briefcase className="h-4 w-4 text-amber-300" />
                    Advisory
                  </Link>

                  <Link
                    href="/canon"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-200 hover:border-white/20 hover:bg-white/10 transition-all"
                  >
                    <BookOpen className="h-4 w-4 text-amber-300" />
                    Canon
                  </Link>

                  <Link
                    href="/inner-circle"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-200 hover:border-white/20 hover:bg-white/10 transition-all"
                  >
                    <Shield className="h-4 w-4 text-amber-300" />
                    Inner Circle
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2 lg:col-span-1">
            <FadeIn delay={0.05}>
              <Link href="/" className="inline-block mb-6" aria-label="Go to homepage">
                <div className="flex flex-col gap-2">
                  <h2 className="font-serif text-2xl lg:text-3xl font-semibold text-white tracking-tight">
                    {config.brand?.name || "Abraham of London"}
                  </h2>
                  <p className="text-xs font-semibold tracking-[0.25em] text-amber-300 uppercase">
                    {config.brand?.tagline || "Faith · Strategy · Fatherhood"}
                  </p>
                </div>
              </Link>

              <p className="mb-8 text-sm lg:text-base text-gray-300/90 leading-relaxed font-light">
                {description}
              </p>

              {/* Contact info */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-amber-300 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300/90 font-light">{location}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-amber-300 flex-shrink-0" />
                  <a
                    href={`mailto:${email}`}
                    className="text-sm text-gray-300/90 hover:text-amber-300 transition-colors duration-200 font-light"
                  >
                    {email}
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-amber-300 flex-shrink-0" />
                  <a
                    href={`tel:${cleanTel(phone)}`}
                    className="text-sm text-gray-300/90 hover:text-amber-300 transition-colors duration-200 font-light"
                  >
                    {phone}
                  </a>
                </div>
              </div>

              {/* Socials */}
              {socials.length > 0 && (
                <div>
                  <p className="mb-4 text-sm font-semibold text-white tracking-wide">
                    Follow
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {socials.map((social: any, index: number) => {
                      const kind = (social.kind || "website") as SocialPlatform;
                      const Icon = iconMap[kind] ?? Globe;
                      const external = isExternal(social.href);

                      return (
                        <motion.a
                          key={`${social.label}-${social.href}-${index}`}
                          href={social.href}
                          target={external ? "_blank" : "_self"}
                          rel={external ? "noopener noreferrer" : undefined}
                          className="group flex items-center gap-2 rounded-lg px-3 py-2 text-xs border border-white/10 bg-white/5 transition-all duration-200 hover:border-amber-400/25 hover:bg-white/10"
                          whileHover={{ x: 2, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          aria-label={`Follow on ${social.label}`}
                        >
                          <Icon className="h-3.5 w-3.5 text-amber-300" />
                          <span className="text-gray-300/90 group-hover:text-white transition-colors duration-200 font-medium">
                            {social.label}
                          </span>
                        </motion.a>
                      );
                    })}
                  </div>
                </div>
              )}
            </FadeIn>
          </div>

          {/* Sections */}
          {footerSections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={section.title}>
                <FadeIn delay={0.1 + idx * 0.08}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                      <Icon className="h-4 w-4 text-amber-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-white tracking-tight">
                      {section.title}
                    </h3>
                  </div>

                  <ul className="space-y-1">
                    {section.links.map((l) => (
                      <li key={`${section.title}-${l.href}`}>
                        <FooterLink href={l.href} label={l.label} />
                      </li>
                    ))}
                  </ul>
                </FadeIn>
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <FadeIn delay={0.35}>
          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-center lg:text-left">
                <p className="text-sm text-gray-400/90 font-light">
                  © {year} {config.brand?.name || "Abraham of London"}. All rights reserved.
                </p>
                <p className="mt-2 text-xs text-gray-500/80 font-light">
                  Built for those who still believe in duty, consequence, and legacy.
                </p>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap justify-center gap-5 lg:gap-6 text-xs">
                  <Link href="/privacy" className="text-gray-400/90 hover:text-amber-300 transition-colors duration-200 whitespace-nowrap font-light">
                    Privacy
                  </Link>
                  <Link href="/terms" className="text-gray-400/90 hover:text-amber-300 transition-colors duration-200 whitespace-nowrap font-light">
                    Terms
                  </Link>
                  <Link href="/cookies" className="text-gray-400/90 hover:text-amber-300 transition-colors duration-200 whitespace-nowrap font-light">
                    Cookies
                  </Link>
                  <Link href="/accessibility" className="text-gray-400/90 hover:text-amber-300 transition-colors duration-200 whitespace-nowrap font-light">
                    Accessibility
                  </Link>
                  <Link href="/security" className="text-gray-400/90 hover:text-amber-300 transition-colors duration-200 whitespace-nowrap font-light">
                    Security
                  </Link>
                </div>
              </div>

              <motion.button
                onClick={scrollToTop}
                className="group flex items-center justify-center gap-2.5 rounded-2xl px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-xl shadow-amber-900/20"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Scroll back to top"
              >
                Back to Top
                <ArrowUp className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-1" />
              </motion.button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500/70 font-light tracking-wide">
                Designed in London · Built with purpose
              </p>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Motion safety */}
      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </footer>
  );
}