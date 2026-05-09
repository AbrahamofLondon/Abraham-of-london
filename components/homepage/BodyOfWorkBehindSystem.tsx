import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  HOMEPAGE_GOLD,
  SectionShell,
  mono,
} from "@/components/homepage/homepagePrimitives";

const cards = [
  {
    title: "Canon",
    body: "The governing ideas behind the institution.",
    href: "/canon",
    cta: "Read the Canon",
  },
  {
    title: "Evidence Standards",
    body: "How claims, memory, verification, and suppression are handled.",
    href: "/evidence/standards",
    cta: "Review Standards",
  },
  {
    title: "Frameworks & Playbooks",
    body: "Practical instruments for decisions under consequence.",
    href: "/frameworks",
    cta: "Explore Frameworks",
  },
  {
    title: "Market Intelligence",
    body: "Strategic intelligence for operators and decision-makers.",
    href: "/intelligence/market",
    cta: "View Intelligence",
  },
  {
    title: "Books & Essays",
    body: "Long-form thought behind the public work.",
    href: "/library",
    cta: "Browse Library",
  },
  {
    title: "Vault",
    body: "Restricted archive and controlled-access materials.",
    href: "/vault",
    cta: "Enter Vault",
  },
] as const;

export default function BodyOfWorkBehindSystem() {
  return (
    <SectionShell
      id="body-of-work"
      eyebrow="Body of work"
      title="The body of work behind the system."
      description="Abraham of London is not built on prompt output or generic assessment logic. The system is supported by a growing body of canon, evidence standards, frameworks, market intelligence, and long-form work. The public front door stays simple; the intellectual backbone remains available for those who want to examine the foundations."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group border border-white/[0.08] bg-white/[0.02] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-white/[0.03]"
          >
            <p
              style={{
                ...mono,
                fontSize: "9px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: `${HOMEPAGE_GOLD}CC`,
              }}
            >
              {card.title}
            </p>
            <p className="mt-3 text-[14px] leading-[1.8] text-white/58">
              {card.body}
            </p>
            <div
              className="mt-5 inline-flex items-center gap-2"
              style={{
                ...mono,
                fontSize: "10px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: `${HOMEPAGE_GOLD}D8`,
              }}
            >
              {card.cta}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}
