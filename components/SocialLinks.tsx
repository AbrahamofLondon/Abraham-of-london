/* components/SocialLinks.tsx — REFINED & HARDENED */
"use client";

import * as React from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  Twitter, Linkedin, Instagram, Facebook,
  Youtube, Mail, Phone, MessageCircle, Globe,
} from "lucide-react";

import { getSocialLinks } from "@/config/site";

type Props = {
  className?: string;
  showLabels?: boolean;
  showIcons?: boolean;
  iconSize?: "sm" | "md" | "lg";
  maxItems?: number;
};

const iconMap: Record<string, React.ComponentType<any>> = {
  x: Twitter, twitter: Twitter, linkedin: Linkedin,
  instagram: Instagram, facebook: Facebook, youtube: Youtube,
  email: Mail, phone: Phone, tiktok: MessageCircle,
  whatsapp: MessageCircle, website: Globe, github: Globe,
};

export default function SocialLinks({
  className,
  showLabels = true,
  showIcons = true,
  iconSize = "md",
  maxItems = 10,
}: Props): JSX.Element | null {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const socials = getSocialLinks();
  const display = Array.isArray(socials) ? socials.slice(0, maxItems) : [];

  if (!mounted || !display.length) return null;

  const sizeClasses = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" } as const;

  return (
    <ul className={clsx("flex flex-wrap items-center gap-3", className)} role="list">
      {display.map((social, i) => {
        const href = String(social?.href || "").trim();
        if (!href) return null;

        const kind = String(social?.kind || "website").toLowerCase();
        const Icon = iconMap[kind] || Globe;
        const external = /^https?:\/\//i.test(href);
        const utility = href.startsWith("mailto:") || href.startsWith("tel:");

        const linkClasses = clsx(
          "inline-flex items-center gap-2",
          "text-zinc-400 hover:text-amber-500 transition-all duration-300",
          "hover:scale-[1.03] active:scale-[0.98]"
        );

        const content = (
          <>
            {showIcons && <Icon className={clsx(sizeClasses[iconSize], "shrink-0")} />}
            {showLabels && (
              <span className="text-[10px] font-mono uppercase tracking-wider whitespace-nowrap">
                {social.label || kind}
              </span>
            )}
          </>
        );

        return (
          <li key={`${kind}-${i}`}>
            {external && !utility ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className={linkClasses}>
                {content}
              </a>
            ) : utility ? (
              <a href={href} className={linkClasses}>
                {content}
              </a>
            ) : (
              <Link href={href} className={linkClasses}>
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function SocialLinksCompact(props: any) {
  return <SocialLinks {...props} showLabels={false} showIcons iconSize={props.iconSize || "sm"} />;
}