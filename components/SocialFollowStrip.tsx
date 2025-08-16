import Image from "next/image";
import Link from "next/link";

type Item = { href: string; src: string; alt: string; label: string };

const items: Item[] = [
  { href: "https://twitter.com/abrahamoflondon",  src: "/assets/images/social/twitter.svg",   alt: "Twitter logo",   label: "Twitter" },
  { href: "https://www.linkedin.com/in/abrahamoflondon", src: "/assets/images/social/linkedin.svg",  alt: "LinkedIn logo",  label: "LinkedIn" },
  { href: "https://instagram.com/abrahamoflondon", src: "/assets/images/social/instagram.svg", alt: "Instagram logo", label: "Instagram" },
  { href: "mailto:hello@abrahamoflondon.org",      src: "/assets/images/social/email.svg",     alt: "Email icon",     label: "Email" },
  { href: "tel:+44...",                             src: "/assets/images/social/phone.svg",     alt: "Phone icon",     label: "Call" },
];

export default function SocialFollowStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 my-10">
      <div className="rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/10 shadow-xl">
        <div className="px-6 py-5 sm:px-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm sm:text-base text-deepCharcoal/80">
            Join the conversation — follow <span className="font-semibold">Abraham of London</span>
          </p>
          <nav aria-label="Social links" className="flex items-center gap-4 sm:gap-6">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                aria-label={it.label}
                className="group inline-flex items-center gap-2 text-deepCharcoal hover:text-forest transition"
                target={it.href.startsWith("http") ? "_blank" : undefined}
                rel={it.href.startsWith("http") ? "noreferrer noopener" : undefined}
              >
                <span className="relative inline-block h-6 w-6">
                  <Image src={it.src} alt={it.alt} fill className="object-contain" />
                </span>
                <span className="hidden sm:inline text-sm">{it.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
