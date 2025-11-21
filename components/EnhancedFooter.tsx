// components/EnhancedFooter.tsx
import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { siteConfig, type SocialLink } from "@/lib/siteConfig";

interface EnhancedFooterProps {
  variant?: "light" | "dark";
  className?: string;
}

export default function EnhancedFooter({
  variant = "light",
  className,
}: EnhancedFooterProps) {
  const config = siteConfig;

  // Safely normalize social links
  const socialLinks: SocialLink[] = Array.isArray(config.socialLinks)
    ? [...config.socialLinks]
    : [];

  const baseClasses = "py-16 transition-colors";
  const variantClasses = {
    light:
      "bg-gradient-to-b from-warmWhite to-cream/30 text-deepCharcoal border-t border-lightGrey",
    dark: "bg-gradient-to-b from-deepCharcoal to-forest/20 text-cream border-t border-cream/20",
  };

  const linkClasses = "hover:text-forest transition-colors duration-200";
  const socialLinkClasses =
    "p-3 rounded-xl hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md";

  const footerSections = [
    {
      title: "Navigation",
      links: [
        { href: "/", label: "Home" },
        { href: "/content", label: "Content" },
        { href: "/downloads", label: "Downloads" },
        { href: "/events", label: "Events" },
        { href: "/ventures", label: "Ventures" },
      ],
    },
    {
      title: "Resources",
      links: [
        { href: "/content", label: "Fatherhood Frameworks" },
        { href: "/downloads", label: "Founder Tools" },
        { href: "/content", label: "Leadership Resources" },
        { href: "/content", label: "Book Manuscripts" },
      ],
    },
    {
      title: "Connect",
      links: [
        { href: "/contact", label: "Contact" },
        { href: "/newsletter", label: "Newsletter" },
        { href: "/contact", label: "Speaking" },
        { href: "/consulting", label: "Consulting" },
        { href: "/chatham-rooms", label: "Chatham Rooms" },
      ],
    },
  ];

  return (
    <footer className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}>
      <div className="mx-auto max-w-7xl px-4">
        {/* Main Footer Content */}
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Section */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Link href="/" className="mb-6 block">
              <h3 className="bg-gradient-to-r from-forest to-deepCharcoal bg-clip-text font-serif text-2xl font-bold text-transparent">
                {config.title || "Abraham of London"}
              </h3>
            </Link>

            <p className="mb-6 max-w-md text-lg leading-relaxed opacity-80">
              {config.description ||
                "Building enduring legacies through wisdom, strategy, and brotherhood."}
            </p>

            <div className="flex gap-3">
              {socialLinks.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className={`${socialLinkClasses} ${
                    variant === "light"
                      ? "bg-white/70 text-deepCharcoal hover:bg-forest hover:text-cream"
                      : "bg-cream/10 text-cream hover:bg-cream hover:text-deepCharcoal"
                  }`}
                  aria-label={link.label}
                  title={link.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <span className="text-lg font-medium">
                    {link.kind === "twitter" && "𝕏"}
                    {link.kind === "linkedin" && "💼"}
                    {link.kind === "github" && "⚡"}
                    {link.kind === "instagram" && "📸"}
                    {link.kind === "youtube" && "🎥"}
                    {link.kind === "website" && "🌐"}
                    {link.kind === "tiktok" && "🎵"}
                    {link.kind === "facebook" && "📘"}
                    {link.kind === "email" && "✉️"}
                    {link.kind === "phone" && "📞"}
                    {link.kind === "whatsapp" && "💬"}
                    {![
                      "twitter", "linkedin", "github", "instagram", 
                      "youtube", "website", "tiktok", "facebook",
                      "email", "phone", "whatsapp"
                    ].includes(link.kind || '') && "🔗"}
                  </span>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links Sections */}
          {footerSections.map((section, sectionIndex) => (
            <motion.div 
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="mb-6 text-base font-semibold uppercase tracking-wider opacity-70">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link, linkIndex) => (
                  <motion.li 
                    key={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: (sectionIndex * 0.1) + (linkIndex * 0.05) }}
                    viewport={{ once: true }}
                  >
                    <Link
                      href={link.href}
                      className={`text-base font-medium ${linkClasses}`}
                      prefetch={false}
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div 
          className="border-t border-current/20 pt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <p className="text-sm font-medium opacity-70">
                {config.copyright ||
                  `© ${new Date().getFullYear()} Abraham of London. All rights reserved.`}
              </p>

              {config.companyNumber && (
                <p className="mt-2 text-xs opacity-50">
                  Company No: {config.companyNumber}
                  {config.vatNumber && <> • VAT: {config.vatNumber}</>}
                </p>
              )}
            </div>

            <div className="flex items-center gap-8 text-sm font-medium opacity-70">
              <Link href="/sitemap.xml" className={linkClasses}>
                Sitemap
              </Link>
              <Link href="/rss.xml" className={linkClasses}>
                RSS
              </Link>
              <Link href="/security" className={linkClasses}>
                Security
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}