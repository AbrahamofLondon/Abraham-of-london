// components/SocialLinks.tsx - FIXED
import * as React from "react";
import Link from "next/link";
import clsx from "clsx";
import { siteConfig } from "@/config/site";
import { getSocialIcon } from "@/lib/utils/site-utils";
import {
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
  Mail,
  Phone,
  MessageCircle,
  Globe,
} from "lucide-react";

type Props = {
  className?: string;
  showLabels?: boolean;
  showIcons?: boolean;
  iconSize?: "sm" | "md" | "lg";
  maxItems?: number;
};

const isExternal = (href: string) => /^https?:\/\//i.test(href);
const isUtility = (href: string) =>
  href.startsWith("mailto:") ||
  href.startsWith("tel:") ||
  href.startsWith("sms:");

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'x': Twitter,
  'twitter': Twitter,
  'linkedin': Linkedin,
  'instagram': Instagram,
  'facebook': Facebook,
  'youtube': Youtube,
  'email': Mail,
  'phone': Phone,
  'tiktok': MessageCircle,
  'website': Globe,
  'whatsapp': MessageCircle,
};

export default function SocialLinks({ 
  className, 
  showLabels = true,
  showIcons = true,
  iconSize = "md",
  maxItems
}: Props): JSX.Element | null {
  // Get social links from siteConfig.socials
  const socials = siteConfig.socials || [];
  
  // Apply maxItems if specified
  const displaySocials = maxItems ? socials.slice(0, maxItems) : socials;

  if (!displaySocials.length) return null;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  const getIconColor = (kind: string) => {
    const colorMap: Record<string, string> = {
      'x': 'text-gray-800 hover:text-black dark:text-gray-300 dark:hover:text-white',
      'twitter': 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300',
      'linkedin': 'text-blue-700 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400',
      'instagram': 'text-pink-600 hover:text-pink-700 dark:text-pink-500 dark:hover:text-pink-400',
      'facebook': 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
      'youtube': 'text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400',
      'email': 'text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400',
      'phone': 'text-purple-600 hover:text-purple-700 dark:text-purple-500 dark:hover:text-purple-400',
      'tiktok': 'text-black hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100',
    };
    return colorMap[kind] || 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200';
  };

  return (
    <ul
      className={clsx("flex flex-wrap items-center gap-3", className)}
      role="list"
      aria-label="Social media links"
    >
      {displaySocials.map((social, i) => {
        if (!social.href) return null;

        const external = isExternal(social.href);
        const utility = isUtility(social.href);
        const Icon = iconMap[social.kind] || Globe;

        const linkClasses = clsx(
          "flex items-center gap-2 transition-colors duration-200",
          getIconColor(social.kind),
          "hover:scale-105 active:scale-95"
        );

        const content = (
          <>
            {showIcons && (
              <Icon className={clsx(sizeClasses[iconSize], "flex-shrink-0")} />
            )}
            {showLabels && (
              <span className="text-sm font-medium whitespace-nowrap">
                {social.label}
              </span>
            )}
          </>
        );

        // External links (social media, external websites)
        if (external && !utility) {
          return (
            <li key={`${social.kind}-${i}`}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClasses}
                aria-label={`Visit our ${social.label} profile (opens in new tab)`}
                title={social.label}
              >
                {content}
              </a>
            </li>
          );
        }

        // Utility links (mailto, tel, etc.)
        if (utility) {
          return (
            <li key={`${social.kind}-${i}`}>
              <a 
                href={social.href} 
                className={linkClasses}
                aria-label={`Contact us via ${social.label}`}
                title={social.label}
              >
                {content}
              </a>
            </li>
          );
        }

        // Internal links (should be rare for social links)
        return (
          <li key={`${social.kind}-${i}`}>
            <Link
              href={social.href}
              className={linkClasses}
              aria-label={social.label}
              title={social.label}
              prefetch={false}
            >
              {content}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// Compact version for headers/footers
export function SocialLinksCompact({
  className,
  iconSize = "sm",
  maxItems = 4,
}: {
  className?: string;
  iconSize?: "sm" | "md";
  maxItems?: number;
}) {
  return (
    <SocialLinks
      className={className}
      showLabels={false}
      showIcons={true}
      iconSize={iconSize}
      maxItems={maxItems}
    />
  );
}

// Inline version for text paragraphs
export function SocialLinksInline({
  className,
  separator = " • ",
}: {
  className?: string;
  separator?: string;
}) {
  const socials = siteConfig.socials || [];
  
  if (!socials.length) return null;

  return (
    <span className={clsx("inline-flex flex-wrap items-center gap-1", className)}>
      {socials.map((social, index) => (
        <React.Fragment key={social.kind}>
          <a
            href={social.href}
            target={isExternal(social.href) ? "_blank" : undefined}
            rel={isExternal(social.href) ? "noopener noreferrer" : undefined}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2"
          >
            {social.label}
          </a>
          {index < socials.length - 1 && (
            <span className="text-gray-400">{separator}</span>
          )}
        </React.Fragment>
      ))}
    </span>
  );
}