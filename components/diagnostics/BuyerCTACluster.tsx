"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Building2, Crown, Users } from "lucide-react";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type CtaCard = {
  href: string;
  title: string;
  body: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
  cta: string;
};

const CARDS: CtaCard[] = [
  {
    href: "/strategy-room",
    title: "Commission founder review",
    body:
      "For founder-led firms approaching complexity faster than internal clarity can support.",
    label: "Founder-led",
    icon: Crown,
    cta: "View Strategy Room criteria",
  },
  {
    href: "/diagnostics/executive-reporting",
    title: "View executive reporting",
    body:
      "For boards and institutions needing disciplined interpretation before formal intervention.",
    label: "Board / institution",
    icon: Building2,
    accent: true,
    cta: "View Executive Reporting",
  },
  {
    href: "/diagnostics",
    title: "Start with diagnostics",
    body:
      "For leadership teams needing a cleaner reading before deciding whether escalation is justified.",
    label: "Leadership team",
    icon: Users,
    cta: "Open diagnostics",
  },
];

export default function BuyerCTACluster() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {CARDS.map((card) => {
        const Icon = card.icon;

        return (
          <Link
            key={card.title}
            href={card.href}
            className={cn(
              "group border p-6 transition-colors",
              "shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]",
              card.accent
                ? "border-amber-500/24 bg-amber-500/[0.03] hover:border-amber-500/42 hover:bg-amber-500/[0.05]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.03]",
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-amber-400/68" />
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300/72">
                {card.label}
              </div>
            </div>

            <h3 className="mt-5 max-w-[14ch] font-serif text-2xl leading-tight text-white">
              {card.title}
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-white/50">
              {card.body}
            </p>

            <div className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/70">
              <span>{card.cta}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
