/* components/homepage/EngagementLanes.tsx — Refined, higher-impact lane module */
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

export default function EngagementLanes() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-24">
      {/* Section header — tighter, more deliberate */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="max-w-2xl">
          <div className="text-[11px] font-mono font-medium uppercase tracking-[0.4em] text-emerald-500/70">
            Access portals
          </div>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl lg:text-5xl text-white leading-tight">
            Four modes of engagement.
          </h2>
          <p className="mt-4 text-base text-white/50 max-w-xl font-light leading-relaxed">
            Media, education, private advisory, and institutional work — each with its own rhythm, 
            governance, and standards. Choose the aperture that fits.
          </p>
        </div>
        <div className="hidden md:block w-px h-16 bg-white/10" />
        <div className="text-sm text-white/40 font-mono text-right tracking-wider">
          <span className="block text-[10px] uppercase tracking-[0.4em] text-emerald-500/50 mb-2">
            Active portals
          </span>
          <span className="text-2xl font-light text-white/80">04</span>
        </div>
      </div>

      {/* Lane grid — more intimate card size, higher information density */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {LANES.map((lane) => (
          <Link
            key={lane.key}
            href={lane.href}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all duration-500 hover:border-emerald-500/20"
          >
            {/* Background image — more subtle, less dominant */}
            <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity duration-700">
              <Image
                src={lane.image}
                alt=""
                fill
                className="object-cover"
                priority={lane.key === "media"}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70" />
            </div>

            {/* Content — reduced padding, higher information density */}
            <div className="relative p-8 md:p-9 min-h-[220px] flex flex-col justify-between">
              {/* Top row — logo and identifier */}
              <div className="flex items-start justify-between">
                <div className="relative h-10 w-10">
                  <Image 
                    src={lane.logo} 
                    alt="" 
                    fill 
                    className="object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
                  />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-500/40 group-hover:text-emerald-500/60 transition-colors">
                  {lane.subtitle}
                </span>
              </div>

              {/* Middle — primary message, tighter */}
              <div className="mt-auto">
                <h3 className="text-2xl md:text-3xl font-serif text-white/90 group-hover:text-white transition-colors">
                  {lane.title}
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="h-px w-6 bg-emerald-500/30 group-hover:w-8 transition-all duration-300" />
                  <span className="text-xs font-mono uppercase tracking-wider text-white/40 group-hover:text-emerald-500/60 transition-colors">
                    {lane.description}
                  </span>
                </div>
              </div>

              {/* Bottom indicator — subtle entrance */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-500/60">
                  Enter →
                </span>
              </div>
            </div>

            {/* Hover ring — more refined */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/0 group-hover:ring-emerald-500/20 transition-all duration-500" />
          </Link>
        ))}
      </div>
    </section>
  );
}