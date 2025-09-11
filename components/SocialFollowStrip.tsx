// components/SocialFollowStrip.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

type SocialItem = {
  href: string;
  icon: string;   // local /public path preferred
  label: string;
  kind?: string;  // used for ordering
  external?: boolean;
};

type Props = {
  variant?: "light" | "dark";
  className?: string;
  itemsOverride?: SocialItem[];
};

const isExternal = (href: string) => /^https?:\/\//i.test(href);

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

  const items = React.useMemo(() => {
    return [...raw].sort((a, b) => {
      const pa = KIND_ORDER[a.kind ?? ""] ?? 0;
      const pb = KIND_ORDER[b.kind ?? ""] ?? 0;
      return pb - pa;
    });
  }, [raw]);

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
                const label = it.label || "Social";
                const href = it.href;
                const icon = it.icon || "/assets/images/social/link.svg";
                const external = it.external ?? isExternal(href);
                const isUtility = href.startsWith("mailto:") || href.startsWith("tel:");

                const Chip = (
                  <span
                    className={`inline-flex items-center gap-2 sm:gap-3 rounded-full px-3 py-2 ring-1 transition-all duration-200 ${chipBase}`}
                  >
                    <Image
                      src={icon}
                      alt={`${label} icon`}
                      width={22}
                      height={22}
                      className="inline-block"
                      loading="lazy"
                    />
                    <span className="hidden sm:inline text-sm font-serif">{label}</span>
                    <span className="sr-only sm:not-sr-only sm:hidden">{label}</span>
                  </span>
                );

                return (
                  <li key={`${label}-${href}`}>
                    {external || isUtility ? (
                      <a
                        href={href}
                        aria-label={label}
                        className="group inline-flex items-center"
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                      >
                        {Chip}
                      </a>
                    ) : (
                      <Link href={href} aria-label={label} prefetch={false} className="group inline-flex items-center">
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
