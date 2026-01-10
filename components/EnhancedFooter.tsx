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
} from "lucide-react";

// Import the actual site config or use fallbacks
import { siteConfig } from "@/lib/imports";

type SocialPlatform =
  | "twitter"
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

// FALLBACK SITE CONFIG in case imports fail
const fallbackSiteConfig = {
  title: "Abraham of London",
  description: "Faith-rooted strategy and leadership for founders, leadership teams, and institutions that refuse to outsource responsibility.",
  brand: {
    tagline: "Faith · Strategy · Fatherhood"
  },
  contact: {
    email: "info@abrahamoflondon.org",
    phone: "+44 20 8622 5909",
    address: "Based in London, working globally"
  },
  socialLinks: [
    { kind: "twitter" as const, label: "Twitter", href: "https://twitter.com/abrahamoflondon" },
    { kind: "linkedin" as const, label: "LinkedIn", href: "https://linkedin.com/company/abrahamoflondon" },
    { kind: "instagram" as const, label: "Instagram", href: "https://instagram.com/abrahamoflondon" },
  ]
};

// Use actual config or fallback
const config = siteConfig || fallbackSiteConfig;

function cleanTel(phone: string): string {
  return phone.replace(/\s+/g, "");
}

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/**
 * Only link what you actually have.
 * Add to this list as you implement routes. This stops "random" footer 404s.
 */
const KNOWN_ROUTES = new Set<string>([
  "/",
  "/about",
  "/content",
  "/shorts",
  "/blog",
  "/canon",
  "/books",
  "/downloads",
  "/ventures",
  "/strategy",
  "/contact",
  "/inner-circle",
  "/privacy",
  "/terms",
  "/cookies",
  "/accessibility",
  "/security",
  "/resources",
]);

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
      { label: "Content", href: "/content" },
      { label: "Shorts", href: "/shorts" },
      { label: "Essays", href: "/blog" },
      { label: "The Canon", href: "/canon" },
      { label: "Books", href: "/books" },
      { label: "Downloads", href: "/downloads" },
      { label: "Ventures", href: "/ventures" },
      { label: "Strategy", href: "/strategy" },
    ],
  },
  {
    title: "Resources",
    icon: FileText,
    links: [
      { label: "Resources Hub", href: "/resources" },
      { label: "Founder Tools", href: "/founders" },
      { label: "Leadership Resources", href: "/leadership" },
      { label: "Canon Campaign", href: "/canon-campaign" },
      { label: "Chatham Rooms", href: "/chatham-rooms" },
    ],
  },
  {
    title: "Connect",
    icon: Users,
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Inner Circle", href: "/inner-circle" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "Speaking", href: "/speaking" },
      { label: "Consulting", href: "/consulting" },
    ],
  },
];

const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
}> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    viewport={{ once: true, margin: "-60px" }}
  >
    {children}
  </motion.div>
);

function FooterLink({
  href,
  label,
}: {
  href: string;
  label: string;
}): JSX.Element {
  const enabled = KNOWN_ROUTES.has(href) || isExternal(href);

  if (!enabled) {
    // Not a link. Stops 404. Still communicates intent.
    return (
      <span className="group flex items-center gap-2 py-1 text-sm text-gray-400 cursor-not-allowed">
        <span className="w-1 h-1 rounded-full bg-gray-700" />
        <span>
          {label} <span className="text-[10px] uppercase tracking-[0.2em] text-amber-400/60">(Soon)</span>
        </span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="group flex items-center gap-2 py-1 text-sm text-gray-400 hover:text-white transition-colors"
      prefetch={false}
    >
      <span className="w-1 h-1 rounded-full bg-amber-400/30 group-hover:bg-amber-400 transition-colors" />
      <span>{label}</span>
    </Link>
  );
}

export default function EnhancedFooter(): JSX.Element {
  const year = new Date().getFullYear();

  const email = config.contact?.email || "info@abrahamoflondon.org";
  const phone = config.contact?.phone || "+44 20 8622 5909";
  const location = config.contact?.address || "Based in London, working globally";

  const description = config.description || 
    "Faith-rooted strategy and leadership for founders, leadership teams, and institutions that refuse to outsource responsibility.";

  const socials = Array.isArray(config.socialLinks) ? config.socialLinks : [];

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 to-black border-t border-amber-500/10">
      {/* Debug overlay - remove in production */}
      {!siteConfig && (
        <div className="absolute top-0 left-0 right-0 bg-red-500/10 text-red-300 text-xs p-1 text-center z-50">
          Using fallback site config - check @/lib/imports
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2 lg:col-span-1">
            <FadeIn delay={0.05}>
              <Link href="/" className="group inline-block mb-5" aria-label="Go to homepage">
                <div className="flex flex-col gap-1">
                  <h2 className="font-serif text-2xl lg:text-3xl font-bold text-white">
                    Abraham<span className="text-amber-400"> of London</span>
                  </h2>
                  <p className="text-xs font-medium tracking-[0.2em] text-amber-400/70 uppercase">
                    {config.brand?.tagline ?? "Faith · Strategy · Fatherhood"}
                  </p>
                </div>
              </Link>

              <p className="mb-6 text-sm lg:text-base text-gray-300 leading-relaxed">
                {description}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-amber-400/70 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{location}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-amber-400/70 flex-shrink-0" />
                  <a
                    href={`mailto:${email}`}
                    className="text-sm text-gray-300 hover:text-amber-400 transition-colors"
                  >
                    {email}
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-amber-400/70 flex-shrink-0" />
                  <a
                    href={`tel:${cleanTel(phone)}`}
                    className="text-sm text-gray-300 hover:text-amber-400 transition-colors"
                  >
                    {phone}
                  </a>
                </div>
              </div>

              {socials.length > 0 && (
                <div className="mb-2">
                  <p className="mb-3 text-sm font-semibold text-white">Follow</p>
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
                          className="group flex items-center gap-2 rounded-lg px-3 py-2 text-xs border border-amber-400/20 bg-amber-400/5 transition-all duration-200 hover:border-amber-400/40 hover:bg-amber-400/10"
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          aria-label={`Follow on ${social.label}`}
                        >
                          <Icon className="h-3 w-3 text-amber-400" />
                          <span className="text-gray-300 group-hover:text-white transition-colors">
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
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className="h-4 w-4 text-amber-400" />
                    <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                  </div>

                  <ul className="space-y-2">
                    {section.links.map((l) => (
                      <li key={l.href}>
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
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-center lg:text-left">
                <p className="text-sm text-gray-400">
                  © {year} {config.title || "Abraham of London"}. All rights reserved.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Built for those who still believe in duty, consequence, and legacy.
                </p>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap justify-center gap-4 lg:gap-6 text-xs">
                  <Link href="/privacy" className="text-gray-400 hover:text-amber-400 transition-colors whitespace-nowrap">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-gray-400 hover:text-amber-400 transition-colors whitespace-nowrap">
                    Terms of Service
                  </Link>
                  <Link href="/cookies" className="text-gray-400 hover:text-amber-400 transition-colors whitespace-nowrap">
                    Cookie Policy
                  </Link>
                  <Link href="/accessibility" className="text-gray-400 hover:text-amber-400 transition-colors whitespace-nowrap">
                    Accessibility
                  </Link>
                  <Link href="/security" className="text-gray-400 hover:text-amber-400 transition-colors whitespace-nowrap">
                    Security
                  </Link>
                </div>
              </div>

              <motion.button
                onClick={scrollToTop}
                className="group flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Scroll back to top"
              >
                Back to Top
                <ArrowUp className="h-3 w-3 transition-transform group-hover:-translate-y-0.5" />
              </motion.button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">Designed in London · Built with purpose</p>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Touch targets + motion reduction */}
      <style jsx global>{`
        @media (max-width: 768px) {
          a[role="button"],
          button,
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
        }
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