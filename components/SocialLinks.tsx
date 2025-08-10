import Link from 'next/link';

type Item = {
  href: string;
  label: string;
  aria: string;
  svg: React.ReactNode;
};

const iconClass =
  'w-5 h-5 stroke-[1.75] transition-transform group-hover:scale-110';

export default function SocialLinks() {
  const items: Item[] = [
    {
      href: 'mailto:info@abrahamoflondon.org',
      label: 'Email',
      aria: 'Email Abraham of London',
      svg: (
        <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden>
          <path d="M4 6h16v12H4z" stroke="currentColor" />
          <path d="m4 7 8 6 8-6" stroke="currentColor" />
        </svg>
      ),
    },
    {
      href: 'tel:+442086225909',
      label: 'Phone',
      aria: 'Call Abraham of London',
      svg: (
        <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden>
          <path d="M5 4h3l2 4-2 2a12 12 0 0 0 6 6l2-2 4 2v3a2 2 0 0 1-2 2A17 17 0 0 1 4 7a2 2 0 0 1 1-3Z" stroke="currentColor" />
        </svg>
      ),
    },
    {
      href: 'https://www.linkedin.com/in/abraham-adaramola-06630321/',
      label: 'LinkedIn',
      aria: 'LinkedIn profile',
      svg: (
        <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden>
          <path d="M6.94 8.5v9.06M4 8.5h5.88M6.94 6A2.06 2.06 0 1 1 6.94 2a2.06 2.06 0 0 1 0 4Z" stroke="currentColor"/>
          <path d="M12 17.56V8.5h3.88v1.76a3 3 0 0 1 5.06 2.12v5.18" stroke="currentColor"/>
        </svg>
      ),
    },
    {
      href: 'https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09',
      label: 'X',
      aria: 'X (Twitter) profile',
      svg: (
        <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden>
          <path d="M3 3l18 18M20 4 8 19" stroke="currentColor"/>
        </svg>
      ),
    },
    {
      href: 'https://www.facebook.com/share/1MRrKpUzMG/',
      label: 'Facebook',
      aria: 'Facebook page',
      svg: (
        <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden>
          <path d="M14 9h3V6h-3a3 3 0 0 0-3 3v3H8v3h3v6h3v-6h3l1-3h-4V9Z" stroke="currentColor"/>
        </svg>
      ),
    },
    {
      href: 'https://wa.me/+447496334022',
      label: 'WhatsApp',
      aria: 'WhatsApp chat',
      svg: (
        <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden>
          <path d="M12 21a9 9 0 1 0-7.8-4.38L3 21l4.4-1.2A9 9 0 0 0 12 21Z" stroke="currentColor"/>
          <path d="M8.5 9.5c.2 2.2 1.8 3.8 4 4l1.5-1.5 2 1" stroke="currentColor"/>
        </svg>
      ),
    },
  ];

  return (
    <nav aria-label="Social links" className="flex gap-3 flex-wrap">
      {items.map((it) => (
        <Link
          key={it.label}
          href={it.href}
          target={it.href.startsWith('http') ? '_blank' : undefined}
          rel={it.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          aria-label={it.aria}
          className="group inline-flex items-center gap-2 rounded-md border border-lightGrey px-3 py-1.5 text-deepCharcoal hover:text-forest hover:border-forest transition"
        >
          {it.svg}
          <span className="text-sm">{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
