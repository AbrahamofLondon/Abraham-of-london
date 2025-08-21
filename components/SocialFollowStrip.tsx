import Link from "next/link";
import {
  IconX,
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconYouTube,
  IconWhatsApp,
  IconMail,
  IconPhone,
} from "@/components/icons/SocialIcons";

type Item = {
  href: string;
  label: string;
  Icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
};

const socials: Item[] = [
  { href: "https://twitter.com/abrahamoflondon", label: "Twitter / X", Icon: IconX },
  { href: "https://www.facebook.com/share/p/156tQWm2mZ/", label: "Facebook", Icon: IconFacebook },
  { href: "https://www.linkedin.com/in/abrahamoflondon", label: "LinkedIn", Icon: IconLinkedIn },
  { href: "https://instagram.com/abrahamoflondon", label: "Instagram", Icon: IconInstagram },
];

const direct: Item[] = [
  { href: "https://www.youtube.com/@abrahamoflondon", label: "YouTube", Icon: IconYouTube },
  { href: "https://wa.me/442086225909", label: "WhatsApp", Icon: IconWhatsApp },
  { href: "mailto:info@abrahamoflondon.org", label: "Email", Icon: IconMail },
  { href: "tel:+442086225909", label: "Call", Icon: IconPhone },
];

const isExternal = (href: string) =>
  href.startsWith("http://") || href.startsWith("https://");

function SocialAnchor({ item }: { item: Item }) {
  const { href, label, Icon } = item;
  const classes =
    "group inline-flex items-center gap-3 text-deepCharcoal hover:text-forest transition-all duration-300";

  const iconEl = (
    <Icon
      className="h-8 w-8 sm:h-9 sm:w-9 transition-transform group-hover:scale-110"
      aria-hidden="true"
    />
  );

  const textEl = (
    <span className="hidden text-sm sm:inline font-serif">{label}</span>
  );

  if (isExternal(href) || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a
        href={href}
        aria-label={label}
        className={classes}
        target={isExternal(href) ? "_blank" : undefined}
        rel={isExternal(href) ? "noopener noreferrer" : undefined}
      >
        {iconEl}
        {textEl}
      </a>
    );
  }

  return (
    <Link href={href} aria-label={label} className={classes} prefetch={false}>
      {iconEl}
      {textEl}
    </Link>
  );
}

export default function SocialFollowStrip() {
  return (
    <section className="mx-auto my-16 max-w-7xl px-4 sm:px-6 lg:px-12">
      <div className="rounded-2xl bg-gradient-to-br from-white/90 to-warmWhite/90 backdrop-blur-md ring-2 ring-deepCharcoal/10 shadow-2xl">
        <div className="flex flex-col items-center justify-center gap-6 px-8 py-8 sm:px-10 sm:py-10">
          {/* Header */}
          <p className="text-center text-lg sm:text-xl font-serif leading-relaxed text-deepCharcoal/90">
            Join the conversation — follow{" "}
            <span className="font-semibold text-deepCharcoal">Abraham of London</span>
          </p>

          {/* Row 1: social networks */}
          <nav
            aria-label="Social links"
            className="flex flex-wrap items-center justify-center gap-7"
          >
            {socials.map((it) => (
              <SocialAnchor key={it.href} item={it} />
            ))}
          </nav>

          {/* Divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-deepCharcoal/20 to-transparent" />

          {/* Row 2: direct channels */}
          <nav
            aria-label="Direct links"
            className="flex flex-wrap items-center justify-center gap-7"
          >
            {direct.map((it) => (
              <SocialAnchor key={it.href} item={it} />
            ))}
          </nav>

          {/* CTA with updated classes */}
          <div className="pt-6">
            <a
              href="mailto:info@abrahamoflondon.org"
              className="inline-flex items-center justify-center rounded-xl bg-softGold px-6 py-3 font-serif text-base font-semibold text-deepCharcoal shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              Connect with Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
