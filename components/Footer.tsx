// components/Footer.tsx
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  MapPin,
  Sparkles,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  MessageCircle,
  Phone,
  ArrowUp,
} from "lucide-react";
import { siteConfig, type SocialLink } from "@/lib/siteConfig";

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  tiktok: MessageCircle,
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
};

const DEFAULT_SOCIALS: SocialLink[] = [
  {
    href: "https://tiktok.com/@abrahamoflondon",
    label: "TikTok",
    kind: "tiktok",
    external: true,
  },
  {
    href: "https://x.com/AbrahamAda48634",
    label: "X",
    kind: "twitter",
    external: true,
  },
  {
    href: "https://www.instagram.com/abraham_of_london_/",
    label: "Instagram",
    kind: "instagram",
    external: true,
  },
  {
    href: "https://www.facebook.com/share/16tvsnTgRG/",
    label: "Facebook",
    kind: "facebook",
    external: true,
  },
  {
    href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    label: "LinkedIn",
    kind: "linkedin",
    external: true,
  },
  {
    href: "https://www.youtube.com/@abrahamoflondon",
    label: "YouTube",
    kind: "youtube",
    external: true,
  },
  {
    href: "mailto:info@abrahamoflondon.org",
    label: "Email",
    kind: "email",
    external: false,
  },
  {
    href: "https://wa.me/447496334022",
    label: "WhatsApp",
    kind: "whatsapp",
    external: true,
  },
  {
    href: "tel:+442086225909",
    label: "Landline",
    kind: "phone",
    external: false,
  },
];

const footerSections = [
  {
    title: "Navigation",
    links: [
      { label: "Home", href: "/" },
      { label: "Content", href: "/content" },
      { label: "Downloads", href: "/downloads" },
      { label: "Events", href: "/events" },
      { label: "Ventures", href: "/ventures" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Fatherhood Frameworks", href: "/content" },
      { label: "Founder Tools", href: "/downloads" },
      { label: "Leadership Resources", href: "/content" },
      { label: "Book Manuscripts", href: "/content" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "Speaking", href: "/contact" },
      { label: "Consulting", href: "/consulting" },
      { label: "Chatham Rooms", href: "/chatham-rooms" },
    ],
  },
];

export default function Footer(): JSX.Element {
  const title = siteConfig.title || "Abraham of London";
  const email = siteConfig.email || "info@abrahamoflondon.org";

  const configSocials: SocialLink[] = Array.isArray(siteConfig.socialLinks)
    ? siteConfig.socialLinks
    : [];

  const byHref = new Map<string, SocialLink>();
  [...DEFAULT_SOCIALS, ...configSocials].forEach((item) => {
    const rawHref = typeof item.href === "string" ? item.href.trim() : "";
    if (!rawHref) return;
    byHref.set(rawHref, item);
  });

  const socials = Array.from(byHref.values()).map((item) => {
    const external =
      item.external ??
      (item.href.startsWith("http") &&
        !item.href.startsWith("mailto:") &&
        !item.href.startsWith("tel:"));
    const Icon = item.kind && iconMap[item.kind] ? iconMap[item.kind] : Sparkles;

    return {
      ...item,
      external,
      Icon,
    };
  });

  const year = new Date().getFullYear();

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-gold/20 bg-gradient-to-b from-charcoal to-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          {/* Brand section */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Link href="/" className="group mb-6 flex flex-col gap-1">
              <span className="font-serif text-2xl font-bold tracking-wide text-cream">
                Abraham of London
              </span>
              <span className="text-xs font-sans font-normal tracking-[0.3em] text-gold/70">
                FAITH · STRATEGY · FATHERHOOD
              </span>
            </Link>

            <p className="mb-6 text-sm leading-relaxed text-gold/70">
              Faith-rooted strategy and leadership for fathers, founders, and
              board-level leaders who refuse to outsource responsibility.
            </p>

            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gold/60">
                <MapPin className="h-4 w-4" />
                <span>Based in London, working globally</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gold/60">
                <Mail className="h-4 w-4" />
                <a
                  href={`mailto:${email}`}
                  className="transition-colors hover:text-gold"
                >
                  {email}
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {socials.slice(0, 6).map((social, index) => (
                <motion.a
                  key={`${social.label}-${index}`}
                  href={social.href}
                  target={social.external ? "_blank" : "_self"}
                  rel={social.external ? "noopener noreferrer" : undefined}
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/5 text-gold transition-all hover:bg-gold hover:text-charcoal"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.label}
                >
                  <social.Icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Navigation sections */}
          {footerSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="mb-4 font-serif text-lg font-semibold text-cream">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 text-sm text-gold/70 transition-all hover:text-gold"
                    >
                      <Sparkles className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      <span className="transition-transform group-hover:translate-x-1">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom section */}
        <motion.div
          className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-gold/20 pt-8 lg:flex-row"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="text-center lg:text-left">
            <p className="text-sm text-gold/50">
              © {year} {title}. All rights reserved.
            </p>
            <p className="mt-1 text-xs text-gold/30">
              Built for men who still believe in duty, consequence, and legacy.
            </p>
          </div>

          {/* Governance links */}
          <div className="flex flex-col items-center gap-2 lg:items-end">
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-gold/40">
              Governance
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gold/50 lg:justify-end">
              <Link href="/privacy" className="transition-colors hover:text-gold">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition-colors hover:text-gold">
                Terms of Service
              </Link>
              <Link href="/cookies" className="transition-colors hover:text-gold">
                Cookie Policy
              </Link>
              <Link
                href="/accessibility"
                className="transition-colors hover:text-gold"
              >
                Accessibility
              </Link>
              <Link href="/security" className="transition-colors hover:text-gold">
                Security
              </Link>
            </div>
          </div>

          <motion.button
            onClick={scrollToTop}
            className="group flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/5 px-4 py-2 text-sm font-semibold text-gold transition-all hover:bg-gold hover:text-charcoal"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Scroll to top"
          >
            Back to Top
            <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-1" />
          </motion.button>
        </motion.div>
      </div>
    </footer>
  );
}