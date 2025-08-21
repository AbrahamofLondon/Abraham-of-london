import Image from "next/image";
import Link from "next/link";

type Item = { href: string; src: string; alt: string; label: string };

const items: Item[] = [
  { href: "https://twitter.com/abrahamoflondon", src: "/assets/images/social/twitter.svg", alt: "Twitter logo", label: "Twitter" },
  { href: "https://www.facebook.com/share/p/156tQWm2mZ/", src: "/assets/images/social/facebook.svg", alt: "Facebook logo", label: "Facebook" },
  { href: "https://www.linkedin.com/in/abrahamoflondon", src: "/assets/images/social/linkedin.svg", alt: "LinkedIn logo", label: "LinkedIn" },
  { href: "https://instagram.com/abrahamoflondon", src: "/assets/images/social/instagram.svg", alt: "Instagram logo", label: "Instagram" },
  { href: "mailto:info@abrahamoflondon.org", src: "/assets/images/social/email.svg", alt: "Email icon", label: "Email" },
  { href: "tel:+442086225909", src: "/assets/images/social/phone.svg", alt: "Phone icon", label: "Call" },
];

const isExternal = (href: string) =>
  href.startsWith("http://") || href.startsWith("https://");

export default function SocialFollowStrip() {
  return (
    <section className="mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-12">
      <div className="rounded-2xl bg-gradient-to-br from-white/90 to-warmWhite/90 backdrop-blur-md ring-2 ring-deepCharcoal/10 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-6 px-8 py-6 sm:px-10 sm:py-8">
          <p className="text-base text-deepCharcoal/80 sm:text-lg font-serif leading-relaxed">
            Join the conversation — follow{" "}
            <span className="font-semibold text-deepCharcoal">Abraham of London</span>
          </p>

          <nav aria-label="Social links" className="flex items-center gap-5 sm:gap-7">
            {items.map((it) => {
              const icon = (
                <span className="relative inline-block h-7 w-7 sm:h-8 sm:w-8 transition-transform group-hover:scale-110">
                  <Image
                    src={it.src}
                    alt={it.alt}
                    fill
                    sizes="32px"
                    className="object-contain"
                    priority={false}
                  />
                </span>
              );
              const label = <span className="hidden text-sm sm:inline font-serif">{it.label}</span>;

              if (isExternal(it.href) || it.href.startsWith("mailto:") || it.href.startsWith("tel:")) {
                return (
                  <a
                    key={it.href}
                    href={it.href}
                    aria-label={it.label}
                    className="group inline-flex items-center gap-3 text-deepCharcoal hover:text-forest transition-all duration-300"
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
                  className="group inline-flex items-center gap-3 text-deepCharcoal hover:text-forest transition-all duration-300"
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