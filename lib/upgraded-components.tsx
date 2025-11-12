/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-anonymous-default-export */
/* lib/upgraded-components.tsx */
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

/* ============================================================================
   TYPES & INTERFACES
   ========================================================================== */

export type SocialPlatform =
  | "x"
  | "linkedin"
  | "instagram"
  | "youtube"
  | "github"
  | "facebook"
  | "website";

export interface SocialLink {
  href: string;
  icon: string;
  label: string;
  kind: SocialPlatform;
  priority?: number;
}

export interface VentureLink {
  href: string;
  label: string;
  description: string;
  icon?: string;
  priority?: number;
}

export type LinkVariant = "default" | "embossed" | "minimal" | "primary";
export type LinkSize = "sm" | "md" | "lg" | "xl";
export type ColorVariant = "light" | "dark" | "auto";

/* ============================================================================
   CONFIGURATION
   ========================================================================== */

const isProd = process.env.NODE_ENV === "production";

/** Safe env accessor – warns only in prod if missing (avoids noisy dev logs). */
const getEnvVar = (key: string, fallback: string): string => {
  const v = process.env[key];
  if (!v && isProd) {
    // eslint-disable-next-line no-console
    console.warn(`Missing env ${key}; using fallback: ${fallback}`);
  }
  return v || fallback;
};

const AOF_URL = getEnvVar("NEXT_PUBLIC_AOF_URL", "https://abrahamoflondon.org");
const INNOVATE_HUB_URL = getEnvVar(
  "NEXT_PUBLIC_INNOVATEHUB_URL",
  getEnvVar(
    "NEXT_PUBLIC_INNOVATEHUB_ALT_URL",
    "https://innovatehub-abrahamoflondon.netlify.app",
  ),
);
const ALOMARADA_URL = getEnvVar("NEXT_PUBLIC_ALOMARADA_URL", "https://alomarada.com");
const ENDURELUXE_URL = getEnvVar("NEXT_PUBLIC_ENDURELUXE_URL", "https://endureluxe.com");
const CONTACT_EMAIL = getEnvVar("NEXT_PUBLIC_CONTACT_EMAIL", "info@abrahamoflondon.org");

/** Social links (sorted by priority) */
export const socials: SocialLink[] = [
  {
    href: "https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09",
    icon: "/assets/images/social/x.svg",
    label: "X (Twitter)",
    kind: "x",
    priority: 1,
  },
  {
    href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    icon: "/assets/images/social/linkedin.svg",
    label: "LinkedIn",
    kind: "linkedin",
    priority: 2,
  },
  {
    href: "https://www.instagram.com/abraham_of_london",
    icon: "/assets/images/social/instagram.svg",
    label: "Instagram",
    kind: "instagram",
    priority: 3,
  },
  {
    href: "https://youtube.com",
    icon: "/assets/images/social/youtube.svg",
    label: "YouTube",
    kind: "youtube",
    priority: 4,
  },
].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

/** Venture links (sorted by priority) */
export const ventures: VentureLink[] = [
  { href: AOF_URL, label: "Abraham of London", description: "Leadership & Legacy", priority: 1 },
  { href: INNOVATE_HUB_URL, label: "Innovate Hub", description: "Technology & Innovation", priority: 2 },
  { href: ALOMARADA_URL, label: "Alo Marada", description: "Luxury & Lifestyle", priority: 3 },
  { href: ENDURELUXE_URL, label: "Endure Luxe", description: "Resilience & Excellence", priority: 4 },
].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

/* ============================================================================
   UTILITIES
   ========================================================================== */

export const isExternal = (href: string): boolean =>
  /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");

export const isEmail = (href: string): boolean => href.startsWith("mailto:");
export const isPhone = (href: string): boolean => href.startsWith("tel:");

export const getLinkProps = (href: string) => {
  const external = isExternal(href);
  const email = isEmail(href);
  const phone = isPhone(href);

  return {
    external,
    email,
    phone,
    target: external && !email && !phone ? "_blank" : undefined,
    rel: external && !email && !phone ? "noopener noreferrer" : undefined,
  };
};

/* ============================================================================
   CORE COMPONENTS
   ========================================================================== */

export interface SmartLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  variant?: LinkVariant;
  size?: LinkSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  onClick?: (event: React.MouseEvent) => void;
}

export function SmartLink({
  href,
  children,
  className = "",
  ariaLabel,
  variant = "default",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  onClick,
}: SmartLinkProps) {
  const baseStyles: Record<LinkVariant, string> = {
    default: `
      inline-flex items-center justify-center font-medium transition-all duration-200
      hover:text-forest focus-visible:outline-none focus-visible:ring-2 
      focus-visible:ring-forest focus-visible:ring-opacity-40 rounded-sm
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    embossed: `
      inline-flex items-center justify-center rounded-xl border transition-all duration-300
      bg-gradient-to-b from-white to-gray-100 border-gray-300/60
      shadow-[inset_0_2px_4px_rgba(0,0,0,0.05),inset_0_-1px_0_rgba(255,255,255,0.8)]
      hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.08),inset_0_-1px_0_rgba(255,255,255,0.9)]
      hover:scale-105 active:scale-95
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest
      text-gray-800 hover:text-forest
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    `,
    minimal: `
      inline-flex items-center justify-center transition-colors duration-200
      hover:text-forest focus-visible:outline-none focus-visible:ring-2 
      focus-visible:ring-forest rounded-sm
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    primary: `
      inline-flex items-center justify-center bg-forest text-white font-semibold
      rounded-xl transition-all duration-300 hover:bg-forest/90 hover:scale-105
      active:scale-95 focus-visible:outline-none focus-visible:ring-2 
      focus-visible:ring-forest focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    `,
  };

  const sizeStyles: Record<LinkSize, string> = {
    sm: "px-3 py-1.5 text-sm min-h-[36px] gap-1.5",
    md: "px-4 py-2 text-base min-h-[44px] gap-2",
    lg: "px-6 py-3 text-lg min-h-[52px] gap-2.5",
    xl: "px-8 py-4 text-xl min-h-[60px] gap-3",
  };

  const linkProps = getLinkProps(href);
  const baseClass = `
    ${baseStyles[variant]} 
    ${sizeStyles[size]} 
    ${loading ? "opacity-70 cursor-wait" : ""}
    ${className}
  `.trim();

  const content = (
    <>
      {icon && iconPosition === "left" && <span className="flex-shrink-0">{icon}</span>}
      {loading ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span aria-live="polite">Loading…</span>
        </span>
      ) : (
        children
      )}
      {icon && iconPosition === "right" && <span className="flex-shrink-0">{icon}</span>}
    </>
  );

  if (disabled) {
    return (
      <span className={baseClass} aria-disabled="true">
        {content}
      </span>
    );
  }

  if (linkProps.external) {
    return (
      <a
        href={href}
        className={baseClass}
        aria-label={ariaLabel}
        target={linkProps.target}
        rel={linkProps.rel}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} prefetch={false} className={baseClass} aria-label={ariaLabel} onClick={onClick}>
      {content}
    </Link>
  );
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClasses: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };
  return (
    <span
      className={`
        inline-block align-middle animate-spin rounded-full border-2 
        border-gray-300 border-t-forest ${sizeClasses[size]} ${className}
      `}
      aria-hidden="true"
    />
  );
}

/* ============================================================================
   SOCIAL COMPONENTS
   ========================================================================== */

export interface SocialLinksProps {
  variant?: ColorVariant;
  className?: string;
  showLabels?: boolean;
  size?: LinkSize;
  maxItems?: number;
}

export function SocialLinks({
  variant = "light",
  className = "",
  showLabels = false,
  size = "md",
  maxItems,
}: SocialLinksProps) {
  const displaySocials = maxItems ? socials.slice(0, maxItems) : socials;
  const resolvedVariant = variant === "auto" ? "light" : variant;

  return (
    <div className={`flex items-center gap-3 ${className}`} role="list" aria-label="Social media links">
      {displaySocials.map((social) => (
        <SmartLink
          key={social.href}
          href={social.href}
          ariaLabel={`Follow on ${social.label}`}
          variant="embossed"
          size={size}
          className="min-w-[44px] min-h-[44px]"
        >
          <span
            className={`
              flex items-center gap-2 transition-colors duration-300
              ${resolvedVariant === "dark" ? "text-gray-200 hover:text-amber-200" : "text-gray-700 hover:text-forest"}
            `}
          >
            <span
              className={`
                relative rounded-lg p-2 transition-all duration-300
                ${
                  resolvedVariant === "dark"
                    ? "bg-gradient-to-b from-gray-700 to-gray-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
                    : "bg-gradient-to-b from-gray-200 to-gray-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
                }
              `}
            >
              <Image
                src={social.icon}
                alt=""
                width={20}
                height={20}
                priority={false}
                loading="lazy"
                aria-hidden="true"
                className={`transition-all duration-300 ${
                  resolvedVariant === "dark" ? "brightness-125" : "brightness-90"
                }`}
              />
            </span>
            {showLabels && <span className="text-sm font-medium hidden sm:inline-block">{social.label}</span>}
          </span>
        </SmartLink>
      ))}
    </div>
  );
}

/* ============================================================================
   VENTURE COMPONENTS
   ========================================================================== */

export interface VentureLinksProps {
  variant?: ColorVariant;
  className?: string;
  maxItems?: number;
}

export function VentureLinks({ variant = "light", className = "", maxItems }: VentureLinksProps) {
  const displayVentures = maxItems ? ventures.slice(0, maxItems) : ventures;
  const resolvedVariant = variant === "auto" ? "light" : variant;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`} role="list" aria-label="Business ventures">
      {displayVentures.map((venture) => (
        <SmartLink
          key={venture.href}
          href={venture.href}
          variant="embossed"
          className="text-center group p-4 h-full"
          ariaLabel={`Visit ${venture.label} - ${venture.description}`}
        >
          <div
            className={`
              transition-all duration-300 group-hover:scale-105 h-full flex flex-col justify-center
              ${resolvedVariant === "dark" ? "text-gray-200 hover:text-amber-200" : "text-gray-700 hover:text-forest"}
            `}
          >
            <h3 className="font-serif font-semibold text-lg mb-1">{venture.label}</h3>
            <p
              className={`
                text-sm opacity-75 transition-opacity duration-300 group-hover:opacity-100
                ${resolvedVariant === "dark" ? "text-gray-400" : "text-gray-600"}
              `}
            >
              {venture.description}
            </p>
          </div>
        </SmartLink>
      ))}
    </div>
  );
}

/* ============================================================================
   CONTACT COMPONENTS
   ========================================================================== */

export interface ContactSectionProps {
  variant?: ColorVariant;
  className?: string;
  title?: string;
  description?: string;
  showIcons?: boolean;
}

export function ContactSection({
  variant = "light",
  className = "",
  title = "Get in Touch",
  description = "Ready to start a conversation about leadership, legacy, or your next venture?",
  showIcons = true,
}: ContactSectionProps) {
  const resolvedVariant = variant === "auto" ? "light" : variant;
  const textColor = resolvedVariant === "dark" ? "text-gray-200" : "text-gray-700";
  const subtitleColor = resolvedVariant === "dark" ? "text-gray-400" : "text-gray-600";

  const EmailIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  );

  const ContactIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );

  return (
    <div className={`text-center ${className}`}>
      <h2 className={`font-serif text-2xl font-semibold mb-4 ${textColor}`}>{title}</h2>
      <p className={`mb-6 max-w-2xl mx-auto ${subtitleColor}`}>{description}</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <SmartLink
          href={`mailto:${CONTACT_EMAIL}`}
          variant="embossed"
          size="lg"
          className="font-semibold"
          icon={showIcons ? <EmailIcon /> : undefined}
        >
          Email Us
        </SmartLink>
        <SmartLink href="/contact" variant="primary" size="lg" icon={showIcons ? <ContactIcon /> : undefined}>
          Contact Form
        </SmartLink>
      </div>
    </div>
  );
}

/* ============================================================================
   COMPOSITE COMPONENTS
   ========================================================================== */

export interface EnhancedFooterProps {
  variant?: ColorVariant;
  className?: string;
  showSocial?: boolean;
  showVentures?: boolean;
  showContact?: boolean;
}

export function EnhancedFooter({
  variant = "light",
  className = "",
  showSocial = true,
  showVentures = true,
  showContact = true,
}: EnhancedFooterProps) {
  const resolvedVariant = variant === "auto" ? "light" : variant;
  const bgColor =
    resolvedVariant === "dark"
      ? "bg-gradient-to-b from-gray-900 to-gray-800 border-t border-gray-700"
      : "bg-gradient-to-b from-white to-gray-50 border-t border-gray-300";

  const textColor = resolvedVariant === "dark" ? "text-gray-200" : "text-gray-700";
  const subtitleColor = resolvedVariant === "dark" ? "text-gray-400" : "text-gray-600";
  const borderColor = resolvedVariant === "dark" ? "border-gray-700" : "border-gray-300";

  return (
    <footer className={`${bgColor} ${className}`} role="contentinfo">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <h3 className={`font-serif text-2xl font-bold mb-4 ${textColor}`}>Abraham of London</h3>
            <p className={`mb-4 ${subtitleColor}`}>
              Building legacies through principled leadership, innovative ventures, and timeless wisdom.
            </p>
            {showSocial && <SocialLinks variant={resolvedVariant} />}
          </div>

          {/* Ventures Section */}
          {showVentures && (
            <div>
              <h4 className={`font-serif text-lg font-semibold mb-4 ${textColor}`}>Ventures</h4>
              <VentureLinks variant={resolvedVariant} maxItems={2} />
            </div>
          )}

          {/* Contact Section */}
          {showContact && (
            <div>
              <ContactSection variant={resolvedVariant} showIcons={false} />
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className={`border-t pt-6 text-center ${borderColor}`}>
          <p className={`text-sm ${subtitleColor}`}>© {new Date().getFullYear()} Abraham of London. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4" role="list">
            <SmartLink href="/privacy" variant="minimal" className="text-sm">
              Privacy
            </SmartLink>
            <SmartLink href="/terms" variant="minimal" className="text-sm">
              Terms
            </SmartLink>
            <SmartLink href="/sitemap" variant="minimal" className="text-sm">
              Sitemap
            </SmartLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

export interface QuickActionBarProps {
  variant?: ColorVariant;
  className?: string;
  title?: string;
  description?: string;
}

export function QuickActionBar({
  variant = "light",
  className = "",
  title = "Ready to Transform Your Leadership?",
  description = "Connect with Abraham for speaking, consulting, or mentorship.",
}: QuickActionBarProps) {
  const resolvedVariant = variant === "auto" ? "light" : variant;

  return (
    <aside
      className={`
        bg-gradient-to-b from-white to-gray-50 border-b border-gray-300/60 p-4
        ${resolvedVariant === "dark" ? "text-gray-200" : "text-gray-700"}
        ${className}
      `}
      role="complementary"
      aria-label="Quick actions"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
        <div className="text-center sm:text-left">
          <h3 className="font-serif text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm opacity-75">{description}</p>
        </div>
        <div className="flex gap-3">
          <SmartLink href={`mailto:${CONTACT_EMAIL}`} variant="embossed" size="sm" className="whitespace-nowrap">
            Quick Email
          </SmartLink>
          <SmartLink href="/contact" variant="primary" size="sm" className="whitespace-nowrap">
            Book Call
          </SmartLink>
        </div>
      </div>
    </aside>
  );
}

/* ============================================================================
   DEFAULT EXPORTS
   ========================================================================== */

export default {
  SmartLink,
  SocialLinks,
  VentureLinks,
  ContactSection,
  EnhancedFooter,
  QuickActionBar,
  LoadingSpinner,
  socials,
  ventures,
  isExternal,
  isEmail,
  isPhone,
  getLinkProps,
};