// components/EnhancedFooter.tsx
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
  Github,
  Globe,
  BookOpen,
  FileText,
  Users,
  Music2,
} from "lucide-react";

// ----------------------------------------------------------------------------
// Device detection hook
// ----------------------------------------------------------------------------
function useDeviceType() {
  const [deviceType, setDeviceType] = React.useState<
    "mobile" | "tablet" | "desktop"
  >("desktop");

  React.useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType("mobile");
      else if (width < 1024) setDeviceType("tablet");
      else setDeviceType("desktop");
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return deviceType;
}

// ----------------------------------------------------------------------------
// SITE CONFIG (single source of truth)
// ----------------------------------------------------------------------------
const SITE_CONFIG = {
  title: "Abraham of London",
  description:
    "Faith-rooted strategy and leadership for fathers, founders, and board-level leaders who refuse to outsource responsibility.",
  contact: {
    email: "info@abrahamoflondon.org",
    phone: "+44 20 8622 5909",
    location: "Based in London, working globally",
  },
  socialLinks: [
    { href: "https://x.com/AbrahamAda48634", label: "X", kind: "twitter" },
    {
      href: "https://www.tiktok.com/@abrahamoflondon?is_",
      label: "TikTok",
      kind: "tiktok",
    },
    {
      href: "https://www.facebook.com/share/1Gvu4ZunTq/",
      label: "Facebook",
      kind: "facebook",
    },
    {
      href: "https://www.instagram.com/abraham_of_london_?igsh=MWw3bjFxMmlwaDd0Mw==",
      label: "Instagram",
      kind: "instagram",
    },
    {
      href: "https://www.linkedin.com/in/abraham-adaramola-06630321?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      label: "LinkedIn",
      kind: "linkedin",
    },
    { href: "mailto:info@abrahamoflondon.org", label: "Email", kind: "email" },
  ],
} as const;

type SocialPlatform =
  | "twitter"
  | "linkedin"
  | "github"
  | "instagram"
  | "youtube"
  | "website"
  | "tiktok"
  | "facebook"
  | "email"
  | "phone"
  | "whatsapp"
  | "medium";

const iconMap: Record<SocialPlatform, React.ComponentType<any>> = {
  twitter: Twitter,
  linkedin: Linkedin,
  github: Github,
  instagram: Instagram,
  youtube: Youtube,
  website: Globe,
  tiktok: Music2,
  facebook: Facebook,
  email: Mail,
  phone: Phone,
  whatsapp: Phone,
  medium: BookOpen,
};

// ----------------------------------------------------------------------------
// Footer nav sections
// ----------------------------------------------------------------------------
const footerSections = [
  {
    title: "Explore",
    icon: Globe,
    links: [
      { label: "Home", href: "/" },
      { label: "Content", href: "/content" },
      { label: "Shorts", href: "/shorts" },
      { label: "The Canon", href: "/canon" },
      { label: "Books", href: "/books" },
      { label: "Downloads", href: "/downloads" },
      { label: "Events", href: "/events" },
    ],
  },
  {
    title: "Resources",
    icon: FileText,
    links: [
      { label: "Fatherhood Frameworks", href: "/fatherhood" },
      { label: "Founder Tools", href: "/founders" },
      { label: "Leadership Resources", href: "/leadership" },
      { label: "Canon Campaign", href: "/canon-campaign" },
      { label: "Volume X — Future Civilisation", href: "/canon/volume-x" },
    ],
  },
  {
    title: "Connect",
    icon: Users,
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Newsletter", href: "/newsletter" },
      { label: "Speaking", href: "/speaking" },
      { label: "Consulting", href: "/consulting" },
      { label: "Inner Circle", href: "/inner-circle" },
    ],
  },
] as const;

// ----------------------------------------------------------------------------
// Motion helper
// ----------------------------------------------------------------------------
const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}> = ({ children, delay = 0, direction = "up" }) => {
  const directions: Record<string, any> = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      viewport={{ once: true, margin: "-50px" }}
    >
      {children}
    </motion.div>
  );
};

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------
export default function EnhancedFooter() {
  const deviceType = useDeviceType();
  const isMobile = deviceType === "mobile";
  const isTablet = deviceType === "tablet";

  const currentYear = React.useMemo(() => new Date().getFullYear(), []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const telHref = React.useMemo(
    () => `tel:${SITE_CONFIG.contact.phone.replace(/\s+/g, "")}`,
    []
  );
  const mailHref = React.useMemo(
    () => `mailto:${SITE_CONFIG.contact.email}`,
    []
  );

  return (
    <footer className="relative border-t border-amber-500/10 bg-gradient-to-b from-gray-900 to-black">
      {/* subtle glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
      <div className="pointer-events-none absolute top-0 left-1/2 h-px w-full max-w-4xl -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* ✅ Tailwind-safe grid (no dynamic class names) */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className={isTablet ? "md:col-span-2" : ""}>
            <FadeIn delay={0.1} direction="up">
              <Link
                href="/"
                className="group inline-block mb-4 lg:mb-6"
                aria-label="Go to homepage"
              >
                <div className="flex flex-col gap-1">
                  <h2 className="font-serif text-2xl lg:text-3xl font-bold text-white">
                    Abraham <span className="text-amber-400">of London</span>
                  </h2>
                  <p className="text-xs font-medium tracking-[0.2em] text-amber-400/70 uppercase">
                    Faith · Strategy · Fatherhood
                  </p>
                </div>
              </Link>

              <p className="mb-4 lg:mb-6 text-sm lg:text-base text-gray-300 leading-relaxed">
                {SITE_CONFIG.description}
              </p>

              {/* Contact */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-amber-400/70 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">
                    {SITE_CONFIG.contact.location}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-amber-400/70 flex-shrink-0" />
                  <a
                    href={mailHref}
                    className="text-sm text-gray-300 hover:text-amber-400 transition-colors"
                    aria-label="Send email"
                  >
                    {SITE_CONFIG.contact.email}
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-amber-400/70 flex-shrink-0" />
                  <a
                    href={telHref}
                    className="text-sm text-gray-300 hover:text-amber-400 transition-colors"
                    aria-label="Call phone number"
                  >
                    {SITE_CONFIG.contact.phone}
                  </a>
                </div>
              </div>

              {/* ✅ Social Links (always rendered) */}
              <div className="mb-6">
                <p className="mb-3 text-sm font-semibold text-white">Follow</p>

                <div className="flex flex-wrap gap-2">
                  {SITE_CONFIG.socialLinks.map((social) => {
                    const kind = social.kind as SocialPlatform;
                    const Icon = iconMap[kind] ?? Globe;
                    const isExternal = social.href.startsWith("http");

                    return (
                      <motion.a
                        key={social.label}
                        href={social.href}
                        target={isExternal ? "_blank" : "_self"}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="group inline-flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs transition-all duration-200 hover:border-amber-400/40 hover:bg-amber-400/10"
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        aria-label={`Open ${social.label}`}
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
            </FadeIn>
          </div>

          {/* Nav sections */}
          {footerSections.map((section, index) => (
            <div key={section.title} className={isMobile ? "col-span-1" : ""}>
              <FadeIn delay={0.2 + index * 0.1} direction="up">
                <div className={isMobile ? "border-t border-gray-800 pt-6" : ""}>
                  <div className="mb-4 flex items-center gap-2">
                    {React.createElement(section.icon, {
                      className: "h-4 w-4 text-amber-400",
                    })}
                    <h3 className="text-lg font-semibold text-white">
                      {section.title}
                    </h3>
                  </div>

                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="group flex items-center gap-2 py-1 text-sm text-gray-400 transition-colors hover:text-white"
                          prefetch={false}
                        >
                          <span className="h-1 w-1 rounded-full bg-amber-400/30 transition-colors group-hover:bg-amber-400" />
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <FadeIn delay={0.5} direction="up">
          <div className="mt-12 border-t border-gray-800 pt-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-center lg:text-left">
                <p className="text-sm text-gray-400">
                  © {currentYear} {SITE_CONFIG.title}. All rights reserved.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Built for those who still believe in duty, consequence, and
                  legacy.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400 lg:gap-6">
                <Link href="/privacy" className="hover:text-amber-400 transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-amber-400 transition-colors">
                  Terms of Service
                </Link>
                <Link href="/cookies" className="hover:text-amber-400 transition-colors">
                  Cookie Policy
                </Link>
                <Link
                  href="/accessibility"
                  className="hover:text-amber-400 transition-colors"
                >
                  Accessibility
                </Link>
                <Link href="/security" className="hover:text-amber-400 transition-colors">
                  Security
                </Link>
              </div>

              <motion.button
                onClick={scrollToTop}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                aria-label="Scroll back to top"
              >
                Back to Top
                <ArrowUp className="h-3 w-3 transition-transform group-hover:-translate-y-0.5" />
              </motion.button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Designed in London · Built with purpose
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </footer>
  );
}