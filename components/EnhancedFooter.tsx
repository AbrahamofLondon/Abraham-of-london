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
  Globe,
  FileText,
  Users,
  MessageCircle,
} from "lucide-react";

const useDeviceType = () => {
  const [deviceType, setDeviceType] =
    React.useState<"mobile" | "tablet" | "desktop">("desktop");

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
};

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
    { href: "https://www.tiktok.com/@abrahamoflondon", label: "TikTok", kind: "tiktok" },
    { href: "https://www.facebook.com/share/1Gvu4ZunTq/", label: "Facebook", kind: "facebook" },
    {
      href: "https://www.instagram.com/abraham_of_london_?igsh=MWw3bjFxMmlwaDd0Mw==",
      label: "Instagram",
      kind: "instagram",
    },
    {
      href: "https://www.linkedin.com/in/abraham-adaramola-06630321",
      label: "LinkedIn",
      kind: "linkedin",
    },
    { href: "mailto:info@abrahamoflondon.org", label: "Email", kind: "email" },
  ],
} as const;

type SocialPlatform =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "facebook"
  | "email"
  | "phone"
  | "website";

const iconMap: Record<SocialPlatform, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: MessageCircle,
  facebook: Facebook,
  email: Mail,
  phone: Phone,
  website: Globe,
};

const footerSections = [
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

      // ✅ FIX: your build output shows /chatham-rooms exists (not /strategy/chatham-rooms)
      { label: "Chatham Rooms", href: "/chatham-rooms" },
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
];

const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}> = ({ children, delay = 0, direction = "up" }) => {
  const directions = {
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

export default function EnhancedFooter() {
  const deviceType = useDeviceType();
  const isMobile = deviceType === "mobile";
  const isTablet = deviceType === "tablet";
  const [currentYear, setCurrentYear] = React.useState<number>(2024);

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleEmailClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = `mailto:${SITE_CONFIG.contact.email}`;
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = `tel:${SITE_CONFIG.contact.phone.replace(/\s+/g, "")}`;
  };

  const gridCols = isMobile ? "1" : isTablet ? "2" : "4";

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 to-black border-t border-amber-500/10">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className={`grid grid-cols-${gridCols} gap-8`}>
          <div className={isMobile ? "col-span-1" : isTablet ? "col-span-2" : "col-span-1"}>
            <FadeIn delay={0.1} direction="up">
              <Link href="/" className="group inline-block mb-4 lg:mb-6" aria-label="Go to homepage">
                <div className="flex flex-col gap-1">
                  <h2 className="font-serif text-2xl lg:text-3xl font-bold text-white">
                    Abraham<span className="text-amber-400"> of London</span>
                  </h2>
                  <p className="text-xs font-medium tracking-[0.2em] text-amber-400/70 uppercase">
                    Faith · Strategy · Fatherhood
                  </p>
                </div>
              </Link>

              <p className="mb-4 lg:mb-6 text-sm lg:text-base text-gray-300 leading-relaxed">
                {SITE_CONFIG.description}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-amber-400/70 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{SITE_CONFIG.contact.location}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-amber-400/70 flex-shrink-0" />
                  <a
                    href={`mailto:${SITE_CONFIG.contact.email}`}
                    onClick={handleEmailClick}
                    className="text-sm text-gray-300 hover:text-amber-400 transition-colors"
                  >
                    {SITE_CONFIG.contact.email}
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-amber-400/70 flex-shrink-0" />
                  <a
                    href={`tel:${SITE_CONFIG.contact.phone.replace(/\s+/g, "")}`}
                    onClick={handlePhoneClick}
                    className="text-sm text-gray-300 hover:text-amber-400 transition-colors"
                  >
                    {SITE_CONFIG.contact.phone}
                  </a>
                </div>
              </div>

              {/* ✅ Social Links are here (and will now show because Footer.tsx re-exports this file) */}
              <div className="mb-6">
                <p className="mb-3 text-sm font-semibold text-white">Follow</p>
                <div className="flex flex-wrap gap-2">
                  {SITE_CONFIG.socialLinks.map((social) => {
                    const Icon =
                      iconMap[(social.kind as SocialPlatform) || "website"] ?? Globe;

                    return (
                      <motion.a
                        key={social.label}
                        href={social.href}
                        target={social.href.startsWith("http") ? "_blank" : "_self"}
                        rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
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
            </FadeIn>
          </div>

          {footerSections.map((section, index) => (
            <div key={section.title} className={isMobile ? "col-span-1" : ""}>
              <FadeIn delay={0.1 + index * 0.1} direction="up">
                <div className={isMobile ? "border-t border-gray-800 pt-6 first:pt-0 first:border-t-0" : ""}>
                  <div className="flex items-center gap-2 mb-4">
                    {React.createElement(section.icon, { className: "h-4 w-4 text-amber-400" })}
                    <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors py-1"
                          prefetch={false}
                        >
                          <span className="w-1 h-1 rounded-full bg-amber-400/30 group-hover:bg-amber-400 transition-colors" />
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

        <FadeIn delay={0.4} direction="up">
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-center lg:text-left">
                <p className="text-sm text-gray-400">
                  © {currentYear} {SITE_CONFIG.title}. All rights reserved.
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
              <p className="text-xs text-gray-500">Version 2.1.0 · Designed in London · Built with purpose</p>
            </div>
          </div>
        </FadeIn>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          a[role="button"],
          button,
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
          .grid {
            grid-template-columns: 1fr !important;
          }
          .col-span-1 {
            grid-column: span 1;
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .col-span-2 {
            grid-column: span 2;
          }
        }
        @media (min-width: 1024px) {
          .grid {
            grid-template-columns: repeat(4, 1fr) !important;
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