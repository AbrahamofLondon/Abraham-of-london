/* components/homepage/EngagementLanes.tsx — Compact + Embeddable (12/10) */
import * as React from "react";
import Link from "next/link";
import Image from "next/image";

type Lane = {
  key: "media" | "education" | "private" | "institutional";
  title: string;
  subtitle: string;
  href: string;
  image: string;
  logo: string;
  description: string;
};

const LANES: Lane[] = [
  {
    key: "media",
    title: "MEDIA",
    subtitle: "Cultural signal",
    href: "/media",
    image: "/assets/images/logos/media.jpeg",
    logo: "/assets/images/logos/media-logo.svg",
    description: "Narrative intelligence",
  },
  {
    key: "education",
    title: "EDUCATION",
    subtitle: "Formation & research",
    href: "/education-research",
    image: "/assets/images/logos/education.jpeg",
    logo: "/assets/images/logos/education-logo.svg",
    description: "Knowledge transfer",
  },
  {
    key: "private",
    title: "PRIVATE",
    subtitle: "Client work",
    href: "/private-clients",
    image: "/assets/images/logos/private-clients.jpeg",
    logo: "/assets/images/logos/private-clients-logo.svg",
    description: "Strategic advisory",
  },
  {
    key: "institutional",
    title: "INSTITUTIONAL",
    subtitle: "Governance & policy",
    href: "/institutional",
    image: "/assets/images/logos/institution.jpeg",
    logo: "/assets/images/logos/institution-logo.svg",
    description: "System architecture",
  },
];

export default function EngagementLanes({
  compact = true,
}: {
  /** compact=true: designed to be embedded inside homepage Panel */
  compact?: boolean;
}) {
  return (
    <section className={compact ? "w-full" : "mx-auto max-w-7xl px-6 py-16 md:py-20"}>
      {/* Header — smaller in compact mode */}
      <div
        className={[
          "mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4",
          compact ? "px-1" : "",
        ].join(" ")}
      >
        <div className="max-w-2xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/85">
            Access portals
          </div>

          <h2 className={["mt-3 font-serif text-white leading-tight", compact ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"].join(" ")}>
            Four modes of engagement.
          </h2>

          <p className={["mt-3 leading-relaxed text-white/70", compact ? "text-sm max-w-xl" : "text-base max-w-xl"].join(" ")}>
            Media, education, private advisory, and institutional work — each with its own rhythm,
            governance, and standards. Choose the aperture that fits.
          </p>
        </div>

        <div className="hidden md:block w-px h-10 bg-white/10" />

        <div className="text-right">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/55 mb-1 block">
            Active portals
          </span>
          <span className={["font-light text-white/85", compact ? "text-xl" : "text-2xl"].join(" ")}>04</span>
        </div>
      </div>

      {/* Grid — reduced height, tighter paddings */}
      <div className={["grid grid-cols-1 md:grid-cols-2", compact ? "gap-3 md:gap-4" : "gap-4 md:gap-5"].join(" ")}>
        {LANES.map((lane) => (
          <Link
            key={lane.key}
            href={lane.href}
            className="group relative overflow-hidden rounded-2xl border border-white/12 bg-zinc-900/55 hover:bg-zinc-900/75 transition-all duration-500"
          >
            {/* Background image */}
            <div className="absolute inset-0 opacity-25 group-hover:opacity-35 transition-opacity duration-700">
              <Image
                src={lane.image}
                alt=""
                fill
                className="object-cover"
                priority={lane.key === "media"}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/55 to-black/85" />
            </div>

            {/* Content — shorter min-height */}
            <div className={["relative flex flex-col justify-between", compact ? "p-5 md:p-6 min-h-[170px]" : "p-7 md:p-8 min-h-[220px]"].join(" ")}>
              <div className="flex items-start justify-between">
                <div className={["relative", compact ? "h-8 w-8" : "h-9 w-9"].join(" ")}>
                  <Image
                    src={lane.logo}
                    alt=""
                    fill
                    className="object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                </div>

                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-amber-300/70 group-hover:text-amber-300/90 transition-colors">
                  {lane.subtitle}
                </span>
              </div>

              <div className="mt-auto">
                <h3 className={["font-serif text-white/95 group-hover:text-white transition-colors", compact ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"].join(" ")}>
                  {lane.title}
                </h3>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-px w-5 bg-amber-500/40 group-hover:w-7 transition-all duration-300" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/65 group-hover:text-amber-300/85 transition-colors">
                    {lane.description}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300/85">
                  Enter →
                </span>
              </div>
            </div>

            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/0 group-hover:ring-amber-500/20 transition-all duration-500" />
          </Link>
        ))}
      </div>
    </section>
  );
}