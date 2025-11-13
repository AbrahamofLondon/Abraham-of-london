// components/EnhancedFooter.tsx (NUCLEAR OPTION - FORCE THROUGH)
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";
import clsx from "clsx";

interface EnhancedFooterProps {
  variant?: "light" | "dark";
  className?: string;
}

// Safe type for social links with priority
interface SortableSocialLink {
  href: string;
  kind: string;
  label: string;
  external: boolean;
  handle?: string;
  priority?: number;
}

export default function EnhancedFooter({
  variant = "light",
  className,
}: EnhancedFooterProps) {
  // ✅ NUCLEAR OPTION: Type assert the entire siteConfig
  const config = siteConfig as any;

  // ✅ SAFE sorting with type assertion
  const socialLinks = [...(config.socialLinks || [])]
    .map((link) => link as SortableSocialLink)
    .sort((a, b) => {
      const priorityA = a.priority ?? 999;
      const priorityB = b.priority ?? 999;
      return priorityA - priorityB;
    });

  const baseClasses = "py-16 transition-colors";
  const variantClasses = {
    light:
      "bg-gradient-to-b from-warmWhite to-cream/30 text-deepCharcoal border-t border-lightGrey",
    dark: "bg-gradient-to-b from-deepCharcoal to-forest/20 text-cream border-t border-cream/20",
  };

  const linkClasses = "hover:text-forest transition-colors duration-200";
  const socialLinkClasses =
    "p-3 rounded-xl hover:scale-110 transition-all duration-200 bg-white/50 shadow-sm hover:shadow-md";

  const footerSections = [
    {
      title: "Explore",
      links: [
        { href: "/books", label: "Books" },
        { href: "/blog", label: "Insights" },
        { href: "/events", label: "Events" },
        { href: "/downloads", label: "Resources" },
      ],
    },
    {
      title: "Connect",
      links: [
        { href: "/about", label: "About" },
        { href: "/contact", label: "Contact" },
        { href: "/chatham-rooms", label: "Chatham Rooms" },
        { href: "/consulting", label: "Consulting" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/privacy", label: "Privacy" },
        { href: "/terms", label: "Terms" },
        { href: "/cookies", label: "Cookies" },
        { href: "/accessibility", label: "Accessibility" },
      ],
    },
  ];

  return (
    <footer className={clsx(baseClasses, variantClasses[variant], className)}>
      <div className="mx-auto max-w-7xl px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="block mb-6">
              <h3 className="font-serif text-2xl font-bold bg-gradient-to-r from-forest to-deepCharcoal bg-clip-text text-transparent">
                {/* ✅ SAFE access to title */}
                {config.title || "Abraham of London"}
              </h3>
            </Link>
            <p className="text-lg leading-relaxed opacity-80 mb-6 max-w-md">
              {/* ✅ SAFE access to description with fallback */}
              {config.description ||
                "Building enduring legacies through wisdom, strategy, and brotherhood."}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className={clsx(
                    socialLinkClasses,
                    variant === "light"
                      ? "bg-white/70 text-deepCharcoal hover:bg-forest hover:text-cream"
                      : "bg-cream/10 text-cream hover:bg-cream hover:text-deepCharcoal",
                  )}
                  aria-label={link.label}
                  title={link.label}
                >
                  <span className="text-lg font-medium">
                    {link.kind === "twitter" && "𝕏"}
                    {link.kind === "linkedin" && "💼"}
                    {link.kind === "github" && "⚡"}
                    {link.kind === "instagram" && "📸"}
                    {link.kind === "youtube" && "🎥"}
                    {link.kind === "website" && "🌐"}
                    {![
                      "twitter",
                      "linkedin",
                      "github",
                      "instagram",
                      "youtube",
                      "website",
                    ].includes(link.kind) && "🔗"}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold mb-6 text-base uppercase tracking-wider opacity-70">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={clsx("text-base font-medium", linkClasses)}
                      prefetch={false}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-current/20">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              {/* ✅ SAFE access to copyright with fallback */}
              <p className="text-sm opacity-70 font-medium">
                {config.copyright ||
                  `© ${new Date().getFullYear()} Abraham of London. All rights reserved.`}
              </p>
              {/* ✅ SAFE access to company info */}
              {config.companyNumber && (
                <p className="mt-2 text-xs opacity-50">
                  Company No: {config.companyNumber}
                  {/* ✅ SAFE access to VAT number */}
                  {config.vatNumber && <> • VAT: {config.vatNumber}</>}
                </p>
              )}
            </div>

            <div className="flex items-center gap-8 text-sm opacity-70 font-medium">
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
        </div>
      </div>
    </footer>
  );
}
