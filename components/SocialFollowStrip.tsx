/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";

type Item = { href: string; src: string; alt: string; label: string };

const items: Item[] = [
  { href: "https://twitter.com/abrahamoflondon",  src: "/assets/images/social/twitter.svg",   alt: "Twitter logo",   label: "Twitter" },
  { href: "https://www.linkedin.com/in/abrahamoflondon", src: "/assets/images/social/linkedin.svg",  alt: "LinkedIn logo",  label: "LinkedIn" },
  { href: "https://instagram.com/abrahamoflondon", src: "/assets/images/social/instagram.svg", alt: "Instagram logo", label: "Instagram" },
  { href: "https://www.facebook.com/share/p/156tQWm2mZ/", src: "/assets/images/social/facebook.svg", alt: "Facebook logo", label: "Facebook" },
  { href: "mailto:hello@abrahamoflondon.org",      src: "/assets/images/social/email.svg",     alt: "Email icon",     label: "Email" },
  { href: "tel:+442086225909",                     src: "/assets/images/social/phone.svg",     alt: "Phone icon",     label: "Call" },
];

const isExternal = (href: string) =>
  href.startsWith("http://") || href.startsWith("https://");

export default function SocialFollowStrip() {
  return (
    <section className="mx-auto my-10 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/10 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-8">
          <p className="text-sm text-deepCharcoal/80 sm:text-base">
            Join the conversation — follow{" "}
            <span className="font-semibold">Abraham of London</span>
          </p>

          <nav aria-label="Social links" className="flex items-center gap-4 sm:gap-6">
            {items.map((it) => {
              const icon = (
                <span className="relative inline-block h-6 w-6">
                  <Image
                    src={it.src}
                    alt={it.alt}
                    fill
                    sizes="24px"
                    className="object-contain"
                  />
                </span>
              );
              const label = <span className="hidden text-sm sm:inline">{it.label}</span>;

              if (isExternal(it.href) || it.href.startsWith("mailto:") || it.href.startsWith("tel:")) {
                return (
                  <a
                    key={it.href}
                    href={it.href}
                    aria-label={it.label}
                    className="group inline-flex items-center gap-2 text-deepCharcoal transition hover:text-forest"
                    target={isExternal(it.href) ? "_blank" : undefined}
                    rel={isExternal(it.href) ? "noopener noreferrer" : undefined}
                  >
                    {icon}
                    {label}
                  </a>
                );
              }

              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-label={it.label}
                  className="group inline-flex items-center gap-2 text-deepCharcoal transition hover:text-forest"
                  prefetch={false}
                >
                  {icon}
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </section>
  );
}
