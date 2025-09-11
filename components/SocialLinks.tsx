import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig, type SocialLink as ConfigLink } from "@/lib/siteConfig";

type SocialItem = Pick<ConfigLink, "href" | "label" | "icon" | "kind" | "external">;

type Props = {
  variant?: "light" | "dark";
  className?: string;
  itemsOverride?: SocialItem[];
};

const isHttp = (href: string) => /^https?:\/\//i.test(href);

const ICONS: Record<NonNullable<SocialItem["kind"]>, string> = {
  tiktok: "/assets/images/social/tiktok.svg",
  youtube: "/assets/images/social/youtube.svg",
  x: "/assets/images/social/x.svg",
  instagram: "/assets/images/social/instagram.svg",
  linkedin: "/assets/images/social/linkedin.svg",
  facebook: "/assets/images/social/facebook.svg",
  whatsapp: "/assets/images/social/whatsapp.svg",
  mail: "/assets/images/social/email.svg",
  phone: "/assets/images/social/phone.svg",
};

// Higher number = earlier in the row
const KIND_ORDER: Record<string, number> = {
  tiktok: 90,
  youtube: 80,
  x: 70,
  instagram: 60,
  linkedin: 50,
  facebook: 40,
  whatsapp: 30,
  mail: 10,
  phone: 5,
};

export default function SocialFollowStrip({
  variant = "light",
  className = "",
  itemsOverride,
}: Props) {
  const raw: SocialItem[] = (itemsOverride ?? siteConfig.socialLinks) as SocialItem[];

  const items = React.useMemo(
    () =>
      raw
        .filter((it) => !!it?.href) // guard falsy
        .sort((a, b) => (KIND_ORDER[b.kind ?? ""] ?? 0) - (KIND_ORDER[a.kind ?? ""] ?? 0)),
    [raw]
  );

  const containerBg =
    variant === "dark"
      ? "from-black/60 to-deepCharcoal/60 ring-white/10"
      : "from-white/90 to-warmWhite/90 ring-deepCharcoal/10";

  const textColor = variant === "dark" ? "text-cream" : "text-deepCharcoal/80";
  const chipBase =
    variant === "dark"
      ? "bg-white/10 text-cream ring-white/15 hover:bg-white/15"
      : "bg-softGold text-deepCharcoal ring-deepCharcoal/20 hover:bg-forest hover:text-cream";

  return (
    <section className={`mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-12 ${className}`}>
      <div className={`rounded-2xl bg-gradient-to-br ${containerBg} backdrop-blur-md ring-2 shadow-2xl`}>
        <div className="flex flex-wrap items-center justify-between gap-6 px-8 py-6 sm:px-10 sm:py-8">
          <p className={`text-base sm:text-lg font-serif leading-relaxed ${textColor}`}>
            Join the conversation — follow{" "}
            <span className="font-semibold">{siteConfig.title}</span>
          </p>

          <nav aria-label="Social links">
            <ul className="flex items-center gap-4 sm:gap-6">
              {items.map((it) => {
                const href = it.href!;
                const label = it.label || "Social";
                const icon = it.icon || (it.kind ? ICONS[it.kind] : "/assets/images/social/link.svg");
                const isUtility = href.startsWith("mailto:") || href.startsWith("tel:");
                const external = it.external ?? (isHttp(href) && !isUtility);

                const aria =
                  it.kind === "mail"
                    ? `Email ${siteConfig.title}`
                    : it.kind === "phone"
                    ? `Call ${siteConfig.title}`
                    : `Follow ${siteConfig.title} on ${label}`;

                const Chip = (
                  <span className={`inline-flex items-center gap-2 sm:gap-3 rounded-full px-3 py-2 ring-1 transition-all duration-200 ${chipBase}`}>
                    <Image
                      src={icon}
                      alt="" aria-hidden="true"
                      width={22} height={22}
                      className="inline-block"
                      loading="lazy"
                    />
                    {/* Visible label ≥ sm; screen-reader only on xs */}
                    <span className="hidden sm:inline text-sm font-serif">{label}</span>
                    <span className="sr-only sm:hidden">{label}</span>
                  </span>
                );

                const key = `${it.kind ?? label}-${href}`;

                return (
                  <li key={key}>
                    {external ? (
                      <a href={href} aria-label={aria} title={label} className="group inline-flex items-center" target="_blank" rel="noopener noreferrer">
                        {Chip}
                      </a>
                    ) : isUtility ? (
                      <a href={href} aria-label={aria} title={label} className="group inline-flex items-center">
                        {Chip}
                      </a>
                    ) : (
                      <Link href={href} aria-label={aria} title={label} className="group inline-flex items-center" prefetch={false}>
                        {Chip}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </section>
  );
}
