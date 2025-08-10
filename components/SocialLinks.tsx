// components/SocialLinks.tsx
import React from 'react';
import Image from 'next/image';

type Social = {
  href: string;
  src: string;   // path under /public
  alt: string;
  external?: boolean;
};

const links: Social[] = [
  { href: 'mailto:info@abrahamoflondon.org', src: '/assets/social/email.svg', alt: 'Email' },
  { href: 'tel:+442086225909', src: '/assets/social/phone.svg', alt: 'Phone' },
  {
    href: 'https://www.linkedin.com/in/abraham-adaramola-06630321/',
    src: '/assets/social/linkedin.svg',
    alt: 'LinkedIn',
    external: true,
  },
  {
    href: 'https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09',
    src: '/assets/social/twitter.svg',
    alt: 'Twitter',
    external: true,
  },
  {
    href: 'https://www.facebook.com/share/1MRrKpUzMG/',
    src: '/assets/social/facebook.svg',
    alt: 'Facebook',
    external: true,
  },
  {
    href: 'https://wa.me/+447496334022',
    src: '/assets/social/whatsapp.svg',
    alt: 'WhatsApp',
    external: true,
  },
];

const SocialLinks: React.FC = () => {
  return (
    <div className="flex gap-4">
      {links.map(({ href, src, alt, external }) => (
        <a
          key={alt}
          href={href}
          aria-label={alt}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="inline-flex"
        >
          {/* Next/Image passes SVG through (no optimization). Width/height make ESLint happy. */}
          <Image src={src} alt={alt} width={24} height={24} unoptimized />
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
