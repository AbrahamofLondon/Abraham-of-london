/* components/EnhancedFooter.tsx
   INSTITUTIONAL FOOTER — LEGIBILITY-CORRECTED
   - Contrast materially improved
   - Books surfaced explicitly in directory
   - Hover states moved to CSS classes instead of inline JS mutation
   - Small-type labels strengthened
   - Body copy and policy links made readable
   - Gateway cards kept premium but no longer murky
*/
"use client";

import * as React from "react";
import Link from "next/link";
import { getSocialLinks, type SocialLink } from "@/config/site";

// Guard usePathname against static generation where router context is absent.
// EnhancedFooter is used by Layout (Pages Router) and may be prerendered.
function usePathnameSafe(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { usePathname } = require("next/navigation");
    return usePathname();
  } catch {
    return "/";
  }
}
import {
  ArrowRight,
  BookOpen,
  Library,
  Building2,
  Bookmark,
  Crown,
  ScanSearch,
  FileText,
  Calendar,
  ShieldCheck,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  Globe,
  Mail,
  Phone,
  Music2,
} from "lucide-react";

type FooterLink = {
  label: string;
  href: string;
  highlight?: boolean;
};

type GatewayCardProps = {
  href: string;
  eyebrow: string;
  title: string;
  body?: string;
  icon: React.ElementType;
  tag: string;
  gold?: boolean;
};

const SOFT_GOLD = "#C9A96E";

const SOCIAL_ICON_MAP: Partial<Record<SocialLink["kind"], React.ElementType>> = {
  x: Twitter,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  website: Globe,
  email: Mail,
  phone: Phone,
  tiktok: Music2,
};

function GatewayCard({
  href,
  eyebrow,
  title,
  body,
  icon: Icon,
  tag,
  gold = false,
}: GatewayCardProps) {
  const palette = gold
    ? {
        border: "border-[#C9A96E]/25 hover:border-[#C9A96E]/45",
        bg: "bg-[#C9A96E]/[0.07] hover:bg-[#C9A96E]/[0.11]",
        topRule: "from-transparent via-[#C9A96E]/35 to-transparent",
        icon: "text-[#C9A96E]/90",
        eyebrow: "text-[#C9A96E]/85",
      }
    : {
        border: "border-white/10 hover:border-white/18",
        bg: "bg-white/[0.025] hover:bg-white/[0.04]",
        topRule: "from-transparent via-white/12 to-transparent",
        icon: "text-white/55",
        eyebrow: "text-white/55",
      };

  return (
    <Link
      href={href}
      className={[
        "group relative flex min-h-[190px] flex-col justify-between overflow-hidden border p-6",
        "transition-colors duration-300",
        palette.border,
        palette.bg,
      ].join(" ")}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${palette.topRule}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Icon className={`h-4 w-4 transition-colors duration-300 ${palette.icon}`} />
          <span className={`font-mono text-[8px] uppercase tracking-[0.38em] ${palette.eyebrow}`}>
            {eyebrow}
          </span>
        </div>

        <span className="font-mono text-[7px] uppercase tracking-[0.28em] text-white/45">
          {tag}
        </span>
      </div>

      <div className="mt-auto space-y-2">
        <div className="font-serif text-[1.28rem] font-light italic leading-[1.22] text-white/88 transition-colors duration-300 group-hover:text-white">
          {title}
        </div>

        {body ? (
          <p className="text-[12px] leading-6 text-white/60 transition-colors duration-300 group-hover:text-white/72">
            {body}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <span className="font-mono text-[8px] uppercase tracking-[0.32em] text-white/55 transition-colors duration-300 group-hover:text-white/78">
          Enter
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-white/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white/75" />
      </div>
    </Link>
  );
}

function DirectoryColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div className="space-y-5">
      <div className="border-b border-white/10 pb-3">
        <span className="font-mono text-[8px] uppercase tracking-[0.34em] text-white/58">
          {title}
        </span>
      </div>

      <ul className="space-y-3.5">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link
              href={link.href}
              className={[
                "group flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]",
                "transition-colors duration-200",
                link.highlight
                  ? "text-[#C9A96E] hover:text-[#E0BD82]"
                  : "text-white/62 hover:text-white/88",
              ].join(" ")}
            >
              <div
                className={[
                  "h-px transition-all duration-300",
                  link.highlight
                    ? "w-3 bg-[#C9A96E]/75 group-hover:w-4"
                    : "w-0 bg-[#C9A96E]/65 group-hover:w-3",
                ].join(" ")}
              />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialChannel({ social }: { social: SocialLink }) {
  const Icon = SOCIAL_ICON_MAP[social.kind] ?? Globe;
  const isExternal = /^https?:\/\//i.test(social.href);
  const descriptor =
    social.handle ??
    (social.kind === "email"
      ? "Direct"
      : social.kind === "phone"
        ? "Office"
        : "Official");

  return (
    <Link
      href={social.href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      aria-label={`${social.label}: ${descriptor}`}
      className={[
        "group flex min-h-[72px] items-center justify-between gap-4 border border-white/10 bg-white/[0.022] px-4 py-3",
        "transition-colors duration-300 hover:border-[#C9A96E]/35 hover:bg-[#C9A96E]/[0.055]",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/10 bg-black/25 text-white/56 transition-colors duration-300 group-hover:border-[#C9A96E]/35 group-hover:text-[#D7B77E]">
          <Icon className="h-3.5 w-3.5" />
        </span>

        <span className="min-w-0">
          <span className="block font-mono text-[8px] uppercase tracking-[0.28em] text-white/68 transition-colors duration-300 group-hover:text-white/88">
            {social.label}
          </span>
          <span className="mt-1 block truncate font-mono text-[7px] uppercase tracking-[0.2em] text-white/38 transition-colors duration-300 group-hover:text-[#C9A96E]/72">
            {descriptor}
          </span>
        </span>
      </div>

      <ArrowRight className="h-3 w-3 shrink-0 text-white/28 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#C9A96E]/70" />
    </Link>
  );
}

export default function EnhancedFooter(): React.ReactElement {
  const pathname = usePathnameSafe();
  const isHome = (pathname || "/") === "/";

  // Hardcoded to avoid hydration mismatch between server build time and client render time.
  // Update annually.
  const year = 2026;

  const primaryGateways: GatewayCardProps[] = [
    { href: "/canon", eyebrow: "Doctrine", title: "The Canon", icon: BookOpen, tag: "DOC·V1" },
    { href: "/books", eyebrow: "Works", title: "Volumes", icon: Bookmark, tag: "PUB·V2" },
    { href: "/intelligence/market", eyebrow: "Intelligence", title: "Market Intelligence", icon: Building2, tag: "INT·V3" },
    { href: "/library", eyebrow: "Archive", title: "Library", icon: Library, tag: "LIB·V4" },
  ];

  const secondaryGateways: GatewayCardProps[] = [
    {
      href: "/frameworks",
      eyebrow: "Instruments",
      title: "Frameworks & Playbooks",
      body: "Decision instruments, practical frameworks, and operational playbooks for serious operators.",
      icon: Crown,
      tag: "FRM·V1",
      gold: true,
    },
    {
      href: "/evidence/standards",
      eyebrow: "Trust",
      title: "Evidence Standards",
      body: "How claims, verification, suppression, and publication boundaries are governed.",
      icon: FileText,
      tag: "EVD·V2",
    },
    {
      href: "/engagements",
      eyebrow: "Selective",
      title: "Engagement Pathways",
      body: "Selective operator pilot, retained oversight, and counsel continuation pathways.",
      icon: ScanSearch,
      tag: "ENG·V3",
    },
    {
      href: "/vault",
      eyebrow: "Controlled archive",
      title: "Vault",
      body: "Restricted archive, controlled access materials, and premium evidence pathways.",
      icon: Calendar,
      tag: "VLT·V4",
    },
  ];

  const directory: Record<string, FooterLink[]> = {
  Archive: [
    { label: "Canon", href: "/canon" },
    { label: "Books", href: "/books" },
    { label: "Editorials", href: "/editorials" },
    { label: "Essays", href: "/blog", highlight: true }, 
    { label: "Library", href: "/library" },
    { label: "Shorts", href: "/shorts", highlight: true }, 
    { label: "Playbooks", href: "/playbooks" },
  ],
  Products: [
    { label: "Read the Canon", href: "/canon" },
    { label: "Review Evidence Standards", href: "/evidence/standards" },
    { label: "Explore Market Intelligence", href: "/intelligence/market" },
    { label: "Use Frameworks", href: "/frameworks" },
    { label: "Books & Long-form Work", href: "/books" },
    { label: "Artifact Archive", href: "/artifacts" },
  ],
  Engagements: [
    { label: "Selective Operator Pilot", href: "/engagements/selective-pilot" },
    { label: "Retained Oversight", href: "/engagements/retained-oversight" },
    { label: "Counsel Review", href: "/counsel" },
    { label: "Oversight Command", href: "/oversight" },
    { label: "Diagnostics", href: "/diagnostics" },
  ],
  "Trust & Proof": [
    { label: "Founder", href: "/about/founder" },
    { label: "Verification", href: "/verification" },
    { label: "Trust", href: "/trust" },
    { label: "Foundations", href: "/foundations" },
    { label: "Evidence", href: "/evidence" },
    { label: "Vault / Restricted Archive", href: "/vault" },
  ],
  Governance: [
    { label: "About", href: "/about" },
    { label: "Method", href: "/method" },
    { label: "Security", href: "/security" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Refund Policy", href: "/refund-policy" },
  ],
};

  const policyLinks = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Security", href: "/security" },
    { label: "Cookies", href: "/cookies" },
  ] as const;
  const socialLinks = getSocialLinks();

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#030305]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(201,169,110,0.08),transparent_35%),radial-gradient(circle_at_78%_82%,rgba(255,255,255,0.025),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-20 lg:px-12">
        {!isHome ? (
          <>
            <div className="grid grid-cols-1 gap-px bg-white/[0.05] md:grid-cols-4">
              {primaryGateways.map((card) => (
                <GatewayCard key={card.href} {...card} />
              ))}
            </div>

            <div className="mt-px grid grid-cols-1 gap-px bg-white/[0.05] md:grid-cols-4">
              {secondaryGateways.map((card) => (
                <GatewayCard key={card.href} {...card} />
              ))}
            </div>
          </>
        ) : (
          <div className="grid gap-4 border border-white/10 bg-white/[0.02] p-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <div className="font-serif text-[2rem] font-light italic leading-none tracking-[-0.02em] text-white/92">
                Abraham of London
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-px w-10 bg-[#C9A96E]/60" />
                <span className="font-mono text-[8px] uppercase tracking-[0.42em] text-[#C9A96E]/86">
                  Decision Infrastructure
                </span>
              </div>
              <p className="mt-4 max-w-[42ch] text-[14px] leading-7 text-white/62">
                Start with evidence. The system can refuse escalation, retain the
                record, and route later surfaces only when the case has earned them.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
              <Link
                href="/diagnostics/fast"
                className="group inline-flex items-center justify-center gap-3 border border-[#C9A96E]/35 bg-[#C9A96E]/[0.08] px-6 py-[14px] font-mono text-[9px] uppercase tracking-[0.24em] text-[#D7B77E] transition-colors duration-300 hover:border-[#C9A96E]/55 hover:bg-[#C9A96E]/[0.13] hover:text-[#E8C991]"
              >
                Test a Decision
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/library"
                className="group inline-flex items-center justify-center gap-3 border border-white/14 bg-white/[0.035] px-6 py-[14px] font-mono text-[9px] uppercase tracking-[0.24em] text-white/72 transition-colors duration-300 hover:border-white/22 hover:bg-white/[0.055] hover:text-white"
              >
                Library
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        )}

        <div className="mt-20 grid gap-16 border-t border-white/10 pt-16 lg:grid-cols-12">
          <div className="space-y-9 lg:col-span-5">
            <div>
              <div className="font-serif text-[2.35rem] font-light italic leading-none tracking-[-0.02em] text-white/92">
                Abraham of London
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="h-px w-10 bg-[#C9A96E]/60" />
                <span className="font-mono text-[8px] uppercase tracking-[0.44em] text-[#C9A96E]/88">
                  Decision Infrastructure
                </span>
              </div>
            </div>

            <p className="max-w-[38ch] border-l border-white/15 pl-5 font-serif text-[15px] font-light italic leading-8 text-white/72">
              Decision Infrastructure for decisions under consequence. The system
              captures evidence, carries memory forward, schedules checkpoints,
              verifies outcomes, and escalates to counsel only when the record
              warrants it.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="group inline-flex items-center justify-center gap-3 border border-white/14 bg-white/[0.035] px-6 py-[14px] font-mono text-[9px] uppercase tracking-[0.28em] text-white/72 transition-colors duration-300 hover:border-white/22 hover:bg-white/[0.055] hover:text-white"
              >
                Secure inquiry
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/diagnostics/fast"
                className="group inline-flex items-center justify-center gap-3 border border-[#C9A96E]/35 bg-[#C9A96E]/[0.08] px-6 py-[14px] font-mono text-[9px] uppercase tracking-[0.28em] text-[#D7B77E] transition-colors duration-300 hover:border-[#C9A96E]/55 hover:bg-[#C9A96E]/[0.13] hover:text-[#E8C991]"
              >
                <Crown className="h-3.5 w-3.5" />
                Test a Decision
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-4 lg:col-span-7">
            {Object.entries(
              isHome
                ? {
                    Archive: [
                      { label: "Canon", href: "/canon" },
                      { label: "Library", href: "/library" },
                      { label: "Intelligence", href: "/intelligence/market" },
                      { label: "Shorts", href: "/shorts", highlight: true },
                    ],
                    Entry: [
                      { label: "Diagnostics", href: "/diagnostics", highlight: true },
                      { label: "Evidence", href: "/evidence" },
                      { label: "Engagements", href: "/engagements" },
                    ],
                    "Trust & Proof": [
                      { label: "Trust", href: "/trust" },
                      { label: "Instruments", href: "/decision-instruments" },
                      { label: "Frameworks", href: "/frameworks" },
                      { label: "Vault", href: "/vault" },
                    ],
                    Governance: [
                      { label: "About", href: "/about" },
                      { label: "Security", href: "/security" },
                      { label: "Privacy", href: "/privacy" },
                      { label: "Terms", href: "/terms" },
                    ],
                  }
                : directory,
            ).map(([title, links]) => (
              <DirectoryColumn key={title} title={title} links={links} />
            ))}
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 pt-12">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-10 bg-[#C9A96E]/60" />
                <span className="font-mono text-[8px] uppercase tracking-[0.42em] text-[#C9A96E]/86">
                  Signal channels
                </span>
              </div>

              <p className="mt-4 max-w-[34ch] text-[12px] leading-6 text-white/62">
                Official channels for essays, briefings, public notes, and direct
                institutional contact.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
              {socialLinks.map((social) => (
                <SocialChannel key={`${social.kind}-${social.href}`} social={social} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20 border-t border-white/10 pt-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <ShieldCheck className="h-3.5 w-3.5 text-white/35" />
              <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/48">
                © {year} Abraham of London · All rights reserved
              </span>
              <div className="hidden h-3 w-px bg-white/12 md:block" />
              <span className="hidden font-mono text-[7px] uppercase tracking-[0.24em] text-white/30 md:block">
                Institutional registry
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {policyLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/46 transition-colors duration-200 hover:text-white/82"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
