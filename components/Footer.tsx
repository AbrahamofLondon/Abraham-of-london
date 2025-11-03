import * as React from "react";
import Link from "next/link";
import Image from "next/image";

const AOF_URL = process.env.NEXT_PUBLIC_AOF_URL || "https://abrahamoflondon.org";
const INNOVATE_HUB_URL =
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL ||
  process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL ||
  "https://innovatehub-abrahamoflondon.netlify.app";
const ALOMARADA_URL = process.env.NEXT_PUBLIC_ALOMARADA_URL || "https://alomarada.com";
const ENDURELUXE_URL = process.env.NEXT_PUBLIC_ENDURELUXE_URL || "https://endureluxe.com";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@abrahamoflondon.org";

const socials = [
  { href: "https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09", icon: "/assets/images/social/twitter.svg", label: "Twitter / X" },
  { href: "https://www.linkedin.com/in/abraham-adaramola-06630321/", icon: "/assets/images/social/linkedin.svg", label: "LinkedIn" },
  { href: "https://www.instagram.com/abraham_of_london", icon: "/assets/images/social/instagram.svg", label: "Instagram" },
  { href: "https://youtube.com", icon: "/assets/images/social/youtube.svg", label: "YouTube" },
];

const isExternal = (href: string) => /^https?:\/\//i.test(href) || href.startsWith("mailto:");

function SmartLink({
  href,
  children,
  className,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const base =
    className ||
    "hover:text-forest transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-opacity-40 rounded-sm";

  if (isExternal(href)) {
    const isHttp = href.startsWith("http");
    return (
      <a
        href={href}
        className={base}
        aria-label={ariaLabel}
        {...(isHttp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} prefetch={false} className={base} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
