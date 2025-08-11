// components/SocialLinks.tsx

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';

// Define the shape of a single social link object
interface SocialLinkItem {
  href: string;
  label: string;
  icon: string;
  external?: boolean;
}

// Define the props for the SocialLinks component
interface SocialLinksProps {
  links: SocialLinkItem[];
}

// Update the component to accept the defined props
export default function SocialLinks({ links }: SocialLinksProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {links.map((item) => {
        const isExternal = item.external || item.href.startsWith('http') || item.href.startsWith('mailto') || item.href.startsWith('tel');
        
        const linkContent = (
          <>
            <Image
              src={item.icon}
              alt={`Icon for ${item.label}`}
              width={18}
              height={18}
            />
            <span>{item.label}</span>
          </>
        );

        return isExternal ? (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            className="inline-flex items-center gap-2 rounded-md border border-lightGrey px-3 py-2 text-deepCharcoal hover:bg-warmWhite transition-colors"
          >
            {linkContent}
          </a>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            aria-label={item.label}
            className="inline-flex items-center gap-2 rounded-md border border-lightGrey px-3 py-2 text-deepCharcoal hover:bg-warmWhite transition-colors"
          >
            {linkContent}
          </Link>
        );
      })}
    </div>
  );
}