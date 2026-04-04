"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Library,
  Building2,
  Bookmark,
  Layers,
  Shield,
  ChevronRight,
  Terminal,
  ShieldCheck,
  Vault,
  Crown,
} from "lucide-react";

import PolicyFooter from "@/components/PolicyFooter";

interface FooterCTAProps {
  href: string;
  title: string;
  label: string;
  icon: React.ReactNode;
  hint?: string;
  tag: string;
}

type DirectoryLink = {
  label: string;
  href: string;
};

function FooterCTA({
  href,
  title,
  label,
  icon,
  hint,
  tag,
}: FooterCTAProps) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[200px] flex-col justify-between overflow-hidden border border-white/10 bg-zinc-900/20 p-6 transition-all duration-500 hover:border-amber-500/40 hover:bg-zinc-900/30"
    >
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-amber-500/60 transition-colors group-hover:text-amber-400">
            {icon}
          </div>
          <div className="text-[9px] font-mono font-bold uppercase tracking-[0.4em] text-amber-500/70">
            {label}
          </div>
        </div>

        <div className="text-[8px] font-mono uppercase tracking-widest text-white/10 transition-colors group-hover:text-amber-500/40">
          {tag}
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-serif text-xl italic text-white transition-colors group-hover:text-amber-100">
          {title}
        </div>

        {hint ? (
          <div className="max-w-[240px] text-[11px] font-light leading-relaxed text-white/30 transition-colors group-hover:text-white/50">
            {hint}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex items-center gap-2 text-[8px] font-mono font-bold uppercase tracking-widest text-white/10 transition-all group-hover:text-amber-500/40">
        <span>Initialize Access</span>
        <ChevronRight size={10} />
      </div>

      <div className="absolute bottom-0 left-0 h-px w-0 bg-amber-500/30 transition-all duration-700 group-hover:w-full" />
    </Link>
  );
}

function DirectoryColumn({
  title,
  links,
}: {
  title: string;
  links: DirectoryLink[];
}) {
  return (
    <div className="space-y-6">
      <h4 className="border-b border-white/5 pb-2 text-[10px] font-mono font-black uppercase tracking-[0.3em] text-white/20">
        {title}
      </h4>

      <ul className="space-y-3">
        {links.map((link, index) => (
          <li key={`${title}-${link.label}-${link.href}-${index}`}>
            <Link
              href={link.href}
              className="group flex items-center gap-2 text-[11px] font-medium tracking-wide text-white/40 transition-all hover:text-amber-200"
            >
              <div className="h-px w-0 bg-amber-500/50 transition-all group-hover:w-3" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function EnhancedFooter(): React.ReactElement {
  const year = new Date().getFullYear();

  const directory = {
    Registry: [
      { label: "Canon", href: "/canon" },
      { label: "Books", href: "/books" },
      { label: "Library", href: "/library" },
      { label: "Essays", href: "/blog" },
      { label: "Shorts", href: "/shorts" },
      { label: "Content", href: "/content" },
    ] as DirectoryLink[],
    Architecture: [
      { label: "Frameworks", href: "/resources/strategic-frameworks" },
      { label: "Surrender", href: "/resources/surrender-framework" },
      { label: "Vault", href: "/vault" },
      { label: "Resources", href: "/resources" },
    ] as DirectoryLink[],
    Engagements: [
      { label: "Consulting", href: "/consulting" },
      { label: "Strategy Room", href: "/consulting/strategy-room" },
      { label: "Speaking", href: "/speaking" },
      { label: "Contact", href: "/contact" },
    ] as DirectoryLink[],
    Governance: [
      { label: "About", href: "/about" },
      { label: "Security", href: "/security" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ] as DirectoryLink[],
  };

  const policyLinks = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Security", href: "/security" },
    { label: "Cookies", href: "/cookies" },
  ] as const;

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black pb-8 pt-24">
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-12">
        {/* Top Row: Primary CTAs */}
        <div className="grid grid-cols-1 gap-px border border-white/5 bg-white/5 md:grid-cols-4">
          <FooterCTA
            href="/canon"
            title="The Canon"
            label="Doctrine"
            tag="DOC-V1"
            icon={<BookOpen size={16} />}
          />
          <FooterCTA
            href="/books"
            title="Volumes"
            label="Works"
            tag="PUB-V2"
            icon={<Bookmark size={16} />}
          />
          <FooterCTA
            href="/library"
            title="Library"
            label="Archive"
            tag="LIB-V3"
            icon={<Library size={16} />}
          />
          <FooterCTA
            href="/ventures"
            title="Ventures"
            label="Execution"
            tag="OPS-V4"
            icon={<Building2 size={16} />}
          />
        </div>

        {/* Middle Row: Strategy Room & Frameworks */}
        <div className="mt-px grid grid-cols-1 gap-px border-x border-b border-white/5 bg-white/5 md:grid-cols-4">
          {/* Strategy Room - New CTA Injection */}
          <FooterCTA
            href="/consulting/strategy-room"
            title="Strategy Room"
            label="Qualified Access"
            tag="STRAT-V1"
            hint="Controlled entry for qualified operators. Score-based routing. Institutional gatekeeping."
            icon={<Crown size={16} />}
          />
          <FooterCTA
            href="/resources/strategic-frameworks"
            title="Strategic Frameworks"
            label="Operating Systems"
            tag="SYS-F1"
            hint="Board-grade models, institutional structure, and resilience logic."
            icon={<Layers size={16} />}
          />
          <FooterCTA
            href="/resources/surrender-framework"
            title="Surrender Framework"
            label="Formation"
            tag="FRM-S2"
            hint="Personal order, alignment under pressure, and disciplined correction."
            icon={<Shield size={16} />}
          />
          <FooterCTA
            href="/vault"
            title="The Vault"
            label="Intelligence"
            tag="SEC-V3"
            hint="Controlled assets, premium resources, and execution-grade material."
            icon={<Vault size={16} />}
          />
        </div>

        {/* Main Footer Content */}
        <div className="mt-24 grid grid-cols-1 gap-16 border-t border-white/10 pt-16 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-5">
            <div>
              <h2 className="font-serif text-4xl italic tracking-tight text-white">
                Abraham of London
              </h2>

              <div className="mt-3 flex items-center gap-3">
                <div className="h-px w-8 bg-amber-500/40" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.5em] text-amber-500/60">
                  Governance • Architecture • Execution
                </span>
              </div>
            </div>

            <p className="max-w-sm border-l border-white/10 pl-6 text-[12px] font-light italic leading-relaxed text-white/30">
              A platform for disciplined thinking: doctrine, systems, and strategic
              execution arranged for leaders, builders, and institutions that
              intend to endure.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-4 bg-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-black transition-all hover:bg-amber-500"
              >
                <Terminal size={14} />
                Secure Inquiry
                <ArrowRight size={14} />
              </Link>

              {/* Strategy Room Secondary CTA */}
              <Link
                href="/consulting/strategy-room"
                className="inline-flex items-center justify-center gap-4 border border-amber-500/30 bg-amber-500/[0.03] px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/80 transition-all hover:border-amber-500/60 hover:bg-amber-500/[0.08] hover:text-amber-300"
              >
                <Crown size={14} />
                Enter Strategy Room
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4 lg:col-span-7">
            <DirectoryColumn title="Registry" links={directory.Registry} />
            <DirectoryColumn title="Architecture" links={directory.Architecture} />
            <DirectoryColumn title="Engagements" links={directory.Engagements} />
            <DirectoryColumn title="Governance" links={directory.Governance} />
          </div>
        </div>

        <div className="mt-24 border-t border-white/5 pt-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-amber-500/50" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-white/40">
                  © {year} ABRAHAM OF LONDON • ALL RIGHTS RESERVED
                </span>
              </div>

              <div className="hidden h-3 w-px bg-white/10 md:block" />

              <div className="hidden items-center gap-4 md:flex">
                <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/20">
                  Institutional Registry
                </span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              {policyLinks.map((item, index) => (
                <Link
                  key={`${item.label}-${item.href}-${index}`}
                  href={item.href}
                  className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-white/20 transition-colors hover:text-amber-500"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <PolicyFooter isDark />
        </div>
      </div>
    </footer>
  );
}