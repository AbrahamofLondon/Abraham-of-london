// components/SocialLinks.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const SocialLinks: React.FC = () => {
  return (
    <div className="flex gap-4">
      <Link href="mailto:info@abrahamoflondon.org" aria-label="Email">
        <Image src="/assets/social/email.svg" alt="Email" width={24} height={24} loading="lazy" />
      </Link>
      <Link href="tel:+442086225909" aria-label="Phone">
        <Image src="/assets/social/phone.svg" alt="Phone" width={24} height={24} loading="lazy" />
      </Link>
      <Link href="https://www.linkedin.com/in/abraham-adaramola-06630321/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
        <Image src="/assets/social/linkedin.svg" alt="LinkedIn" width={24} height={24} loading="lazy" />
      </Link>
      <Link href="https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
        <Image src="/assets/social/twitter.svg" alt="X (Twitter)" width={24} height={24} loading="lazy" />
      </Link>
      <Link href="https://www.facebook.com/share/1MRrKpUzMG/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
        <Image src="/assets/social/facebook.svg" alt="Facebook" width={24} height={24} loading="lazy" />
      </Link>
      <Link href="https://wa.me/+442086225909" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
        <Image src="/assets/social/whatsapp.svg" alt="WhatsApp" width={24} height={24} loading="lazy" />
      </Link>
    </div>
  );
};

export default SocialLinks;