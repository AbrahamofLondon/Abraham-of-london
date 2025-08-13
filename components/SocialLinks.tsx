// components/SocialLinks.tsx
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';

type IconType = string | React.ReactNode;

export interface SocialLinkItem {
  href: string;
  label: string;
  icon: IconType;
  external?: boolean;
  rel?: string;
  className?: string;
  id?: string;
}

interface SocialLinksProps {
  links: SocialLinkItem[];
  size?: number;
  className?: string;
  variant?: 'ghost' | 'solid';
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function isHttp(href: string) {
  return /^https?:\/\//i.test(href);
}

function isMail(href: string) {
  return href.startsWith('mailto:');
}

function isTel(href: string) {
  return href.startsWith('tel:');
}

function getGtag(): ((...args: unknown[]) => void) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  return typeof w.gtag === 'function' ? w.gtag : undefined;
}

function trackSocialClick(label: string, href: string) {
  const gtag = getGtag();
  if (gtag) {
    gtag('event', 'select_content', {
      content_type: 'social_link',
      item_id: label,
      destination: href,
    });
  }
}

export default function SocialLinks({
  links,
  size = 18,
  className,
  variant = 'ghost',
}: SocialLinksProps) {
  const baseBtn = 'inline-flex items-center gap-2 rounded-md px-3 py-2 text-deepCharcoal transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const ghost = 'border border-lightGrey hover:bg-warmWhite focus:ring-deepCharcoal/30';
  const solid = 'bg-deepCharcoal text-warmWhite hover:opacity-90 focus:ring-deepCharcoal/40';

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {links.map((item) => {
        const externalAuto = isHttp(item.href);
        const mail = isMail(item.href);
        const tel = isTel(item.href);
        const isExternal = item.external ?? externalAuto;
        const openNewTab = isExternal && !mail && !tel;

        const rel = openNewTab ? cn('noopener', 'noreferrer', item.rel) : item.rel;
        const aria = openNewTab ? `${item.label} (opens in new tab)` : item.label;

        const iconNode =
          typeof item.icon === 'string' ? (
            <Image
              src={item.icon}
              alt=""
              aria-hidden={true}
              width={size}
              height={size}
              unoptimized={isHttp(item.icon)}
            />
          ) : (
            <span aria-hidden={true}>{item.icon}</span>
          );

        const content = (
          <>
            {iconNode}
            <span>{item.label}</span>
          </>
        );

        const classes = cn(baseBtn, variant === 'ghost' ? ghost : solid, item.className);
        const key = item.id ?? `${item.href}-${item.label}`;

        if (openNewTab) {
          return (
            <a
              key={key}
              href={item.href}
              target="_blank"
              rel={rel || 'noopener noreferrer'}
              aria-label={aria}
              className={classes}
              onClick={() => trackSocialClick(item.label, item.href)}
            >
              {content}
            </a>
          );
        }

        if (isHttp(item.href) || isMail(item.href) || isTel(item.href)) {
          return (
            <a
              key={key}
              href={item.href}
              rel={rel || undefined}
              aria-label={aria}
              className={classes}
              onClick={() => trackSocialClick(item.label, item.href)}
            >
              {content}
            </a>
          );
        }

        return (
          <Link
            key={key}
            href={item.href}
            aria-label={aria}
            className={classes}
            onClick={() => trackSocialClick(item.label, item.href)}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}