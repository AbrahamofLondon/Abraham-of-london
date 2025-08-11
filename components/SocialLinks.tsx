// components/SocialLinks.tsx
import Link from 'next/link';
import Image from 'next/image';

type SocialItem = {
  href: string;
  label: string;
  icon: string;
  external?: boolean;
};

const links: SocialItem[] = [
  { href: 'mailto:info@abrahamoflondon.org', label: 'Email', icon: '/assets/images/social/email.svg' },
  { href: 'tel:+442086225909', label: 'Phone', icon: '/assets/images/social/phone.svg' },
  {
    href: 'https://www.linkedin.com/in/abraham-adaramola-06630321/',
    label: 'LinkedIn',
    icon: '/assets/images/social/linkedin.svg',
    external: true,
  },
  {
    href: 'https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09',
    label: 'X',
    icon: '/assets/images/social/twitter.svg',
    external: true,
  },
  {
    href: 'https://www.facebook.com/share/1MRrKpUzMG/',
    label: 'Facebook',
    icon: '/assets/images/social/facebook.svg',
    external: true,
  },
  {
    href: 'https://wa.me/+447496334022',
    label: 'WhatsApp',
    icon: '/assets/images/social/whatsapp.svg',
    external: true,
  },
];

export default function SocialLinks() {
  return (
    <div className="flex flex-wrap gap-3">
      {links.map((item) =>
        item.external ? (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-lightGrey px-3 py-2 text-deepCharcoal hover:bg-warmWhite"
          >
            <Image src={item.icon} alt="" width={18} height={18} />
            <span>{item.label}</span>
          </a>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            className="inline-flex items-center gap-2 rounded-md border border-lightGrey px-3 py-2 text-deepCharcoal hover:bg-warmWhite"
          >
            <Image src={item.icon} alt="" width={18} height={18} />
            <span>{item.label}</span>
          </Link>
        )
      )}
    </div>
  );
}