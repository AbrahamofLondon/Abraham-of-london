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

// Import the actual site config
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

// FALLBACK SITE CONFIG in case imports fail
const fallbackSiteConfig = {
  brand: {
    name: "Abraham of London",
    tagline: "Faith · Strategy · Fatherhood"
  },
  author: {
    email: "info@abrahamoflondon.org",
  },
  socials: [
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
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    viewport={{ once: true, margin: "-40px" }}
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
    return (
      <span className="group flex items-center gap-2.5 py-2 text-sm text-gray-400/80 cursor-not-allowed">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-700/60" />
        <span>
          {label} <span className="text-[10px] uppercase tracking-[0.15em] text-amber-400/50">(Soon)</span>
        </span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200"
      prefetch={false}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400/40 group-hover:bg-amber-400 transition-colors duration-200" />
      <span className="relative">
        {label}
        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-amber-400 group-hover:w-full transition-all duration-300" />
      </span>
    </Link>
  );
}

export default function EnhancedFooter(): JSX.Element {
  const year = new Date().getFullYear();

  // Use the correct structure from your actual siteConfig
  const email = config.author?.email || "info@abrahamoflondon.org";
  const phone = "+44 20 8622 5909"; // Hardcoded since not in your config
  const location = "Based in London, working globally"; // Hardcoded

  const description = config.seo?.description || 
    "Faith-rooted strategy and leadership for founders, leadership teams, and institutions that refuse to outsource responsibility.";

  const socials = Array.isArray(config.socials) ? config.socials : [];

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative bg-black border-t border-gray-800/50">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.02] via-transparent to-transparent" />
      
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/15 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="md:col-span-2 lg:col-span-1">
            <FadeIn delay={0.05}>
              <Link href="/" className="group inline-block mb-6" aria-label="Go to homepage">
                <div className="flex flex-col gap-1.5">
                  <h2 className="font-serif text-2xl lg:text-3xl font-bold text-white tracking-tight">
                    {config.brand?.name ? config.brand.name.replace('Abraham', 'Abraham<span className="text-amber-400">').replace(' of London', '</span> of London') : 'Abraham<span className="text-amber-400"> of London</span>'}
                  </h2>
                  <p className="text-xs font-medium tracking-[0.2em] text-amber-400/80 uppercase">
                    {config.brand?.tagline || "Faith · Strategy · Fatherhood"}
                  </p>
                </div>
              </Link>

              <p className="mb-8 text-sm lg:text-base text-gray-300/90 leading-relaxed font-light">
                {description}
              </p>

              {/* Contact Info */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-amber-400/80 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300/90 font-light">{location}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-amber-400/80 flex-shrink-0" />
                  <a
                    href={`mailto:${email}`}
                    className="text-sm text-gray-300/90 hover:text-amber-400 transition-colors duration-200 font-light"
                  >
                    {email}
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-amber-400/80 flex-shrink-0" />
                  <a
                    href={`tel:${cleanTel(phone)}`}
                    className="text-sm text-gray-300/90 hover:text-amber-400 transition-colors duration-200 font-light"
                  >
                    {phone}
                  </a>
                </div>
              </div>

              {/* Social Links */}
              {socials.length > 0 && (
                <div className="mb-2">
                  <p className="mb-4 text-sm font-semibold text-white tracking-wide">Follow</p>
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
                          className="group flex items-center gap-2 rounded-lg px-3 py-2 text-xs border border-amber-400/15 bg-amber-400/[0.03] transition-all duration-200 hover:border-amber-400/30 hover:bg-amber-400/[0.08]"
                          whileHover={{ x: 2, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          aria-label={`Follow on ${social.label}`}
                        >
                          <Icon className="h-3.5 w-3.5 text-amber-400" />
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10">
                      <Icon className="h-4 w-4 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white tracking-tight">{section.title}</h3>
                  </div>

                  <ul className="space-y-1">
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

        {/* Bottom Bar */}
        <FadeIn delay={0.35}>
          <div className="mt-16 pt-8 border-t border-gray-800/60">
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
                  <Link href="/privacy" className="text-gray-400/90 hover:text-amber-400 transition-colors duration-200 whitespace-nowrap font-light">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-gray-400/90 hover:text-amber-400 transition-colors duration-200 whitespace-nowrap font-light">
                    Terms of Service
                  </Link>
                  <Link href="/cookies" className="text-gray-400/90 hover:text-amber-400 transition-colors duration-200 whitespace-nowrap font-light">
                    Cookie Policy
                  </Link>
                  <Link href="/accessibility" className="text-gray-400/90 hover:text-amber-400 transition-colors duration-200 whitespace-nowrap font-light">
                    Accessibility
                  </Link>
                  <Link href="/security" className="text-gray-400/90 hover:text-amber-400 transition-colors duration-200 whitespace-nowrap font-light">
                    Security
                  </Link>
                </div>
              </div>

              <motion.button
                onClick={scrollToTop}
                className="group flex items-center justify-center gap-2.5 rounded-xl px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-sm hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-lg shadow-amber-500/10"
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

      {/* Ensure text is always legible */}
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
        
        /* Ensure all text has proper contrast */
        .text-gray-300 {
          color: rgba(209, 213, 219, 0.95) !important;
        }
        
        .text-gray-400 {
          color: rgba(156, 163, 175, 0.95) !important;
        }
        
        .text-gray-500 {
          color: rgba(107, 114, 128, 0.95) !important;
        }
      `}</style>
    </footer>
  );
}