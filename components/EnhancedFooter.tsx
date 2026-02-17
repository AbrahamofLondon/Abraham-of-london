/* components/EnhancedFooter.tsx — INSTITUTIONAL FOOTER (Portfolio-first, Canon-rooted) */
"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Library,
  Briefcase,
  Vault,
  Building2,
  Mail,
} from "lucide-react";
import SocialLinks, { SocialLinksCompact } from "@/components/SocialLinks";
import PolicyFooter from "@/components/PolicyFooter";

interface FooterCTAProps {
  href: string;
  title: string;
  label: string;
  icon: React.ReactNode;
}

function FooterCTA({ href, title, label, icon }: FooterCTAProps) {
  return (
    <Link
      href={href}
      className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-7 transition-all duration-500 hover:border-amber-500/25 hover:bg-amber-500/[0.06]"
    >
      <div className="relative z-10 space-y-2">
        <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-amber-200/60">
          {label}
        </div>
        <div className="font-serif text-lg text-white/90 group-hover:text-amber-100 transition-colors">
          {title}
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 text-amber-200/50 group-hover:text-amber-200 transition-all">
        <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.3em]">
          Open
        </span>
        <span className="transition-transform duration-500 group-hover:translate-x-0.5">
          {icon}
        </span>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      >
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_10%_20%,rgba(245,158,11,0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_90%_80%,rgba(255,255,255,0.06),transparent_55%)]" />
      </div>
    </Link>
  );
}

export default function EnhancedFooter(): React.ReactElement {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-black pt-20 pb-12">
      {/* Subtle premium wash */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.65),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_70%,rgba(245,158,11,0.25),transparent_55%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-12">
        {/* Primary pathways */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FooterCTA
            href="/canon"
            title="The Canon"
            label="Doctrine"
            icon={<BookOpen size={18} />}
          />
          <FooterCTA
            href="/library"
            title="Library"
            label="Archive"
            icon={<Library size={18} />}
          />
          <FooterCTA
            href="/ventures"
            title="Ventures"
            label="Execution"
            icon={<Building2 size={18} />}
          />
        </div>

        {/* Secondary pathways */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <FooterCTA
            href="/briefs"
            title="Briefs"
            label="Operator Notes"
            icon={<Briefcase size={18} />}
          />
          <FooterCTA
            href="/downloads"
            title="Vault"
            label="Resources"
            icon={<Vault size={18} />}
          />
        </div>

        {/* Social */}
        <div className="mt-16 rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[9px] font-mono font-semibold uppercase tracking-[0.45em] text-amber-200/60">
                Social
              </div>
              <h3 className="mt-3 font-serif text-2xl text-white/90 tracking-tight">
                Signal over noise.
              </h3>
              <p className="mt-2 max-w-xl text-sm text-white/45 leading-relaxed">
                Updates land where they matter: field notes, releases, and the occasional hard-edged clarity.
              </p>
            </div>

            <div className="flex md:justify-end">
              <SocialLinksCompact className="gap-4" iconSize="md" maxItems={10} />
            </div>
          </div>

          <div className="mt-6 hidden md:block">
            <SocialLinks className="gap-6" showIcons showLabels iconSize="sm" maxItems={10} />
          </div>
        </div>

        {/* Main nav grid */}
        <div className="mt-16 grid grid-cols-1 gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-5">
            <Link href="/" className="group inline-block">
              <h2 className="font-serif text-4xl text-white/95 tracking-tight group-hover:text-amber-100 transition-colors">
                Abraham of London
              </h2>
              <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.4em] text-amber-200/55">
                Portfolio · Doctrine · Operating Systems
              </div>
            </Link>

            <p className="text-sm leading-relaxed text-white/45 max-w-md">
              A home for institutional thinking: purpose, governance, cadence, and durable execution—
              expressed through writing, tools, ventures, and private work.
            </p>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.3em] text-white/70 hover:text-white hover:border-amber-500/25 hover:bg-amber-500/10 transition-all"
            >
              <Mail className="h-4 w-4 text-amber-300/70" />
              Inquiries <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div className="space-y-5">
              <h4 className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/45">
                Registry
              </h4>
              <ul className="space-y-3 text-xs text-white/45">
                <li><Link href="/canon" className="hover:text-amber-100 hover:underline">Canon</Link></li>
                <li><Link href="/library" className="hover:text-amber-100 hover:underline">Library</Link></li>
                <li><Link href="/briefs" className="hover:text-amber-100 hover:underline">Briefs</Link></li>
                <li><Link href="/shorts" className="hover:text-amber-100 hover:underline">Shorts</Link></li>
              </ul>
            </div>

            <div className="space-y-5">
              <h4 className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/45">
                Work
              </h4>
              <ul className="space-y-3 text-xs text-white/45">
                <li><Link href="/ventures" className="hover:text-amber-100 hover:underline">Ventures</Link></li>
                <li><Link href="/consulting" className="hover:text-amber-100 hover:underline">Advisory</Link></li>
                <li><Link href="/resources" className="hover:text-amber-100 hover:underline">Resources</Link></li>
                <li><Link href="/downloads" className="hover:text-amber-100 hover:underline">Vault</Link></li>
              </ul>
            </div>

            <div className="space-y-5">
              <h4 className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/45">
                Company
              </h4>
              <ul className="space-y-3 text-xs text-white/45">
                <li><Link href="/about" className="hover:text-amber-100 hover:underline">About</Link></li>
                <li><Link href="/events" className="hover:text-amber-100 hover:underline">Events</Link></li>
                <li><Link href="/security" className="hover:text-amber-100 hover:underline">Security</Link></li>
                <li><Link href="/contact" className="hover:text-amber-100 hover:underline">Contact</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="mt-16">
          <PolicyFooter isDark />
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
            © {year} ABRAHAM OF LONDON
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35 hover:text-amber-100 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35 hover:text-amber-100 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}