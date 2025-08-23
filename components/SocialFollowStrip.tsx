// components/SocialFollowStrip.tsx
import Link from "next/link";
import Image from "next/image";

type Item = { href: string; src: string; alt: string; label: string };
type Props = { variant?: "light" | "dark" };

const items: Item[] = [
  { href: "https://twitter.com/abrahamoflondon", src: "/assets/images/social/twitter.svg", alt: "Twitter logo", label: "Twitter" },
  { href: "https://www.facebook.com/share/p/156tQWm2mZ/", src: "/assets/images/social/facebook.svg", alt: "Facebook logo", label: "Facebook" },
  { href: "https://www.linkedin.com/in/abrahamoflondon", src: "/assets/images/social/linkedin.svg", alt: "LinkedIn logo", label: "LinkedIn" },
  { href: "https://instagram.com/abrahamoflondon", src: "/assets/images/social/instagram.svg", alt: "Instagram logo", label: "Instagram" },
  { href: "mailto:info@abrahamoflondon.org", src: "/assets/images/social/email.svg", alt: "Email icon", label: "Email" },
  { href: "tel:+442086225909", src: "/assets/images/social/phone.svg", alt: "Phone icon", label: "Call" },
];

const isExternal = (href: string) => href.startsWith("http://") || href.startsWith("https://");

export default function SocialFollowStrip({ variant = "light" }: Props) {
  const surface =
    variant === "dark"
      ? "from-black/40 to-black/20 ring-white/10"
      : "from-white/90 to-warmWhite/90 ring-deepCharcoal/10";
  const text =
    variant === "dark" ? "text-cream/85" : "text-deepCharcoal/80";
  const brand =
    variant === "dark"
      ? "text-cream"
      : "text-deepCharcoal";

  return (
    <section className="mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-12">
      <div className={`rounded-2xl bg-gradient-to-br ${surface} backdrop-blur-md ring-2 shadow-2xl`}>
        <div className="flex flex-wrap items-center justify-between gap-6 px-8 py-6 sm:px-10 sm:py-8">
          <p className={`text-base sm:text-lg font-serif leading-relaxed ${text}`}>
            Join the conversation — follow{" "}
            <span className={`font-semibold ${brand}`}>Abraham of London</span>
          </p>

          <nav aria-label="Social links" className="flex items-center gap-5 sm:gap-7">
            {items.map((it) => {
              const Button = ({ children }: { children: React.ReactNode }) => (
                <span
                  className={[
                    "inline-flex items-center gap-3 rounded-full px-3 py-2 shadow-lg ring-1 transition-all duration-300",
                    variant === "dark"
                      ? "bg-white/10 text-cream ring-white/20 hover:bg-white/20"
                      : "bg-softGold text-deepCharcoal ring-deepCharcoal/20 hover:bg-forest hover:text-cream hover:scale-105",
                  ].join(" ")}
                >
                  {children}
                </span>
              );

              const Label = <span className="hidden text-sm sm:inline font-serif">{it.label}</span>;
              const Icon = (
                <Image
                  src={it.src}
                  alt={it.alt}
                  width={24}
                  height={24}
                  className="inline-block"
                />
              );

              if (isExternal(it.href) || it.href.startsWith("mailto:") || it.href.startsWith("tel:")) {
                return (
                  <a
                    key={it.href}
                    href={it.href}
                    aria-label={it.label}
                    className="group inline-flex items-center"
                    target={isExternal(it.href) ? "_blank" : undefined}
                    rel={isExternal(it.href) ? "noopener noreferrer" : undefined}
                  >
                    <Button>
                      {Icon}
                      {Label}
                    </Button>
                  </a>
                );
              }

              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-label={it.label}
                  className="group inline-flex items-center"
                  prefetch={false}
                >
                  <Button>
                    {Icon}
                    {Label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </section>
  );
}
