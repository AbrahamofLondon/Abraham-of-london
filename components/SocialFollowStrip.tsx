// components/SocialFollowStrip.tsx
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { siteConfig } from "@/lib/siteConfig";

type Props = {
  variant?: "light" | "dark";
  className?: string;
};

const isExternal = (href: string) => /^https?:\/\//i.test(href);

export default function SocialFollowStrip({ variant = "light", className }: Props) {
  const shell = clsx(
    "rounded-2xl backdrop-blur-md ring-1 shadow-2xl",
    variant === "dark"
      ? "from-white/5 to-white/10 bg-gradient-to-br ring-white/10"
      : "from-white/90 to-warmWhite/90 bg-gradient-to-br ring-deepCharcoal/10",
    className,
  );

  const pill = clsx(
    "inline-flex items-center gap-3 rounded-full px-3 py-1.5 transition",
    variant === "dark"
      ? "bg-cream text-deepCharcoal hover:bg-softGold"
      : "bg-deepCharcoal text-cream hover:bg-softGold hover:text-deepCharcoal",
  );

  return (
    <section className="mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-12">
      <div className={shell}>
        <div className="flex flex-wrap items-center justify-between gap-6 px-8 py-6 sm:px-10 sm:py-8">
          <p
            className={clsx(
              "font-serif leading-relaxed",
              variant === "dark" ? "text-cream/90" : "text-deepCharcoal/85",
              "text-base sm:text-lg",
            )}
          >
            Join the conversation — follow{" "}
            <span className={clsx(variant === "dark" ? "text-cream" : "text-deepCharcoal", "font-semibold")}>
              {siteConfig.title}
            </span>
          </p>

          <nav aria-label="Social links" className="flex items-center gap-3 sm:gap-4">
            {siteConfig.socialLinks.map((it) => {
              const iconEl = (
                <span className="relative inline-block h-4 w-4 sm:h-5 sm:w-5">
                  <Image
                    src={it.icon}
                    alt={`${it.label} icon`}
                    fill
                    sizes="20px"
                    className="object-contain"
                  />
                </span>
              );

              const content = (
                <span className="inline-flex items-center gap-2">
                  {iconEl}
                  <span className="hidden sm:inline text-sm">{it.label}</span>
                </span>
              );

              const className = pill;

              if (it.href.startsWith("mailto:") || it.href.startsWith("tel:") || it.external || isExternal(it.href)) {
                return (
                  <a
                    key={it.href}
                    href={it.href}
                    target={isExternal(it.href) ? "_blank" : undefined}
                    rel={isExternal(it.href) ? "noopener noreferrer" : undefined}
                    className={className}
                    aria-label={it.label}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link key={it.href} href={it.href} className={className} aria-label={it.label} prefetch={false}>
                  {content}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </section>
  );
}
